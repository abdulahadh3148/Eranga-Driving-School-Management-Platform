import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, ArrowLeft, FileText, ChevronRight, Star, Play } from 'lucide-react';

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

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed': return { bg: 'rgba(100,100,120,0.15)', color: '#8a8a9a', border: 'rgba(100,100,120,0.3)' };
    case 'confirmed': return { bg: colors.greenGlow, color: colors.green, border: 'rgba(0,230,118,0.3)' };
    case 'pending': return { bg: colors.amberGlow, color: colors.amber, border: 'rgba(255,171,0,0.3)' };
    case 'cancelled': return { bg: colors.redGlow, color: colors.red, border: 'rgba(255,82,82,0.3)' };
    default: return { bg: 'rgba(100,100,120,0.15)', color: '#8a8a9a', border: 'rgba(100,100,120,0.3)' };
  }
};

export default function SessionDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const fetchSessionOrHistory = async () => {
      setLoading(true);
      setError('');
      try {
        if (sessionId) {
          const docSnap = await getDoc(doc(db, 'bookings', sessionId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.instructorId === currentUser.uid) {
              setBooking({ id: docSnap.id, ...data });
            } else {
              setError('You do not have permission to view this session.');
            }
          } else {
            setError('Session not found.');
          }
        } else {
          const q = query(
            collection(db, 'bookings'),
            where('instructorId', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
        setError('Error loading data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionOrHistory();
  }, [currentUser, sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${colors.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- Single Session Detail View ---
  if (sessionId && booking) {
    const badge = getStatusBadge(booking.status);
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSearchParams({})}
            style={{ width: 40, height: 40, borderRadius: 12, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>Session Details</h1>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>Review performance and details</p>
          </div>
        </motion.div>

        {error && (
          <div style={{ padding: 16, background: colors.redGlow, border: `1px solid rgba(255,82,82,0.3)`, borderRadius: 14, color: colors.red, fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: 24 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${colors.border}`, paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.green, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {booking.sessionType || 'Driving Lesson'}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text, marginTop: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>{booking.studentName || 'Student'}</h2>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, textTransform: 'capitalize' }}>
              {booking.status}
            </span>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: colors.surface2 }}>
              <Calendar size={16} color={colors.green} />
              <div>
                <p style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>Date</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginTop: 2 }}>{booking.date}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: colors.surface2 }}>
              <Clock size={16} color={colors.amber} />
              <div>
                <p style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>Time Slot</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginTop: 2 }}>{booking.timeSlot}</p>
              </div>
            </div>
          </div>

          {/* Skills Checked (if available) */}
          {booking.skillsChecked && booking.skillsChecked.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 10 }}>Skills Assessed</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {booking.skillsChecked.map(skill => (
                  <span key={skill} style={{ padding: '6px 12px', borderRadius: 10, background: colors.greenGlow, color: colors.green, fontSize: 12, fontWeight: 600, border: '1px solid rgba(0,230,118,0.2)' }}>
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating (if available) */}
          {booking.rating && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 10 }}>Rating</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={20} fill={i <= booking.rating ? colors.amber : 'transparent'} color={i <= booking.rating ? colors.amber : colors.border} />
                ))}
              </div>
            </div>
          )}

          {/* Notes/Feedback */}
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 10 }}>Performance Notes & Feedback</h3>
            <div style={{ padding: 16, borderRadius: 14, background: colors.surface2, border: `1px solid ${colors.border}`, fontSize: 14, color: booking.instructorNotes || booking.feedback ? colors.text : colors.muted, lineHeight: 1.7, minHeight: 80 }}>
              {booking.instructorNotes || booking.feedback || (
                <span style={{ fontStyle: 'italic' }}>No notes provided for this session.</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <Link to={`/instructor/active-session?id=${booking.id}`}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                  background: colors.green, color: '#000', fontSize: 14, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  textDecoration: 'none', fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: 0.5, boxShadow: `0 0 30px ${colors.greenGlow}`
                }}>
                <Play size={16} /> START SESSION
              </Link>
              <Link to={`/instructor/mark-complete?id=${booking.id}`}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 14,
                  background: colors.surface2, border: `1px solid ${colors.border}`,
                  color: colors.text, fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  textDecoration: 'none', fontFamily: "'Barlow Condensed', sans-serif"
                }}>
                <CheckCircle size={16} /> QUICK COMPLETE
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // --- Session History List ---
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>Training History</h1>
        <p style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>Review all your past and upcoming sessions.</p>
      </motion.div>

      {error && (
        <div style={{ padding: 16, background: colors.redGlow, border: `1px solid rgba(255,82,82,0.3)`, borderRadius: 14, color: colors.red, fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>

        {history.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <FileText size={48} color={colors.border} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: colors.muted, fontSize: 15 }}>No training sessions recorded.</p>
          </div>
        ) : (
          <div>
            {history.map((s, i) => {
              const badge = getStatusBadge(s.status);
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSearchParams({ id: s.id })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
                    cursor: 'pointer', transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Date block */}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Clock size={12} color={colors.muted} />
                        <span style={{ fontSize: 12, color: colors.muted }}>{s.timeSlot}</span>
                        <span style={{ color: colors.border }}>•</span>
                        <span style={{ fontSize: 11, color: colors.green, fontWeight: 600, textTransform: 'uppercase' }}>{s.sessionType || 'Driving'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, textTransform: 'capitalize' }}>
                      {s.status}
                    </span>
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
