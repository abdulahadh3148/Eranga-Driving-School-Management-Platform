import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Clock, CheckCircle, XCircle, ChevronRight, User, Car, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const colors = {
  bg: '#090c12',
  surface: '#0e1420',
  surface2: '#131a2a',
  border: '#1c2540',
  green: '#00e676',
  greenGlow: 'rgba(0,230,118,0.18)',
  amber: '#ffab00',
  amberGlow: 'rgba(255,171,0,0.18)',
  red: '#ff5252',
  redGlow: 'rgba(255,82,82,0.15)',
  text: '#f0f0f0',
  muted: '#5a6a7a',
};

export default function MySchedule() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'bookings'), where('instructorId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const upcoming = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');

  const handleStatusUpdate = async (id, status, e) => {
    e.stopPropagation(); // Avoid triggering row navigation
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'confirmed') {
      return { bg: colors.greenGlow, color: colors.green, border: 'rgba(0,230,118,0.3)' };
    }
    return { bg: colors.amberGlow, color: colors.amber, border: 'rgba(255,171,0,0.3)' };
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>My Schedule</h1>
        <p style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>Manage and confirm practical training sessions.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${colors.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <CalendarDays size={48} color={colors.border} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: colors.muted, fontSize: 15 }}>No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div>
            {upcoming.map((s, i) => {
              const statusStyle = getStatusStyle(s.status);
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/instructor/sessions?id=${s.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
                    cursor: 'pointer', transition: 'background 0.2s ease', flexWrap: 'wrap', gap: 16
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 200 }}>
                    {/* Date Block */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: colors.surface2,
                      border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, textTransform: 'uppercase' }}>
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: colors.text, lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {new Date(s.date).getDate()}
                      </span>
                    </div>

                    <div>
                      <p style={{ fontWeight: 700, color: colors.text, fontSize: 15 }}>{s.studentName || 'Student'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Clock size={12} color={colors.muted} />
                        <span style={{ fontSize: 12, color: colors.muted }}>{s.timeSlot}</span>
                        <span style={{ color: colors.border }}>•</span>
                        <span style={{ fontSize: 11, color: colors.green, fontWeight: 600 }}>{s.vehicleType || s.vehicleId || 'Manual'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
                    <span style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                      textTransform: 'uppercase'
                    }}>
                      {s.status}
                    </span>

                    {/* Pending Confirmation Actions */}
                    {s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={(e) => handleStatusUpdate(s.id, 'confirmed', e)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: colors.greenGlow, border: '1px solid rgba(0,230,118,0.2)', color: colors.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Confirm booking">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={(e) => handleStatusUpdate(s.id, 'cancelled', e)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: colors.redGlow, border: '1px solid rgba(255,82,82,0.2)', color: colors.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Cancel booking">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}

                    {/* Confirmed / Active quick link */}
                    {s.status === 'confirmed' && (
                      <button onClick={() => navigate(`/instructor/active-session?id=${s.id}`)}
                        style={{
                          height: 32, padding: '0 12px', borderRadius: 8, background: colors.green, border: 'none',
                          color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Barlow Condensed', sans-serif"
                        }}>
                        <Play size={10} fill="#000" /> START
                      </button>
                    )}

                    <ChevronRight size={16} color={colors.muted} />
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
