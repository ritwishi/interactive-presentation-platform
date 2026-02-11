const Presentation = require('../models/Presentation');
const { convertPresentation } = require('../utils/convertPresentation');
const path = require('path');

// @desc    Upload and process a presentation
// @route   POST /api/presentations/upload
const uploadPresentation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    const filePath = req.file.path;

    // Create presentation record first to get ID
    const presentation = new Presentation({
      title: title || req.file.originalname,
      originalFile: filePath,
      slides: [],
      activities: [],
    });

    await presentation.save();

    // Convert to slide images
    const slides = await convertPresentation(filePath, presentation._id.toString());

    // Update presentation with slides
    presentation.slides = slides;
    presentation.totalSlides = slides.length;
    await presentation.save();

    res.status(201).json({
      message: 'Presentation uploaded and processed successfully',
      presentation,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to process presentation' });
  }
};

// @desc    Get a presentation by ID
// @route   GET /api/presentations/:id
const getPresentation = async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }
    res.json(presentation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all presentations
// @route   GET /api/presentations
const getAllPresentations = async (req, res) => {
  try {
    const presentations = await Presentation.find()
      .select('title totalSlides createdAt activities')
      .sort({ createdAt: -1 });
    res.json(presentations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add activity to a presentation
// @route   POST /api/presentations/:id/activities
const addActivity = async (req, res) => {
  try {
    const { slideNumber, type, question, options } = req.body;

    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    if (slideNumber < 1 || slideNumber > presentation.totalSlides) {
      return res.status(400).json({ 
        message: `Slide number must be between 1 and ${presentation.totalSlides}` 
      });
    }

    const activity = {
      slideNumber,
      type,
      question,
      options: type === 'mcq' ? options : [],
    };

    presentation.activities.push(activity);
    await presentation.save();

    res.status(201).json({
      message: 'Activity added successfully',
      activity: presentation.activities[presentation.activities.length - 1],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove activity from a presentation
// @route   DELETE /api/presentations/:id/activities/:activityId
const removeActivity = async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    presentation.activities = presentation.activities.filter(
      (a) => a._id.toString() !== req.params.activityId
    );
    await presentation.save();

    res.json({ message: 'Activity removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPresentation,
  getPresentation,
  getAllPresentations,
  addActivity,
  removeActivity,
};
