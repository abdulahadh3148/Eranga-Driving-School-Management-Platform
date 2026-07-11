import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, User, CheckCircle, ArrowLeft, FileText, ChevronRight, Star, Play } from 'lucide-react';

const getBadgeInfo = (status) => {
  switch (status) {
    case 'completed': return { className: 'sd-badge-completed', label: 'Completed' };
    case 'confirmed': return { className: 'sd-badge-upcoming', label: 'Confirmed' };
    case 'pending': return { className: 'sd-badge-pending', label: 'Pending' };
    case 'cancelled': case 'missed': return { className: 'sd-badge-missed', label: status };
    default: return { className: 'sd-badge-pending', label: status || 'Unknown' };
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
          const docSnap = await getDoc(doc(db, 'sessions', sessionId));
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
          const q = query(collection(db, 'sessions'), where('instructorId', '==', currentUser.uid));
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
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontWeight: 600 }}>Loading...</div>;
  }

  // ─── Single Session Detail View ─── 
  if (sessionId && booking) {
    const badge = getBadgeInfo(booking.status);
    const isActionable = booking.status === 'confirmed' || booking.status === 'pending';

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        {/* Back Button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setSearchParams({})}
            style={{ width: 40, height: 40, borderRadius: '0.75rem', background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827', margin: 0 }}>Session Details</h1>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, marginTop: '0.125rem' }}>Review performance and details</p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Main Card */}
        <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {booking.sessionType || 'Driving Lesson'}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '0.25rem' }}>{booking.studentName || 'Student'}</h2>
            </div>
            <span className={badge.className} style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {badge.label}
            </span>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #f3f4f6' }}>
              <Calendar size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Date</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginTop: '0.125rem' }}>{booking.date}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #f3f4f6' }}>
              <Clock size={18} color="#f59e0b" />
              <div>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Time Slot</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginTop: '0.125rem' }}>{booking.timeSlot}</p>
              </div>
            </div>
          </div>

          {/* Skills Checked */}
          {booking.skillsChecked && booking.skillsChecked.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.625rem' }}>Skills Assessed</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {booking.skillsChecked.map(skill => (
                  <span key={skill} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.625rem', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          {booking.rating && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Rating</h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={22} fill={i <= booking.rating ? '#f59e0b' : 'transparent'} color={i <= booking.rating ? '#f59e0b' : '#d1d5db'} />
                ))}
              </div>
            </div>
          )}

          {/* Notes/Feedback */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.625rem' }}>Notes & Feedback</h3>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #f3f4f6', fontSize: '0.875rem', color: booking.instructorNotes || booking.feedback ? '#374151' : '#9ca3af', lineHeight: 1.7, minHeight: 60 }}>
              {booking.instructorNotes || booking.feedback || (
                <span style={{ fontStyle: 'italic' }}>No notes provided for this session.</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isActionable && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
              <Link to={`/instructor/active-session?id=${booking.id}`}
                style={{
                  flex: 1, padding: '0.875rem 0', borderRadius: '0.75rem', border: 'none',
                  background: '#16a34a', color: '#fff', fontSize: '0.875rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none'
                }}>
                <Play size={16} /> Start Session
              </Link>
                <Link
                  to={`/instructor/mark-session/${booking.studentId}`}
                  style={{
                    flex: 1,
                    padding: '0.875rem 0',
                    borderRadius: '0.75rem',
                    background: '#2563eb',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none'
                  }}
                >
                  Mark Session
                </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Session History List ───
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>Training History</h1>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, marginBottom: '1.5rem' }}>Review all your past and upcoming sessions.</p>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb', color: '#6b7280', fontWeight: 600 }}>
          <FileText size={40} color="#d1d5db" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          No training sessions recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map(s => {
            const badge = getBadgeInfo(s.status);
            return (
              <div key={s.id} onClick={() => setSearchParams({ id: s.id })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: '#fff', borderRadius: '1rem',
                  border: '1px solid #e5e7eb', cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Date block */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '0.75rem', background: '#f3f4f6',
                    border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                      {new Date(s.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{s.studentName || 'Student'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.2rem' }}>
                      <Clock size={12} color="#6b7280" />
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.timeSlot}</span>
                      <span style={{ color: '#d1d5db' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>{s.sessionType || 'Driving'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={badge.className} style={{ padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {badge.label}
                  </span>
                  <ChevronRight size={16} color="#9ca3af" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge styles injected via style tag */}
      <style>{`
        .sd-badge-upcoming { background: #fef9c3; color: #a16207; }
        .sd-badge-completed { background: #dcfce7; color: #166534; }
        .sd-badge-missed { background: #fee2e2; color: #991b1b; }
        .sd-badge-pending { background: #fef9c3; color: #a16207; }
      `}</style>
    </div>
  );
}
