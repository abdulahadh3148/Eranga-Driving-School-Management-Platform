import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, ArrowLeft, Clock, User, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  const [isTrialTest, setIsTrialTest] = useState(false);
  const [trialPassed, setTrialPassed] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'sessions'),
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

      await updateDoc(doc(db, 'sessions', selectedSession), {
        status: 'completed',
        instructorNotes: notes,
        completedAt: new Date().toISOString()
      });

      if (session?.studentId) {
        const stuRef = doc(db, 'users', session.studentId);
        let updates = {
          classesCompleted: increment(1),
          progress: increment(5)
        };
        if (isTrialTest) {
          updates.trialPassed = trialPassed;
        }
        await updateDoc(stuRef, updates);

        await addDoc(collection(db, 'notifications'), {
          userId: session.studentId,
          studentId: session.studentId,
          title: 'Session Completed',
          message: `Your session on ${session.date} (${session.time}) has been marked completed by your instructor.`,
          body: `Your session on ${session.date} (${session.time}) has been marked completed by your instructor.`,
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

  // ─── Success State ───
  if (success) {
    return (
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: '1.25rem', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle2 size={32} color="#16a34a" />
        </div>
        <h2 style={{ color: '#111827', fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Session Completed!</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>The session has been marked complete and the student's progress has been updated.</p>
      </div>
    );
  }

  // ─── Main Form ───
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/instructor')}
          style={{ width: 40, height: 40, borderRadius: '0.75rem', background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827', margin: 0 }}>Mark Complete</h1>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, marginTop: '0.125rem' }}>Record completion and add notes</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '1.25rem', background: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fde68a', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <AlertCircle size={20} color="#f59e0b" />
            <p style={{ color: '#92400e', fontSize: '0.875rem', fontWeight: 500 }}>No confirmed sessions eligible to be marked complete.</p>
          </div>
        ) : (
          <>
            {/* Session Select */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Select Session</label>
              <select required value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <option value="">-- Choose a session --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.date} | {s.timeSlot} - {s.studentName || 'Student'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Session Info */}
            {selectedData && (
              <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.825rem', color: '#111827', fontWeight: 600 }}>{selectedData.studentName || 'Student'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="#f59e0b" />
                    <span style={{ fontSize: '0.825rem', color: '#6b7280' }}>{selectedData.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} color="#f59e0b" />
                    <span style={{ fontSize: '0.825rem', color: '#6b7280' }}>{selectedData.timeSlot}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Performance Notes (Optional)</label>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Good steering control, needs work on clutch..."
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', fontSize: '0.875rem', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>These notes are visible to the student.</p>
            </div>

            {/* Trial Test Section */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #f3f4f6' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: isTrialTest ? '1rem' : 0 }}>
                <input
                  type="checkbox"
                  checked={isTrialTest}
                  onChange={e => setIsTrialTest(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Is this a Final Trial Test?</span>
              </label>

              {isTrialTest && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', background: trialPassed ? '#dcfce7' : '#fff', border: `1.5px solid ${trialPassed ? '#86efac' : '#e5e7eb'}`, cursor: 'pointer' }}>
                    <input type="radio" name="trialResult" checked={trialPassed} onChange={() => setTrialPassed(true)} style={{ display: 'none' }} />
                    <CheckCircle2 size={16} color={trialPassed ? '#16a34a' : '#9ca3af'} />
                    <span style={{ color: trialPassed ? '#166534' : '#6b7280', fontWeight: 700, fontSize: '0.825rem' }}>Passed</span>
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', background: !trialPassed ? '#fee2e2' : '#fff', border: `1.5px solid ${!trialPassed ? '#fecaca' : '#e5e7eb'}`, cursor: 'pointer' }}>
                    <input type="radio" name="trialResult" checked={!trialPassed} onChange={() => setTrialPassed(false)} style={{ display: 'none' }} />
                    <AlertCircle size={16} color={!trialPassed ? '#dc2626' : '#9ca3af'} />
                    <span style={{ color: !trialPassed ? '#991b1b' : '#6b7280', fontWeight: 700, fontSize: '0.825rem' }}>Failed</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || !selectedSession}
              style={{
                width: '100%', padding: '1rem 0', borderRadius: '0.75rem', border: 'none',
                background: selectedSession ? '#16a34a' : '#e5e7eb',
                color: selectedSession ? '#fff' : '#9ca3af',
                fontSize: '1rem', fontWeight: 800, cursor: selectedSession ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s ease', opacity: submitting ? 0.6 : 1,
                boxShadow: selectedSession ? '0 4px 14px rgba(22, 163, 74, 0.3)' : 'none'
              }}>
              <CheckCircle2 size={20} /> {submitting ? 'Saving...' : 'Mark as Complete'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
