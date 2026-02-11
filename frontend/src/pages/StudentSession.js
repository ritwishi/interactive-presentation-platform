import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { getSession, getSlideImageUrl } from '../utils/api';

const StudentSession = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [session, setSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeActivity, setActiveActivity] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const studentId = sessionStorage.getItem('studentId');
  const studentName = sessionStorage.getItem('studentName');
  const presentation = session?.presentation;
  const slides = presentation?.slides || [];

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getSession(sessionCode);
        setSession(data);
        setCurrentSlide(data.currentSlide || 0);
        setLoading(false);
      } catch (error) {
        navigate('/student/join');
      }
    };
    loadSession();
  }, [sessionCode, navigate]);

  // Join socket room
  useEffect(() => {
    if (socket && session && studentId) {
      socket.emit('join-session', {
        sessionCode,
        studentId,
        studentName,
        role: 'student',
      });
    }
  }, [socket, session, sessionCode, studentId, studentName]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onSlideUpdated = ({ slideIndex }) => {
      setCurrentSlide(slideIndex);
      // Clear activity state when slide changes
      setActiveActivity(null);
      setSelectedAnswer(null);
      setTextAnswer('');
      setHasSubmitted(false);
      setResults(null);
    };

    const onActivityStarted = ({ activity }) => {
      setActiveActivity(activity);
      setSelectedAnswer(null);
      setTextAnswer('');
      setHasSubmitted(false);
      setResults(null);
    };

    const onActivityEnded = () => {
      setActiveActivity(null);
      setSelectedAnswer(null);
      setTextAnswer('');
      setHasSubmitted(false);
      setResults(null);
    };

    const onResultsRevealed = ({ results: newResults }) => {
      setResults(newResults);
    };

    const onSessionEnded = () => {
      setSessionEnded(true);
    };

    socket.on('slide-updated', onSlideUpdated);
    socket.on('activity-started', onActivityStarted);
    socket.on('activity-ended', onActivityEnded);
    socket.on('results-revealed', onResultsRevealed);
    socket.on('session-ended', onSessionEnded);

    return () => {
      socket.off('slide-updated', onSlideUpdated);
      socket.off('activity-started', onActivityStarted);
      socket.off('activity-ended', onActivityEnded);
      socket.off('results-revealed', onResultsRevealed);
      socket.off('session-ended', onSessionEnded);
    };
  }, [socket]);

  const handleSubmitMCQ = (optionIndex) => {
    if (hasSubmitted) return;
    setSelectedAnswer(optionIndex);
    const isCorrect = activeActivity.options[optionIndex]?.isCorrect || false;

    socket?.emit('submit-answer', {
      sessionCode,
      studentId,
      studentName,
      activityId: activeActivity._id,
      answer: String(optionIndex),
      isCorrect,
    });
    setHasSubmitted(true);
  };

  const handleSubmitOpenEnded = () => {
    if (hasSubmitted || !textAnswer.trim()) return;

    socket?.emit('submit-answer', {
      sessionCode,
      studentId,
      studentName,
      activityId: activeActivity._id,
      answer: textAnswer,
      isCorrect: null,
    });
    setHasSubmitted(true);
  };

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Class is Over!</h1>
          <p style={{ color: 'var(--text-medium)', marginBottom: '24px' }}>
            Great job participating today!
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-container">
          <div className="spinner" />
          <p>Joining class...</p>
        </div>
      </div>
    );
  }

  // Activity View (full screen overlay)
  if (activeActivity) {
    return (
      <div className="activity-overlay">
        <div className="activity-card">
          {/* Results View */}
          {results ? (
            <div>
              <h2>📊 Results</h2>
              {results.type === 'mcq' ? (
                <div style={{ marginTop: '16px' }}>
                  {Object.entries(results.options).map(([idx, opt]) => {
                    const percentage =
                      results.totalResponses > 0
                        ? Math.round((opt.count / results.totalResponses) * 100)
                        : 0;
                    return (
                      <div key={idx} style={{ marginBottom: '12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {opt.isCorrect ? '✅' : ''} {opt.text}
                          </span>
                          <span>
                            {opt.count} ({percentage}%)
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
                  {hasSubmitted && (
                    <p
                      style={{
                        marginTop: '16px',
                        fontWeight: 700,
                        color:
                          activeActivity.options[parseInt(selectedAnswer)]?.isCorrect
                            ? 'var(--accent-green)'
                            : 'var(--secondary)',
                      }}
                    >
                      {activeActivity.options[parseInt(selectedAnswer)]?.isCorrect
                        ? '🎉 You got it right!'
                        : '😊 Better luck next time!'}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: 'var(--text-medium)', marginBottom: '12px' }}>
                    {results.answers?.length || 0} responses received
                  </p>
                  {results.answers?.slice(0, 5).map((a, idx) => (
                    <div key={idx} className="response-item">
                      <span className="student-name">{a.name}</span>
                      <p className="answer-text">{a.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : hasSubmitted ? (
            /* Waiting after submission */
            <div className="waiting-state">
              <div className="emoji">⏳</div>
              <h2>Answer Submitted!</h2>
              <p style={{ color: 'var(--text-medium)' }}>
                Waiting for teacher to show results...
              </p>
            </div>
          ) : (
            /* Activity Form */
            <div>
              <h2 style={{ marginBottom: '4px' }}>
                {activeActivity.type === 'mcq' ? '🔘 Quiz Time!' : '✍️ Your Thoughts'}
              </h2>
              <p className="question">{activeActivity.question}</p>

              {activeActivity.type === 'mcq' ? (
                <div className="mcq-options">
                  {activeActivity.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`mcq-option ${selectedAnswer === idx ? 'selected' : ''}`}
                      onClick={() => handleSubmitMCQ(idx)}
                    >
                      {String.fromCharCode(65 + idx)}. {opt.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="open-answer">
                  <textarea
                    placeholder="Type your answer here..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                  />
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmitOpenEnded}
                    disabled={!textAnswer.trim()}
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    ✅ Submit Answer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal Slide View
  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="logo">📚 {session?.teacherName}'s Class</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700 }}>🎒 {studentName}</span>
          <span className="badge badge-connected">Connected</span>
        </div>
      </div>

      {/* Slide Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 70px)',
          padding: '20px',
          background: 'var(--bg-light)',
        }}
      >
        <div>
          <div className="slide-viewer" style={{ maxWidth: '900px' }}>
            {slides[currentSlide] ? (
              <img
                src={getSlideImageUrl(slides[currentSlide].imagePath)}
                alt={`Slide ${currentSlide + 1}`}
              />
            ) : (
              <div className="waiting-state" style={{ height: '100%' }}>
                <div className="emoji">📺</div>
                <h2>Waiting for teacher...</h2>
                <p style={{ color: 'var(--text-medium)' }}>
                  The presentation will appear here
                </p>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span className="slide-counter">
              Slide {currentSlide + 1} of {slides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSession;
