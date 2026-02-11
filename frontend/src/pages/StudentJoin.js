import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../utils/api';

const StudentJoin = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Please enter both your name and session code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await joinSession(code.toUpperCase(), name);
      // Store student info in sessionStorage
      sessionStorage.setItem('studentId', data.studentId);
      sessionStorage.setItem('studentName', name);
      navigate(`/student/session/${code.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join session. Check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-center"
      style={{
        background: 'linear-gradient(135deg, #FF6584 0%, #FF8C32 100%)',
      }}
    >
      <div style={{ textAlign: 'center', color: 'white', marginBottom: '32px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🎒</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Join a Class</h1>
        <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>
          Enter the code your teacher shared
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <form onSubmit={handleJoin}>
          <div className="input-group">
            <label>Your Name</label>
            <input
              className="input"
              placeholder="e.g., Ritwik"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          <div className="input-group">
            <label>Session Code</label>
            <input
              className="input"
              placeholder="e.g., ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '6px',
                fontWeight: 800,
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: 'var(--secondary)',
                fontSize: '0.9rem',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Joining...' : '🚀 Join Class!'}
          </button>
        </form>

        <button
          className="btn btn-outline"
          onClick={() => navigate('/')}
          style={{ width: '100%', marginTop: '12px' }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default StudentJoin;
