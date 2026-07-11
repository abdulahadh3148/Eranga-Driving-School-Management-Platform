import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, doc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import './Dashboard.css';

// ─── Constants ─────────────────────────────────────────────
const PROGRESS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#94a3b8', icon: 'circle' },
  { value: 'started', label: 'Started', color: '#3b82f6', icon: 'play_circle' },
  { value: 'practicing', label: 'Practicing', color: '#f59e0b', icon: 'directions_car' },
  { value: 'needs_improvement', label: 'Needs Improvement', color: '#ef4444', icon: 'warning' },
  { value: 'completed', label: 'Completed', color: '#22c55e', icon: 'check_circle' },
];

const CAR_SKILLS = ['Clutch Control', 'Forward Driving', 'Reverse Driving', 'Turning', 'Road Rules', 'Proper Stopping'];
const BIKE_SKILLS = ['Forward Balance', 'Signal Usage', 'Figure-8 Practice', 'Road Rules'];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const { currentUser, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [toastMessage, setToastMessage] = useState('');
  const [completingSession, setCompletingSession] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionProgress, setSessionProgress] = useState('not_started');
  const [sessionSkills, setSessionSkills] = useState({});
  const [sessionPerformance, setSessionPerformance] = useState('Average');

  // ─── Determine instructor ID ────────────────────────────────────────────
  const instructorId = userProfile?.id || userProfile?.uid || currentUser?.uid;

  // ─── Fetch sessions for this instructor ─────────────────────────────────
  useEffect(() => {
    if (!instructorId) return;

    setLoading(true);
    setError(null);

    // Real-time listener on sessions collection
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('instructorId', '==', instructorId)
    );

    const unsub = onSnapshot(sessionsQuery, (snap) => {
      const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`[Instructor Dashboard] Fetched ${allSessions.length} total sessions for instructor: ${instructorId}`);
      setSessions(allSessions);
      setLoading(false);
    }, (err) => {
      console.error('[Instructor Dashboard] Listener error:', err);
      setError('Failed to load sessions. Please check your connection.');
      setLoading(false);
    });

    return () => unsub();
  }, [instructorId]);

  // ─── Filter & group by date and time ────────────────────────────────────
  const todaySessions = sessions.filter(s => s.date === selectedDate);

  const groupedByTime = todaySessions.reduce((acc, s) => {
    const slot = s.time || 'Unscheduled';
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(s);
    return acc;
  }, {});

  // Sort time slots
  const sortedTimeSlots = Object.keys(groupedByTime).sort((a, b) => a.localeCompare(b));

  // ─── Stats ──────────────────────────────────────────────────────────────
  const totalToday = todaySessions.length;
  const presentCount = todaySessions.filter(s => s.attendance === 'present').length;
  const absentCount = todaySessions.filter(s => s.attendance === 'absent').length;
  const completedCount = todaySessions.filter(s => s.status === 'completed').length;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAttendance = async (sessionId, value) => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        attendance: value,
        updatedAt: new Date().toISOString()
      });
      showToast(value === 'present' ? '✅ Marked Present' : '❌ Marked Absent');
    } catch (err) {
      console.error('Error updating attendance:', err);
      showToast('Failed to update attendance');
    }
  };

  const handleProgressChange = async (sessionId, newProgress) => {
    try {
      const updates = {
        progress: newProgress,
        updatedAt: new Date().toISOString()
      };

      // If marking as completed, also set session status
      if (newProgress === 'completed') {
        updates.status = 'completed';
      }

      await updateDoc(doc(db, 'sessions', sessionId), updates);

      // If progress = completed, also update the student's overall status
      if (newProgress === 'completed') {
        const session = sessions.find(s => s.id === sessionId);
        if (session?.studentId) {
          try {
            await updateDoc(doc(db, 'users', session.studentId), {
              currentStep: 'PRACTICE_COMPLETED',
              status: 'PRACTICE_COMPLETED',
              progress: 100
            });
          } catch (studentErr) {
            console.warn('Could not update student status:', studentErr);
          }
        }
      }

      showToast('Progress updated!');
    } catch (err) {
      console.error('Error updating progress:', err);
      showToast('Failed to update progress');
    }
  };

  const handleOpenCompleteModal = (session) => {
    setCompletingSession(session);
    setSessionNotes(session.notes || '');
    setSessionProgress(session.progress || 'not_started');
    setSessionSkills({});
    setSessionPerformance('Average');
  };

  const handleCompleteSubmit = async () => {
    if (!completingSession) return;

    try {
      const updates = {
        status: 'completed',
        progress: sessionProgress,
        notes: sessionNotes,
        attendance: completingSession.attendance || 'present',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'sessions', completingSession.id), updates);

      // Create session_progress document
      const progressDoc = {
        sessionId: completingSession.id,
        studentId: completingSession.studentId,
        instructorId: instructorId,
        date: completingSession.date,
        attendance: completingSession.attendance || 'present',
        skills: sessionSkills,
        performance: sessionPerformance,
        notes: sessionNotes,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'session_progress'), progressDoc);

      // Update student status if progress is completed
      if (sessionProgress === 'completed' && completingSession.studentId) {
        try {
          await updateDoc(doc(db, 'users', completingSession.studentId), {
            currentStep: 'PRACTICE_COMPLETED',
            status: 'PRACTICE_COMPLETED',
            progress: 100
          });
        } catch (studentErr) {
          console.warn('Could not update student status:', studentErr);
        }
      }

      setCompletingSession(null);
      showToast('Session completed successfully! 🎉');
    } catch (err) {
      console.error('Error completing session:', err);
      showToast('Failed to complete session');
    }
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status');
    }
  };

  // ─── Date Navigation ───────────────────────────────────────────────────
  const goToDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner"></div>
        <p>Loading your sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <span className="material-symbols-outlined">error</span>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toastMessage && (
        <div className="dash-toast">
          <span className="material-symbols-outlined">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="dash-header">
        <div>
          <h2 className="dash-title">
            {isToday ? "Today's Sessions" : `Sessions for ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
          </h2>
          <p className="dash-subtitle">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Date Navigation */}
        <div className="dash-date-nav">
          <button onClick={() => goToDate(-1)} className="dash-date-btn">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className={`dash-date-btn ${isToday ? 'active' : ''}`}>
            Today
          </button>
          <button onClick={() => goToDate(1)} className="dash-date-btn">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="material-symbols-outlined">groups</span>
          <div>
            <span className="stat-number">{totalToday}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="dash-stat present">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <span className="stat-number">{presentCount}</span>
            <span className="stat-label">Present</span>
          </div>
        </div>
        <div className="dash-stat absent">
          <span className="material-symbols-outlined">cancel</span>
          <div>
            <span className="stat-number">{absentCount}</span>
            <span className="stat-label">Absent</span>
          </div>
        </div>
        <div className="dash-stat completed">
          <span className="material-symbols-outlined">task_alt</span>
          <div>
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>
      </div>

      {/* Sessions Grouped by Time */}
      <div className="dash-sessions">
        {sortedTimeSlots.length > 0 ? (
          sortedTimeSlots.map(slot => (
            <div key={slot} className="time-slot-group">
              <div className="time-slot-header">
                <span className="material-symbols-outlined">schedule</span>
                <span>{slot} Batch</span>
                <span className="time-slot-count">{groupedByTime[slot].length} student(s)</span>
              </div>

              <div className="session-cards">
                {groupedByTime[slot].map(session => {
                  const isCompleted = session.status === 'completed';
                  const isPresent = session.attendance === 'present';
                  const isAbsent = session.attendance === 'absent';
                  const progressOption = PROGRESS_OPTIONS.find(p => p.value === (session.progress || 'not_started'));

                  return (
                    <div key={session.id} className={`session-card ${isCompleted ? 'completed' : ''} ${isAbsent ? 'absent' : ''}`}>
                      {/* Student Info Header */}
                      <div className="session-card-top">
                        <div className="student-info">
                          <div className="student-avatar">
                            {session.studentName ? session.studentName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <h3 className="student-name">{session.studentName || 'Unknown Student'}</h3>
                            <p className="student-meta">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>directions_car</span>
                              {session.vehicleType || 'Any'} • ID: {session.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="session-badges">
                          <span className={`status-badge status-${session.status || 'scheduled'}`}>
                            {session.status || 'Scheduled'}
                          </span>
                        </div>
                      </div>

                      {/* Completed State */}
                      {isCompleted ? (
                        <div className="session-completed-bar">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span>Session Completed</span>
                          {session.notes && <p className="completed-notes">Notes: {session.notes}</p>}
                        </div>
                      ) : (
                        <>
                          {/* Attendance Section */}
                          <div className={`attendance-section ${isAbsent ? 'absent-bg' : ''}`}>
                            <span className="section-label">Attendance</span>
                            <div className="attendance-btns">
                              <button
                                className={`att-btn present-btn ${isPresent ? 'active' : ''}`}
                                onClick={() => handleAttendance(session.id, 'present')}
                              >
                                <span className="material-symbols-outlined">check</span>
                                Present
                              </button>
                              <button
                                className={`att-btn absent-btn ${isAbsent ? 'active' : ''}`}
                                onClick={() => handleAttendance(session.id, 'absent')}
                              >
                                <span className="material-symbols-outlined">close</span>
                                Absent
                              </button>
                            </div>
                          </div>

                          {/* Progress Section (show only if present) */}
                          {isPresent && (
                            <div className="progress-section">
                              <span className="section-label">Training Progress</span>
                              <select
                                className="progress-select"
                                value={session.progress || 'not_started'}
                                onChange={(e) => handleProgressChange(session.id, e.target.value)}
                                style={{ borderColor: progressOption?.color }}
                              >
                                {PROGRESS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {(isPresent || isAbsent) && (
                            <div className="session-actions">
                              {isPresent && session.status !== 'ongoing' && (
                                <button
                                  className="action-btn start-btn"
                                  onClick={() => handleStatusChange(session.id, 'ongoing')}
                                >
                                  <span className="material-symbols-outlined">play_arrow</span>
                                  Start Session
                                </button>
                              )}
                              <button
                                className="action-btn complete-btn"
                                onClick={() => handleOpenCompleteModal(session)}
                              >
                                <span className="material-symbols-outlined">check_circle</span>
                                Complete & Add Notes
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="dash-empty">
            <span className="material-symbols-outlined">event_available</span>
            <h3>No Sessions</h3>
            <p>No sessions scheduled for this date. Enjoy your break!</p>
          </div>
        )}
      </div>

      {/* Complete Session Modal */}
      {completingSession && (
        <div className="modal-overlay" onClick={() => setCompletingSession(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              <span className="material-symbols-outlined">check_circle</span>
              Complete Session
            </h3>
            <p className="modal-student">
              Student: <strong>{completingSession.studentName}</strong> 
              <span style={{color: '#64748b', fontSize: 13, marginLeft: 8}}>({completingSession.vehicleType || 'Car'})</span>
            </p>

            <div className="modal-scroll-area">
              <div className="modal-field">
                <label>Skills Practiced</label>
                <div className="skills-grid">
                  {(completingSession.vehicleType?.toLowerCase().includes('bike') ? BIKE_SKILLS : CAR_SKILLS).map(skill => (
                    <label key={skill} className="skill-checkbox">
                      <input 
                        type="checkbox" 
                        checked={!!sessionSkills[skill]} 
                        onChange={(e) => setSessionSkills({...sessionSkills, [skill]: e.target.checked})}
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label>Performance Rating</label>
                  <select
                    value={sessionPerformance}
                    onChange={e => setSessionPerformance(e.target.value)}
                    className="modal-select"
                  >
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>Overall Progress</label>
                  <select
                    value={sessionProgress}
                    onChange={e => setSessionProgress(e.target.value)}
                    className="modal-select"
                  >
                    {PROGRESS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label>Instructor Notes (Feedback, Mistakes, Suggestions)</label>
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="e.g., Good clutch control. Needs more practice with hill starts..."
                  rows={3}
                  className="modal-textarea"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setCompletingSession(null)}>
                Cancel
              </button>
              <button className="modal-btn submit" onClick={handleCompleteSubmit}>
                <span className="material-symbols-outlined">check</span>
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
