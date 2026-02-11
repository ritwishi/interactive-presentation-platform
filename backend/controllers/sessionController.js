const Session = require('../models/Session');
const Presentation = require('../models/Presentation');
const { generateSessionCode } = require('../utils/generateCode');

// @desc    Create a new session
// @route   POST /api/sessions/create
const createSession = async (req, res) => {
  try {
    const { presentationId, teacherName } = req.body;

    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    // Generate unique 6-char code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateSessionCode();
      const existing = await Session.findOne({ code, isActive: true });
      if (!existing) isUnique = true;
    }

    const session = new Session({
      code,
      presentation: presentationId,
      teacherName: teacherName || 'Teacher',
      currentSlide: 0,
      isActive: true,
      students: [],
      responses: [],
    });

    await session.save();

    // Populate presentation data
    await session.populate('presentation');

    res.status(201).json({
      message: 'Session created successfully',
      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a session (student)
// @route   POST /api/sessions/join
const joinSession = async (req, res) => {
  try {
    const { code, studentName } = req.body;

    const session = await Session.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    }).populate('presentation');

    if (!session) {
      return res.status(404).json({ message: 'Session not found or has ended' });
    }

    // Generate a unique student ID
    const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Add student to session
    session.students.push({
      studentId,
      name: studentName,
    });
    await session.save();

    res.json({
      message: 'Joined session successfully',
      session: {
        code: session.code,
        teacherName: session.teacherName,
        currentSlide: session.currentSlide,
        presentation: session.presentation,
        activeActivity: session.activeActivity,
      },
      studentId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session by code
// @route   GET /api/sessions/:code
const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ 
      code: req.params.code.toUpperCase() 
    }).populate('presentation');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End a session
// @route   POST /api/sessions/:code/end
const endSession = async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  joinSession,
  getSession,
  endSession,
};
