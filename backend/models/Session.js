const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  activityId: String,
  answer: String, // For MCQ: option index, For open-ended: text
  isCorrect: Boolean, // Only for MCQ
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const sessionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      length: 6,
    },
    presentation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Presentation',
      required: true,
    },
    teacherName: {
      type: String,
      default: 'Teacher',
    },
    currentSlide: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activeActivity: {
      type: String, // activity _id if an activity is currently active
      default: null,
    },
    students: [
      {
        studentId: String,
        name: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    responses: [responseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
