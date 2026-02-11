const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  slideNumber: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'open-ended'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  // For open-ended, options will be empty
});

const presentationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    originalFile: {
      type: String, // path to uploaded file
      required: true,
    },
    slides: [
      {
        slideNumber: Number,
        imagePath: String, // path to converted image
      },
    ],
    activities: [activitySchema],
    totalSlides: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Presentation', presentationSchema);
