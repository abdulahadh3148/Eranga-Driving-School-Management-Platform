import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, ArrowLeft, Clock, User, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const colors = {
  bg: '#090c12',
  surface: '#0e1420',
  surface2: '#131a2a',
  border: '#1c2540',
  green: '#00e676',
  greenDark: '#00c853',
  greenGlow: 'rgba(0,230,118,0.18)',
  amber: '#ffab00',
  red: '#ff5252',
  text: '#f0f0f0',
  muted: '#5a6a7a',
};

export default function MarkComplete() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(preselectedId || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'bookings'),
          where('instructorId', '==', currentUser.uid),
          where('status', '==', 'confirmed')
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const today = new Date().toISOString().split('T')[0];
        const eligible = all.filter(s => s.date <= today);
        eligible.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(eligible);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    setSubmitting(true);

    try {
      const session = sessions.find(s => s.id === selectedSession);

      await updateDoc(doc(db, 'bookings', selectedSession), {
        status: 'completed',
        instructorNotes: notes,
        completedAt: new Date().toISOString()
      });

      if (session?.studentId) {
        const stuRef = doc(db, 'users', session.studentId);
        await updateDoc(stuRef, {
          classesCompleted: increment(1),
          progress: increment(5)
        });

        await addDoc(collection(db, 'notifications'), {
          userId: session.studentId,
          studentId: session.studentId,
          title: 'Session Completed',
          message: `Your session on ${session.date} (${session.timeSlot}) has been marked completed by your instructor.`,
          body: `Your session on ${session.date} (${session.timeSlot}) has been marked completed by your instructor.`,
          type: 'booking',
          icon: '🎓',
          isRead: false,
          unread: true,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/instructor'), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to mark complete.');
      setSubmitting(false);
    }
  };

  const selectedData = sessions.find(s => s.id === selectedSession);

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 420, margin: '60px auto', padding: 32, background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.greenGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={32} color={colors.green} />
        </div>
        <h2 style={{ color: colors.text, fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>Session Completed!</h2>
        <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>The session has been marked complete and the student's progress has been updated.</p>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/instructor')}
          style={{ width: 40, height: 40, borderRadius: 12, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>Mark Complete</h1>
          <p style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>Record completion and add notes</p>
        </div>
      </motion.div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: 24 }}>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${colors.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 24, background: 'rgba(255,171,0,0.08)', borderRadius: 14, border: '1px solid rgba(255,171,0,0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <AlertCircle size={20} color={colors.amber} />
            <p style={{ color: colors.amber, fontSize: 14 }}>No confirmed sessions eligible to be marked complete.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Select Session</label>
              <select required value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: colors.surface2, border: `1px solid ${colors.border}`, color: colors.text, fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                <option value="" style={{ color: colors.muted }}>-- Choose a session --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id} style={{ background: colors.surface2, color: colors.text }}>
                    {s.date} | {s.timeSlot} - {s.studentName || 'Student'}
                  </option>
                ))}
              </select>
            </div>

            {selectedData && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ background: colors.surface2, borderRadius: 14, padding: 16, marginBottom: 20, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} color={colors.green} />
                    <span style={{ fontSize: 13, color: colors.text, fontWeight: 600 }}>{selectedData.studentName || 'Student'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} color={colors.amber} />
                    <span style={{ fontSize: 13, color: colors.muted }}>{selectedData.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} color={colors.amber} />
                    <span style={{ fontSize: 13, color: colors.muted }}>{selectedData.timeSlot}</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Performance Notes (Optional)</label>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Good steering control, needs work on clutch..."
                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: colors.surface2, border: `1px solid ${colors.border}`, color: colors.text, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
              <p style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>These notes are visible to the student.</p>
            </div>

            <button type="submit" disabled={submitting || !selectedSession}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                background: selectedSession ? colors.green : colors.border,
                color: selectedSession ? '#000' : colors.muted,
                fontSize: 15, fontWeight: 800, cursor: selectedSession ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px',
                transition: 'all 0.2s ease', opacity: submitting ? 0.6 : 1,
                boxShadow: selectedSession ? `0 0 30px ${colors.greenGlow}` : 'none'
              }}>
              <CheckCircle2 size={18} /> {submitting ? 'SAVING...' : 'MARK AS COMPLETE'}
            </button>
          </>
        )}
      </motion.form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        select option { background: #131a2a; color: #f0f0f0; }
        textarea::placeholder { color: #5a6a7a; }
        select:focus, textarea:focus { border-color: #00e676 !important; box-shadow: 0 0 0 3px rgba(0,230,118,0.12); }
      `}</style>
    </div>
  );
}
