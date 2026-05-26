import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Users, Phone, Mail, Award, CheckCircle, GraduationCap } from 'lucide-react';

const colors = {
  bg: '#090c12',
  surface: '#0e1420',
  surface2: '#131a2a',
  border: '#1c2540',
  green: '#00e676',
  greenGlow: 'rgba(0,230,118,0.18)',
  amber: '#ffab00',
  text: '#f0f0f0',
  muted: '#5a6a7a',
};

export default function MyStudents() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStudents = async () => {
      try {
        const bookQ = query(collection(db, 'bookings'), where('instructorId', '==', currentUser.uid));
        const bookSnap = await getDocs(bookQ);
        
        const studentIds = [...new Set(bookSnap.docs.map(d => d.data().studentId))].filter(Boolean);
        
        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // Fetch student profiles
        const stuQ = query(collection(db, 'users'), where('__name__', 'in', studentIds));
        const stuSnap = await getDocs(stuQ);
        setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [currentUser]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>My Students</h1>
        <p style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>Students you are instructing or have instructed.</p>
      </motion.div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${colors.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : students.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: 48, textAlign: 'center' }}>
          <Users size={48} color={colors.border} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: colors.muted, fontSize: 15 }}>No students assigned yet.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {students.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`,
                padding: 20, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden'
              }}
              whileHover={{ borderColor: 'rgba(0, 230, 118, 0.35)', boxShadow: '0 4px 24px rgba(0, 230, 118, 0.06)' }}
            >
              {/* Header block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: 'rgba(0, 230, 118, 0.12)', border: '1px solid rgba(0, 230, 118, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: colors.green,
                  fontFamily: "'Barlow Condensed', sans-serif"
                }}>
                  {s.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: 0 }}>{s.name || 'Student'}</h3>
                  <span style={{ fontSize: 11, color: colors.muted, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Award size={10} color={colors.amber} /> {s.packageId || 'Standard Package'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ margin: '4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: colors.muted, marginBottom: 6 }}>
                  <span>TRAINING PROGRESS</span>
                  <span style={{ color: colors.green }}>{s.progress || 0}%</span>
                </div>
                <div style={{ height: 6, width: '100%', borderRadius: 3, background: colors.surface2, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                  <div style={{ height: '100%', borderRadius: 3, background: colors.green, width: `${s.progress || 0}%`, boxShadow: `0 0 10px ${colors.greenGlow}` }} />
                </div>
              </div>

              {/* Contact info list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${colors.border}`, paddingTop: 12, fontSize: 13, color: colors.muted }}>
                {s.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={12} />
                    <span style={{ color: colors.text }}>{s.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={12} />
                  <span style={{ color: colors.text, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220 }}>
                    {s.email}
                  </span>
                </div>
              </div>

              {/* Extra stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, background: colors.surface2, borderRadius: 12, padding: '10px 12px', border: `1px solid ${colors.border}`, marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color={colors.green} />
                  <span style={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>{s.classesCompleted || 0} Finished</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={14} color={colors.amber} />
                  <span style={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>
                    {s.role === 'student' ? 'Active' : 'Graduated'}
                  </span>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
