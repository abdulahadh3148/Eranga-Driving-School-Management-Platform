import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Clock, User, Car, Play, CheckCircle2, XCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MySchedule.css';

export default function MySchedule() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Date States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateType, setDateType] = useState('today'); // 'today', 'tomorrow', 'custom'

  // Data States
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set selectedDate based on type
  useEffect(() => {
    const d = new Date();
    if (dateType === 'today') {
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (dateType === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  }, [dateType]);

  // Fetch Schedule (Auto Refresh via onSnapshot)
  useEffect(() => {
    if (!currentUser?.uid || !selectedDate) return;

    setLoading(true);
    const q = query(
      collection(db, 'sessions'),
      where('instructorId', '==', currentUser.uid),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by time
      fetchedSessions.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });

      setSessions(fetchedSessions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedDate]);

  // Action Handlers
  const handleUpdateStatus = async (sessionId, newStatus) => {
    // Confirmation for "Missed"
    if (newStatus === 'missed' || newStatus === 'cancelled') {
      if (!window.confirm("Are you sure this student MISSED the session?")) return;
    }

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, { status: newStatus });
      // UI updates automatically because of onSnapshot!
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    }
  };



  // UI Helpers
  const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'badge-completed';
    if (s === 'cancelled' || s === 'missed') return 'badge-missed';
    return 'badge-upcoming';
  };

  const getBadgeText = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'Completed';
    if (s === 'cancelled' || s === 'missed') return 'Missed';
    return 'Upcoming';
  };

  return (
    <div className="schedule-page-wrapper">
      <h1 className="schedule-page-title">My Schedule</h1>

      {/* ─── Date Selector ─── */}
      <div className="date-selector-container">
        <button 
          className={`date-btn ${dateType === 'today' ? 'active' : ''}`}
          onClick={() => setDateType('today')}
        >
          Today
        </button>
        <button 
          className={`date-btn ${dateType === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setDateType('tomorrow')}
        >
          Tomorrow
        </button>
        <div className="date-picker-wrapper">
          <DatePicker
            selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()}
            onChange={(d) => {
              if (d) {
                const offset = d.getTimezoneOffset();
                const local = new Date(d.getTime() - (offset * 60 * 1000));
                setSelectedDate(local.toISOString().split('T')[0]);
                setDateType('custom');
              }
            }}
            customInput={
              <input className={`date-picker-input ${dateType === 'custom' ? 'active' : ''}`} />
            }
            dateFormat="yyyy-MM-dd"
            placeholderText="Pick a date"
          />
        </div>
      </div>

      {/* ─── Schedule List ─── */}
      {loading ? (
        <div className="schedule-loading">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="schedule-empty">No sessions for this day.</div>
      ) : (
        <div className="schedule-list">
          {sessions.map(s => {
            const isCompleted = s.status === 'completed';
            const isMissed = s.status === 'cancelled' || s.status === 'missed';
            const isUpcoming = !isCompleted && !isMissed;

            return (
              <div key={s.id} className="schedule-card">
                
                <div className="schedule-card-header">
                  <div className="schedule-time">
                    <Clock size={20} color="var(--primary)" />
                    {s.time || 'N/A'}
                  </div>
                  <div className={`schedule-badge ${getBadgeClass(s.status)}`}>
                    {getBadgeText(s.status)}
                  </div>
                </div>

                <div className="schedule-card-body">
                  <div className="schedule-student">{s.studentName || 'Student Name'}</div>
                  <div className="schedule-details">
                    <span className="schedule-detail-item">
                      <Car size={16} /> {s.vehicleType || s.vehicle || 'Any Vehicle'}
                    </span>
                    <span>•</span>
                    <span className="schedule-detail-item">
                      {s.sessionType || s.lessonType || 'Standard Training'}
                    </span>
                  </div>
                </div>

                {/* Only show actions if session is upcoming/pending */}
                {isUpcoming && (
                  <div className="schedule-actions">
                    <button 
                      className="action-btn btn-start"
                      onClick={() => navigate(`/instructor/active-session?id=${s.id}`)}
                    >
                      <Play size={18} /> Start
                    </button>
                    <button 
                      className="action-btn btn-complete"
                      onClick={() => handleUpdateStatus(s.id, 'completed')}
                    >
                      <CheckCircle2 size={18} /> Complete
                    </button>
                    <button 
                      className="action-btn btn-missed"
                      onClick={() => handleUpdateStatus(s.id, 'missed')}
                    >
                      <XCircle size={18} /> Missed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
