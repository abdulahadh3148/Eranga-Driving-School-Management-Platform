import { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Availability.css';

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
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchAvailability = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'instructors', userProfile.id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.availability) {
            setAvailability(data.availability);
          }
          if (data.autoAssignEnabled !== undefined) {
            setAutoAssignEnabled(data.autoAssignEnabled);
          }
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
  }, [userProfile?.id]);

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
    if (!userProfile?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'instructors', userProfile.id), { 
        availability,
        autoAssignEnabled
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

  if (loading) {
    return <div className="availability-loading">Loading availability...</div>;
  }

  return (
    <div className="availability-page-wrapper">
      <h1 className="availability-page-title">Working Hours</h1>
      <p className="availability-page-subtitle">Define your weekly availability for lesson bookings.</p>

      {/* Info Banner */}
      <div className="availability-info-banner">
        <Clock size={20} className="availability-info-icon" />
        <span>Students will only be able to book lessons during the time slots you enable below. Unchecked slots are blocked.</span>
      </div>

      {/* Auto Assign Settings */}
      <div className="availability-info-banner" style={{ marginTop: '20px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2545', margin: '0 0 4px 0' }}>Auto-Assign Students</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Allow the system to automatically assign you to new students when their L-Permits are approved.
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={autoAssignEnabled} 
            onChange={(e) => setAutoAssignEnabled(e.target.checked)}
            style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#0B2545' }}
          />
        </label>
      </div>

      {/* Day Blocks */}
      {days.map(day => (
        <div key={day} className="availability-day-block">
          <h3 className="availability-day-name">{day}</h3>
          <div className="availability-slots">
            {slots.map(slot => {
              const isChecked = (availability[day] || []).includes(slot);
              return (
                <div
                  key={`${day}-${slot}`}
                  className={`slot-chip ${isChecked ? 'checked' : ''}`}
                  onClick={() => handleToggle(day, slot)}
                >
                  {slot}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save Section */}
      <div className="availability-save-section">
        <button
          className="availability-save-btn"
          onClick={handleSave}
          disabled={loading || saving}
        >
          <Save size={20} /> {saving ? 'Saving...' : 'Save Availability'}
        </button>

        {toast && (
          <div className="availability-toast">
            <CheckCircle size={18} /> Saved Successfully!
          </div>
        )}
      </div>
    </div>
  );
}
