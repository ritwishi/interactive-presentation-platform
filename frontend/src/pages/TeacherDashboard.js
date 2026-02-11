import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadPresentation,
  getAllPresentations,
  getPresentation,
  addActivity,
  removeActivity,
  createSession,
  getSlideImageUrl,
} from '../utils/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [presentations, setPresentations] = useState([]);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Activity form state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    slideNumber: 1,
    type: 'mcq',
    question: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  useEffect(() => {
    loadPresentations();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPresentations = async () => {
    try {
      const data = await getAllPresentations();
      setPresentations(data);
    } catch (error) {
      console.error('Error loading presentations:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress('Uploading and converting slides...');

    try {
      const formData = new FormData();
      formData.append('presentation', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      const data = await uploadPresentation(formData);
      showToast(`✅ "${data.presentation.title}" uploaded with ${data.presentation.totalSlides} slides!`);
      loadPresentations();
      setSelectedPresentation(data.presentation);
    } catch (error) {
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPresentation = async (id) => {
    try {
      const data = await getPresentation(id);
      setSelectedPresentation(data);
    } catch (error) {
      showToast('Failed to load presentation', 'error');
    }
  };

  const handleAddActivity = async () => {
    if (!activityForm.question.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }

    try {
      await addActivity(selectedPresentation._id, activityForm);
      showToast('Activity added!');
      setShowActivityForm(false);
      const updated = await getPresentation(selectedPresentation._id);
      setSelectedPresentation(updated);
      setActivityForm({
        slideNumber: 1,
        type: 'mcq',
        question: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add activity', 'error');
    }
  };

  const handleRemoveActivity = async (activityId) => {
    try {
      await removeActivity(selectedPresentation._id, activityId);
      showToast('Activity removed');
      const updated = await getPresentation(selectedPresentation._id);
      setSelectedPresentation(updated);
    } catch (error) {
      showToast('Failed to remove activity', 'error');
    }
  };

  const handleStartSession = async () => {
    if (!selectedPresentation) {
      showToast('Please select a presentation first', 'error');
      return;
    }

    try {
      const data = await createSession(selectedPresentation._id, teacherName || 'Teacher');
      navigate(`/teacher/present/${data.session.code}`);
    } catch (error) {
      showToast('Failed to create session', 'error');
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...activityForm.options];
    if (field === 'isCorrect') {
      newOptions.forEach((opt, i) => (opt.isCorrect = i === index));
    } else {
      newOptions[index][field] = value;
    }
    setActivityForm({ ...activityForm, options: newOptions });
  };

  // Filter presentations by search query
  const filteredPresentations = presentations.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="header" style={{ flexShrink: 0 }}>
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          📚 Interactive Classroom
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            className="input"
            placeholder="Your name"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            style={{ width: '160px' }}
          />
          <span className="badge badge-connected">👩‍🏫 Teacher</span>
        </div>
      </div>

      {/* Main Content — fixed height, no page scroll */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', height: '100%' }}>

          {/* ── LEFT PANEL: Upload + Scrollable List ── */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

            {/* Upload Area — compact */}
            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '16px', padding: '20px', flexShrink: 0 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '24px', height: '24px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{uploadProgress}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>📤</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Click to upload PDF or PPT</p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Max 50MB • PDF, PPT, PPTX</p>
                  </div>
                </div>
              )}
            </div>

            {/* Search + Count Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.5 }}>🔍</span>
                <input
                  className="input"
                  placeholder="Search presentations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', fontSize: '0.9rem', padding: '10px 12px 10px 36px' }}
                />
              </div>
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {filteredPresentations.length} file{filteredPresentations.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Scrollable Presentations List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              paddingRight: '4px',
            }}>
              {filteredPresentations.map((p) => (
                <div
                  key={p._id}
                  onClick={() => handleSelectPresentation(p._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: selectedPresentation?._id === p._id ? '#F0EEFF' : 'white',
                    border: selectedPresentation?._id === p._id ? '2px solid var(--primary)' : '2px solid #F0F0F0',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedPresentation?._id === p._id ? '0 2px 12px rgba(108,99,255,0.12)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPresentation?._id !== p._id) {
                      e.currentTarget.style.borderColor = '#D0D0FF';
                      e.currentTarget.style.background = '#FAFAFE';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPresentation?._id !== p._id) {
                      e.currentTarget.style.borderColor = '#F0F0F0';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  {/* File icon */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: selectedPresentation?._id === p._id ? 'var(--primary)' : '#F0EEFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}>
                    {selectedPresentation?._id === p._id ? '📖' : '📄'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: selectedPresentation?._id === p._id ? 'var(--primary)' : 'var(--text-dark)',
                    }}>
                      {p.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-medium)' }}>
                      <span>📊 {p.totalSlides} slides</span>
                      <span>🎯 {p.activities?.length || 0} activities</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', flexShrink: 0 }}>›</span>
                </div>
              ))}

              {filteredPresentations.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-light)' }}>
                  {searchQuery ? (
                    <>
                      <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</p>
                      <p>No presentations match "<strong>{searchQuery}</strong>"</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📁</p>
                      <p>No presentations yet. Upload one above!</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Preview & Activities ── */}
          <div style={{ overflow: 'auto', height: '100%', minHeight: 0 }}>
            {selectedPresentation ? (
              <>
                <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>{selectedPresentation.title}</h2>

                {/* Slide Preview */}
                {selectedPresentation.slides?.length > 0 && (
                  <div className="slide-viewer" style={{ marginBottom: '20px' }}>
                    <img
                      src={getSlideImageUrl(selectedPresentation.slides[0].imagePath)}
                      alt="Slide 1"
                    />
                  </div>
                )}

                {/* Start Session Button */}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleStartSession}
                  style={{ width: '100%', marginBottom: '20px' }}
                >
                  🚀 Start Live Session
                </button>

                {/* Activities Section */}
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3>🎯 Activities ({selectedPresentation.activities?.length || 0})</h3>
                    <button
                      className="btn btn-outline"
                      onClick={() => setShowActivityForm(!showActivityForm)}
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      {showActivityForm ? '✕ Cancel' : '+ Add Activity'}
                    </button>
                  </div>

                  {/* Activity Form */}
                  {showActivityForm && (
                    <div style={{ background: '#F8F7FF', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                      <div className="input-group">
                        <label>After Slide #</label>
                        <input
                          className="input"
                          type="number"
                          min={1}
                          max={selectedPresentation.totalSlides}
                          value={activityForm.slideNumber}
                          onChange={(e) =>
                            setActivityForm({ ...activityForm, slideNumber: parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div className="input-group">
                        <label>Activity Type</label>
                        <select
                          className="input"
                          value={activityForm.type}
                          onChange={(e) =>
                            setActivityForm({ ...activityForm, type: e.target.value })
                          }
                        >
                          <option value="mcq">MCQ (Multiple Choice)</option>
                          <option value="open-ended">Open-ended Question</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label>Question</label>
                        <input
                          className="input"
                          placeholder="Enter your question..."
                          value={activityForm.question}
                          onChange={(e) =>
                            setActivityForm({ ...activityForm, question: e.target.value })
                          }
                        />
                      </div>

                      {activityForm.type === 'mcq' && (
                        <div className="input-group">
                          <label>Options (click radio to mark correct answer)</label>
                          {activityForm.options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                              <input
                                type="radio"
                                name="correctOption"
                                checked={opt.isCorrect}
                                onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                                style={{ width: '20px', height: '20px' }}
                              />
                              <input
                                className="input"
                                placeholder={`Option ${idx + 1}`}
                                value={opt.text}
                                onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <button className="btn btn-success" onClick={handleAddActivity}>
                        ✅ Add Activity
                      </button>
                    </div>
                  )}

                  {/* Activity List */}
                  {selectedPresentation.activities?.map((activity) => (
                    <div key={activity._id} className="response-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <span className="badge" style={{ background: activity.type === 'mcq' ? '#E8F8E8' : '#FFF3E0', color: activity.type === 'mcq' ? 'var(--accent-green)' : 'var(--accent-orange)', marginBottom: '6px' }}>
                            {activity.type === 'mcq' ? '🔘 MCQ' : '✍️ Open-ended'}
                          </span>
                          <p style={{ fontWeight: 700, marginTop: '4px' }}>After slide {activity.slideNumber}</p>
                          <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>{activity.question}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveActivity(activity._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--secondary)' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!selectedPresentation.activities || selectedPresentation.activities.length === 0) && !showActivityForm && (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '12px' }}>
                      No activities yet. Add one to make your presentation interactive!
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-light)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.6 }}>👈</div>
                <p style={{ fontSize: '1.1rem' }}>Select a presentation from the list</p>
                <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>or upload a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;