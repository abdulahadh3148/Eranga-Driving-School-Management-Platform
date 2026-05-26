import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Car, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BookingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [instructor, setInstructor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [instructorsList, setInstructorsList] = useState([]);

  useEffect(() => {
    // Fetch available instructors
    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const snap = await getDocs(q);
        setInstructorsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstructors();
  }, []);

  const timeSlots = ['07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '14:00 PM - 15:00 PM', '15:00 PM - 16:00 PM'];

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      setError('Please select a date and time slot.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'bookings'), {
        studentId: currentUser.uid,
        studentName: userProfile?.name || 'Student',
        instructorId: instructor || 'Any',
        date,
        timeSlot,
        vehicleId: userProfile?.vehiclePreference || 'Standard Car',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => navigate('/student/bookings'), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to book session. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date for minimum date input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-6">Your session has been requested. We will notify you once an instructor confirms it.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
        <p className="text-gray-500 text-sm mt-1">Schedule your next practical driving lesson.</p>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <motion.form onSubmit={handleBooking} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><CalendarIcon size={18} className="text-primary"/> Select Date</label>
          <input type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-orange-500/10 transition-all" />
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><Clock size={18} className="text-primary"/> Select Time Slot</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {timeSlots.map(slot => (
              <button key={slot} type="button" onClick={() => setTimeSlot(slot)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${timeSlot === slot ? 'bg-primary/50 text-white border-primary shadow-md shadow-orange-500/20' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Instructor Preference */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><Car size={18} className="text-primary"/> Preferred Instructor (Optional)</label>
          <select value={instructor} onChange={(e) => setInstructor(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white">
            <option value="">Any Available Instructor</option>
            {instructorsList.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">If you select "Any", we will assign the earliest available instructor for your slot.</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>

      </motion.form>
    </div>
  );
}
