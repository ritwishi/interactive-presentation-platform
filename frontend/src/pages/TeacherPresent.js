import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { getSession, getSlideImageUrl } from '../utils/api';

const TeacherPresent = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [session, setSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [students, setStudents] = useState([]);
  const [activeActivity, setActiveActivity] = useState(null);
  const [responses, setResponses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  const presentation = session?.presentation;
  const slides = presentation?.slides || [];
  const activities = presentation?.activities || [];

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getSession(sessionCode);
        setSession(data);
        setCurrentSlide(data.currentSlide || 0);
        setStudents(data.students || []);
        setLoading(false);
      } catch (error) {
        navigate('/teacher/dashboard');
      }
    };
    loadSession();
  }, [sessionCode, navigate]);

  useEffect(() => {
    if (socket && session) {
      socket.emit('join-session', { sessionCode, role: 'teacher' });
    }
  }, [socket, session, sessionCode]);

  useEffect(() => {
    if (!socket) return;

    const onStudentJoined = ({ studentId, studentName }) => {
      setStudents((prev) => {
        if (prev.find((s) => s.studentId === studentId)) return prev;
        return [...prev, { studentId, name: studentName }];
      });
    };

    const onStudentLeft = ({ studentId }) => {
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
    };

    const onAnswerReceived = (response) => {
      setResponses((prev) => [...prev, response]);
    };

    socket.on('student-joined', onStudentJoined);
    socket.on('student-left', onStudentLeft);
    socket.on('answer-received', onAnswerReceived);

    return () => {
      socket.off('student-joined', onStudentJoined);
      socket.off('student-left', onStudentLeft);
      socket.off('answer-received', onAnswerReceived);
    };
  }, [socket]);

  const getActivityForSlide = useCallback(
    (slideIndex) => activities.find((a) => a.slideNumber === slideIndex + 1),
    [activities]
  );

  const startActivity = (activity) => {
    setActiveActivity(activity);
    setResponses([]);
    setShowResults(false);
    socket?.emit('activity-start', { sessionCode, activity });
  };

  const endActivity = () => {
    setActiveActivity(null);
    setShowResults(false);
    socket?.emit('activity-end', { sessionCode });
  };

  const goToSlide = (index) => {
    if (index < 0 || index >= slides.length) return;
    if (activeActivity) endActivity();
    setCurrentSlide(index);
    setShowResults(false);
    socket?.emit('slide-change', { sessionCode, slideIndex: index });

    const activity = getActivityForSlide(index);
    if (activity) {
      setTimeout(() => startActivity(activity), 500);
    }
  };

  const handleShowResults = () => {
    setShowResults(true);
    const activityResponses = responses.filter((r) => r.activityId === activeActivity._id);
    let results;
    if (activeActivity.type === 'mcq') {
      const optionCounts = {};
      activeActivity.options.forEach((opt, idx) => {
        optionCounts[idx] = { text: opt.text, count: 0, isCorrect: opt.isCorrect };
      });
      activityResponses.forEach((r) => {
        if (optionCounts[r.answer]) optionCounts[r.answer].count++;
      });
      results = { type: 'mcq', options: optionCounts, totalResponses: activityResponses.length };
    } else {
      results = {
        type: 'open-ended',
        answers: activityResponses.map((r) => ({ name: r.studentName, answer: r.answer })),
      };
    }
    socket?.emit('show-results', { sessionCode, activityId: activeActivity._id, results });
  };

  const handleEndSession = () => {
    socket?.emit('end-session', { sessionCode });
    navigate('/teacher/dashboard');
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  const currentActivityResponses = responses.filter((r) => r.activityId === activeActivity?._id);

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="logo">📚 Live Session</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="student-count">
            👥 {students.length} student{students.length !== 1 ? 's' : ''}
          </div>
          <div
            className="session-code"
            style={{ fontSize: '1.2rem', padding: '8px 16px', letterSpacing: '4px' }}
          >
            {sessionCode}
          </div>
          <span className="badge badge-live">🔴 LIVE</span>
          <button
            className="btn btn-secondary"
            onClick={handleEndSession}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            End Session
          </button>
        </div>
      </div>

      <div className="teacher-layout">
        {/* Main Slide Area */}
        <div className="teacher-main">
          <div className="slide-viewer">
            {slides[currentSlide] && (
              <img
                src={getSlideImageUrl(slides[currentSlide].imagePath)}
                alt={`Slide ${currentSlide + 1}`}
              />
            )}
          </div>

          <div className="slide-controls">
            <button
              className="btn btn-outline"
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
            >
              ← Previous
            </button>
            <span className="slide-counter">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => goToSlide(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
            >
              Next →
            </button>
          </div>

          {/* Manual Activity Trigger */}
          {!activeActivity &&
            activities
              .filter((a) => a.slideNumber === currentSlide + 1)
              .map((activity) => (
                <button
                  key={activity._id}
                  className="btn btn-warning"
                  onClick={() => startActivity(activity)}
                  style={{ marginTop: '16px' }}
                >
                  🎯 Start Activity: {activity.question.substring(0, 40)}...
                </button>
              ))}
        </div>

        {/* Sidebar */}
        <div className="teacher-sidebar">
          {activeActivity ? (
            <div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '12px' }}>🎯 Active Activity</h3>

              <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <span
                  className="badge"
                  style={{
                    background: activeActivity.type === 'mcq' ? '#E8F8E8' : '#FFF3E0',
                    color:
                      activeActivity.type === 'mcq'
                        ? 'var(--accent-green)'
                        : 'var(--accent-orange)',
                  }}
                >
                  {activeActivity.type === 'mcq' ? '🔘 MCQ' : '✍️ Open-ended'}
                </span>
                <p style={{ fontWeight: 700, marginTop: '8px' }}>{activeActivity.question}</p>
              </div>

              <div className="student-count" style={{ marginBottom: '12px' }}>
                ✅ {currentActivityResponses.length} / {students.length} responded
              </div>

              {/* Responses */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {currentActivityResponses.map((r, idx) => (
                  <div key={idx} className="response-item">
                    <span className="student-name">{r.studentName}</span>
                    <p className="answer-text">
                      {activeActivity.type === 'mcq'
                        ? activeActivity.options[parseInt(r.answer)]?.text || r.answer
                        : r.answer}
                    </p>
                    {activeActivity.type === 'mcq' && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: r.isCorrect ? 'var(--accent-green)' : 'var(--secondary)',
                        }}
                      >
                        {r.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* MCQ Results Summary */}
              {showResults && activeActivity.type === 'mcq' && (
                <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                  <h4 style={{ marginBottom: '8px' }}>📊 Results</h4>
                  {activeActivity.options.map((opt, idx) => {
                    const count = currentActivityResponses.filter(
                      (r) => parseInt(r.answer) === idx
                    ).length;
                    const percentage =
                      currentActivityResponses.length > 0
                        ? Math.round((count / currentActivityResponses.length) * 100)
                        : 0;
                    return (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span>
                            {opt.isCorrect ? '✅' : ''} {opt.text}
                          </span>
                          <span>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="result-bar">
                          <div
                            className="result-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              background: opt.isCorrect
                                ? 'var(--accent-green)'
                                : 'var(--primary-light)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {!showResults && (
                  <button className="btn btn-success" onClick={handleShowResults} style={{ flex: 1 }}>
                    📊 Show Results
                  </button>
                )}
                <button className="btn btn-secondary" onClick={endActivity} style={{ flex: 1 }}>
                  ⏹️ End Activity
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: '16px' }}>👥 Students ({students.length})</h3>
              {students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</p>
                  <p>Waiting for students to join...</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                    Share code: <strong>{sessionCode}</strong>
                  </p>
                </div>
              ) : (
                students.map((s, idx) => (
                  <div
                    key={s.studentId || idx}
                    style={{
                      padding: '10px 12px',
                      background: '#F8F7FF',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    🎒 {s.name}
                  </div>
                ))
              )}

              {/* Slide Activities Overview */}
              <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>🎯 Activities</h3>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  No activities configured
                </p>
              ) : (
                activities.map((a) => (
                  <div
                    key={a._id}
                    className="response-item"
                    style={{
                      opacity: a.slideNumber === currentSlide + 1 ? 1 : 0.6,
                      borderColor:
                        a.slideNumber === currentSlide + 1 ? 'var(--primary)' : '#E8E8E8',
                    }}
                  >
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>
                      Slide {a.slideNumber} • {a.type.toUpperCase()}
                    </p>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.question}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherPresent;
