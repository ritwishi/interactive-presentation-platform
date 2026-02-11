import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ textAlign: 'center', color: 'white', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '12px' }}>
          📚 Interactive Classroom
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Present, Engage, and Learn Together!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Teacher Card */}
        <div
          className="card"
          onClick={() => navigate('/teacher/dashboard')}
          style={{
            width: '280px',
            textAlign: 'center',
            cursor: 'pointer',
            padding: '40px 30px',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👩‍🏫</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '8px' }}>
            I'm a Teacher
          </h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '0.95rem' }}>
            Upload presentations, add activities, and lead your classroom
          </p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: '20px', width: '100%' }}>
            Start Teaching →
          </button>
        </div>

        {/* Student Card */}
        <div
          className="card"
          onClick={() => navigate('/student/join')}
          style={{
            width: '280px',
            textAlign: 'center',
            cursor: 'pointer',
            padding: '40px 30px',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎒</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', marginBottom: '8px' }}>
            I'm a Student
          </h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '0.95rem' }}>
            Join a live session with a code and participate in activities
          </p>
          <button className="btn btn-secondary btn-lg" style={{ marginTop: '20px', width: '100%' }}>
            Join Class →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
