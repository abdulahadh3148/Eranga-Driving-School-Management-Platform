import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, CheckCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

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

export default function Availability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots = [
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '14:00 PM - 15:00 PM',
    '15:00 PM - 16:00 PM'
  ];

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const fetchAvailability = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (docSnap.exists() && docSnap.data().availability) {
          setAvailability(docSnap.data().availability);
        } else {
          // Initialize with some default availability
          const initial = {};
          days.forEach(d => {
            initial[d] = slots.filter(s => d !== 'Saturday' || s.includes('AM'));
          });
          setAvailability(initial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [currentUser]);

  const handleToggle = (day, slot) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(slot)
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: updated };
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        availability
      });
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, fontFamily: "'Barlow Condensed', sans-serif" }}>Working Hours</h1>
        <p style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>Define your weekly availability for student lesson bookings.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: 24 }}>
        
        <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', padding: 16, borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <Clock size={20} color={colors.green} style={{ flexShrink: 0 }} />
          <p style={{ color: colors.green, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Students will only be able to book lessons during the time slots you enable below. Unchecked slots are blocked.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${colors.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {days.map(day => (
              <div key={day} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>{day}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map(slot => {
                    const isChecked = (availability[day] || []).includes(slot);
                    return (
                      <label key={`${day}-${slot}`} style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ display: 'none' }}
                          checked={isChecked}
                          onChange={() => handleToggle(day, slot)}
                        />
                        <div style={{
                          padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${isChecked ? colors.green : colors.border}`,
                          background: isChecked ? 'rgba(0,230,118,0.12)' : colors.surface2,
                          color: isChecked ? colors.green : colors.muted,
                          fontSize: 12, fontWeight: 600, transition: 'all 0.2s ease',
                          boxShadow: isChecked ? `0 0 12px rgba(0,230,118,0.06)` : 'none'
                        }}>
                          {slot}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ paddingTop: 20, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            style={{
              padding: '12px 28px', borderRadius: 12, border: 'none', background: colors.green,
              color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.2s',
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
              opacity: (loading || saving) ? 0.5 : 1, boxShadow: `0 0 20px ${colors.greenGlow}`
            }}
          >
            <Save size={18} /> {saving ? 'SAVING...' : 'SAVE AVAILABILITY'}
          </button>

          {toast && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.green, fontSize: 13, fontWeight: 600 }}>
              <CheckCircle size={16} /> Saved Successfully!
            </motion.div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
