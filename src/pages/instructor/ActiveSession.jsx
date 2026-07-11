import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { createSessionProgress } from '../../firebase/helpers';
import { 
  ArrowLeft, Play, Pause, XCircle, CheckCircle2,
  Car, Clock, GraduationCap
} from 'lucide-react';
import './ActiveSession.css';

export default function ActiveSession() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live state
  const [status, setStatus] = useState('not-started'); // not-started, ongoing, paused
  const [elapsed, setElapsed] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Progress & Notes
  const [skills, setSkills] = useState([]); // Dynamic skills from package
  const [checkedSkills, setCheckedSkills] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Attendance & Performance
  const [attendance, setAttendance] = useState('present');
  const [performance, setPerformance] = useState('Good');

  // Load session and package skills
  useEffect(() => {
    if (!currentUser || !sessionId) {
      if (!sessionId) setError('No session selected.');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'sessions', sessionId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.instructorId !== currentUser.uid) {
            setError('You do not have permission for this session.');
          } else {
            setSession({ id: docSnap.id, ...data });
            
            // Fetch the student's combo package to get the exact skills to track
            if (data.studentPackageId) {
              const pkgSnap = await getDoc(doc(db, 'student_packages', data.studentPackageId));
              if (pkgSnap.exists()) {
                 const pkgData = pkgSnap.data();
                 if (pkgData.skills) {
                   setSkills(pkgData.skills.map(s => s.name));
                 }
              }
            } else {
               // Fallback if somehow old session
               setSkills(['Clutch Control', 'Forward Driving', 'Reverse', 'Turning']);
            }

            // Pre-fill existing data if session was already ongoing
            if (data.status === 'ongoing') setStatus('ongoing');
            if (data.progressStep) setCheckedSkills(data.progressStep);
            if (data.instructorNotes) setNotes(data.instructorNotes);
            if (data.elapsedSeconds) setElapsed(data.elapsedSeconds);
          }
        } else {
          setError('Session not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [currentUser, sessionId]);

  // Timer logic
  useEffect(() => {
    if (status === 'ongoing') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Format timer (MM:SS)
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Actions
  const handleStart = async () => {
    setStatus('ongoing');
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'ongoing' });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    setStatus('paused');
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { 
        elapsedSeconds: elapsed 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    setStatus('not-started');
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'cancelled' });
      navigate('/instructor/schedule');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSkill = (skill) => {
    setCheckedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    if (checkedSkills.length === 0 && !window.confirm('Complete session without checking any skills?')) return;
    if (!attendance) { alert('Please select attendance.'); return; }
    if (!performance) { alert('Please select performance rating.'); return; }

    setSubmitting(true);
    setStatus('paused');

    try {
      // Build skills map: each skill → true/false
      const skillsMap = {};
      skills.forEach(skill => {
        skillsMap[skill] = checkedSkills.includes(skill);
      });

      // Create session_progress record via helper
      await createSessionProgress({
        studentId: session?.studentId,
        instructorId: currentUser.uid,
        sessionId: sessionId,
        studentPackageId: session?.studentPackageId,
        date: session?.date || new Date().toISOString().split('T')[0],
        attendance,
        skills: skillsMap,
        performance,
        notes,
      });

      // Update Session Document status to completed
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => navigate('/instructor/schedule'), 2000);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to complete session.');
      setSubmitting(false);
    }
  };

  // Render Loading / Error
  if (loading) return <div className="as-loading">Loading live session...</div>;
  if (error) return (
    <div className="as-error-card">
      <h2 style={{color: '#991b1b', fontSize: '1.2rem', marginBottom: '1rem'}}>Error</h2>
      <p style={{color: '#6b7280'}}>{error}</p>
      <button onClick={() => navigate('/instructor/schedule')} 
        style={{marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: '#f3f4f6', cursor: 'pointer', fontWeight: 600}}>
        Go Back
      </button>
    </div>
  );

  // Render Success Screen
  if (success) {
    return (
      <div className="as-success-screen">
        <div className="as-success-icon">
          <CheckCircle2 size={40} color="#16a34a" />
        </div>
        <h2 className="as-success-title">Session Complete!</h2>
        <p className="as-success-text">Progress saved. Redirecting to schedule...</p>
      </div>
    );
  }

  return (
    <div className="active-session-wrapper">

      {/* Header */}
      <div className="as-header">
        <button onClick={() => navigate('/instructor/schedule')} className="as-back-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="as-title">Active Session</h1>
          <p className="as-subtitle">Live training dashboard</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className={`as-live-badge ${status}`}>
            {status === 'ongoing' && <span className="as-live-dot" />}
            {status.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Session Info Card */}
      <div className="as-info-card">
        <h2 className="as-student-name">{session?.studentName || 'Student'}</h2>
        <div className="as-info-chips">
          <span className="as-chip">
            <Car size={14} color="#6b7280" /> {session?.vehicle || session?.vehicleType || 'Car'}
          </span>
          <span className="as-chip">
            <GraduationCap size={14} color="#6b7280" /> {session?.sessionType || 'Standard'}
          </span>
          <span className="as-chip">
            <Clock size={14} color="#6b7280" /> {session?.time || 'N/A'}
          </span>
        </div>
      </div>

      {/* Attendance & Performance Controls */}
      <div className="as-section-card as-tracking-card">
        <h3 className="as-section-title">Session Tracking</h3>
        <div className="as-tracking-grid">
          <div className="as-tracking-field">
            <label className="as-field-label">Attendance</label>
            <div className="as-radio-group">
              <label className={`as-radio-option ${attendance === 'present' ? 'selected' : ''}`}>
                <input type="radio" name="attendance" value="present" checked={attendance === 'present'} onChange={e => setAttendance(e.target.value)} />
                <CheckCircle2 size={16} />
                Present
              </label>
              <label className={`as-radio-option absent ${attendance === 'absent' ? 'selected' : ''}`}>
                <input type="radio" name="attendance" value="absent" checked={attendance === 'absent'} onChange={e => setAttendance(e.target.value)} />
                <XCircle size={16} />
                Absent
              </label>
            </div>
          </div>
          <div className="as-tracking-field">
            <label className="as-field-label">Performance Rating</label>
            <select value={performance} onChange={e => setPerformance(e.target.value)} className="as-performance-select">
              <option value="Good">👍 Good</option>
              <option value="Average">👌 Average</option>
              <option value="Needs Improvement">⚠️ Needs Improvement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timer & Controls Card */}
      <div className="as-timer-card">
        <div className="as-timer-label">
          <Clock size={16} /> Session Duration
        </div>
        <div className={`as-timer-display ${status === 'ongoing' ? 'running' : ''}`}>
          {formatTime(elapsed)}
        </div>
        
        {/* Controls */}
        <div className="as-controls">
          {status !== 'ongoing' ? (
            <button className="as-ctrl-btn as-btn-start" onClick={handleStart}>
              <Play size={20} /> {elapsed > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button className="as-ctrl-btn as-btn-pause" onClick={handlePause}>
              <Pause size={20} /> Pause
            </button>
          )}
          <button className="as-ctrl-btn as-btn-cancel" onClick={handleCancel}>
            <XCircle size={20} /> Cancel
          </button>
        </div>
      </div>

      {/* Skills Checklist */}
      <div className="as-section-card">
        <h3 className="as-section-title">Training Progress</h3>
        <div className="as-skill-grid">
          {skills.map(skill => {
            const isChecked = checkedSkills.includes(skill);
            return (
              <div 
                key={skill} 
                className={`as-skill-item ${isChecked ? 'checked' : ''}`}
                onClick={() => toggleSkill(skill)}
              >
                <div className="as-skill-check">
                  <CheckCircle2 size={18} color={isChecked ? '#16a34a' : '#d1d5db'} />
                </div>
                <span className="as-skill-label">{skill}</span>
              </div>
            );
          })}
        </div>
        
        {skills.length > 0 && (
          <div className="as-progress-bar-container">
            <div className="as-progress-labels">
              <span>Progress</span>
              <span className="as-progress-value">{Math.round((checkedSkills.length / skills.length) * 100)}%</span>
            </div>
            <div className="as-progress-track">
              <div className="as-progress-fill" style={{ width: `${(checkedSkills.length / skills.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Performance Notes */}
      <div className="as-section-card">
        <h3 className="as-section-title">Performance Notes</h3>
        <textarea 
          className="as-notes-textarea"
          rows={3}
          placeholder="e.g., Student needs improvement in turning..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Complete Button */}
      <button 
        className={`as-complete-btn ${submitting ? 'submitting' : 'enabled'}`}
        onClick={handleComplete}
        disabled={submitting}
      >
        <CheckCircle2 size={24} /> 
        {submitting ? 'Saving...' : 'Complete Session'}
      </button>

    </div>
  );
}
