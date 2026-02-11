const Session = require('../models/Session');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ─── JOIN SESSION ROOM ────────────────────────────────
    socket.on('join-session', ({ sessionCode, studentId, studentName, role }) => {
      socket.join(sessionCode);
      socket.sessionCode = sessionCode;
      socket.role = role;
      socket.studentId = studentId;

      console.log(`👤 ${role} joined session: ${sessionCode}`);

      if (role === 'student') {
        // Notify teacher that a student joined
        io.to(sessionCode).emit('student-joined', {
          studentId,
          studentName,
          totalStudents: io.sockets.adapter.rooms.get(sessionCode)?.size || 0,
        });
      }
    });

    // ─── TEACHER: CHANGE SLIDE ────────────────────────────
    socket.on('slide-change', async ({ sessionCode, slideIndex }) => {
      try {
        // Update DB
        await Session.findOneAndUpdate(
          { code: sessionCode },
          { currentSlide: slideIndex, activeActivity: null }
        );

        // Broadcast to all students in the session
        socket.to(sessionCode).emit('slide-updated', { slideIndex });
        console.log(`📊 Slide changed to ${slideIndex} in session ${sessionCode}`);
      } catch (error) {
        console.error('Slide change error:', error);
      }
    });

    // ─── TEACHER: START ACTIVITY ──────────────────────────
    socket.on('activity-start', async ({ sessionCode, activity }) => {
      try {
        await Session.findOneAndUpdate(
          { code: sessionCode },
          { activeActivity: activity._id }
        );

        // Send activity to all students
        socket.to(sessionCode).emit('activity-started', { activity });
        console.log(`🎯 Activity started in session ${sessionCode}: ${activity.question}`);
      } catch (error) {
        console.error('Activity start error:', error);
      }
    });

    // ─── STUDENT: SUBMIT ANSWER ───────────────────────────
    socket.on('submit-answer', async ({ sessionCode, studentId, studentName, activityId, answer, isCorrect }) => {
      try {
        // Save response to DB
        await Session.findOneAndUpdate(
          { code: sessionCode },
          {
            $push: {
              responses: {
                studentId,
                studentName,
                activityId,
                answer,
                isCorrect,
              },
            },
          }
        );

        // Notify teacher of the new response
        io.to(sessionCode).emit('answer-received', {
          studentId,
          studentName,
          activityId,
          answer,
          isCorrect,
        });

        console.log(`✅ Answer received from ${studentName} in session ${sessionCode}`);
      } catch (error) {
        console.error('Submit answer error:', error);
      }
    });

    // ─── TEACHER: SHOW RESULTS TO STUDENTS ────────────────
    socket.on('show-results', ({ sessionCode, activityId, results }) => {
      socket.to(sessionCode).emit('results-revealed', { activityId, results });
      console.log(`📈 Results shown in session ${sessionCode}`);
    });

    // ─── TEACHER: END ACTIVITY ────────────────────────────
    socket.on('activity-end', async ({ sessionCode }) => {
      try {
        await Session.findOneAndUpdate(
          { code: sessionCode },
          { activeActivity: null }
        );

        socket.to(sessionCode).emit('activity-ended');
        console.log(`⏹️  Activity ended in session ${sessionCode}`);
      } catch (error) {
        console.error('Activity end error:', error);
      }
    });

    // ─── END SESSION ──────────────────────────────────────
    socket.on('end-session', async ({ sessionCode }) => {
      try {
        await Session.findOneAndUpdate(
          { code: sessionCode },
          { isActive: false }
        );

        io.to(sessionCode).emit('session-ended');
        console.log(`🔚 Session ended: ${sessionCode}`);
      } catch (error) {
        console.error('End session error:', error);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      if (socket.sessionCode && socket.role === 'student') {
        io.to(socket.sessionCode).emit('student-left', {
          studentId: socket.studentId,
        });
      }
    });
  });
}

module.exports = setupSocket;
