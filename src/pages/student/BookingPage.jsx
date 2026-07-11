import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import DatePicker from '../../components/ui/DatePicker';

export default function BookingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [instructor, setInstructor] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [instructorsList, setInstructorsList] = useState([]);
  const [activePackage, setActivePackage] = useState(null);
  const [fetchingPackage, setFetchingPackage] = useState(true);

  const timeSlots = ['07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '14:00 PM - 15:00 PM', '15:00 PM - 16:00 PM'];

  // Fetch active package
  useEffect(() => {
    if (!currentUser) return;
    const fetchPackage = async () => {
      try {
        const q = query(
          collection(db, 'student_packages'),
          where('student_id', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const pkg = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setActivePackage(pkg);
          if (pkg.included_vehicles && pkg.included_vehicles.length > 0) {
            setSelectedVehicle(pkg.included_vehicles[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingPackage(false);
      }
    };
    fetchPackage();
  }, [currentUser]);

  // Fetch instructors based on date, time, and selected vehicle
  useEffect(() => {
    if (!date || !timeSlot || !selectedVehicle) {
      setInstructorsList([]);
      setInstructor('');
      return;
    }

    const fetchAvailableInstructors = async () => {
      setCheckingAvailability(true);
      setError('');
      try {
        const instQuery = query(collection(db, 'instructors'), where('status', 'in', ['active', 'approved']));
        const instSnap = await getDocs(instQuery);
        let activeInstructors = instSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const sessionQuery = query(
          collection(db, 'sessions'), 
          where('date', '==', date),
          where('time', '==', timeSlot)
        );
        const sessionSnap = await getDocs(sessionQuery);
        
        const bookedInstructorCounts = {};
        sessionSnap.docs.forEach(d => {
          const iId = d.data().instructorId;
          if (iId !== 'UNASSIGNED') {
            bookedInstructorCounts[iId] = (bookedInstructorCounts[iId] || 0) + 1;
          }
        });

        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        const availableInstructors = activeInstructors.filter(inst => {
          const maxStudents = inst.maxStudentsPerBatch || 1;
          const currentBookings = bookedInstructorCounts[inst.id] || 0;
          if (currentBookings >= maxStudents) return false;

          if (inst.availability && Object.keys(inst.availability).length > 0) {
            const slotsForDay = inst.availability[dayOfWeek] || [];
            if (!slotsForDay.includes(timeSlot)) return false;
          } else {
            const workingDays = inst.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            if (!workingDays.includes(dayOfWeek)) return false;
          }

          if (selectedVehicle && inst.vehicleTypes && inst.vehicleTypes.length > 0) {
             if (!inst.vehicleTypes.includes(selectedVehicle)) return false;
          }

          return true;
        });

        setInstructorsList(availableInstructors);
        if (instructor && !availableInstructors.find(i => i.id === instructor)) {
          setInstructor('');
        }
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setError('Failed to check instructor availability.');
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailableInstructors();
  }, [date, timeSlot, selectedVehicle]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot || !selectedVehicle) {
      setError('Please fill all required fields.');
      return;
    }
    
    if (instructorsList.length === 0) {
      setError('No instructors available for this date and time. Please select another slot.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let assignedInstructorId = instructor;
      if (!assignedInstructorId && instructorsList.length > 0) {
        assignedInstructorId = instructorsList[0].id;
      }
      const assignedInstructor = instructorsList.find(i => i.id === assignedInstructorId);

      await addDoc(collection(db, 'sessions'), {
        studentId: currentUser.uid,
        studentName: userProfile?.name || 'Student',
        studentPackageId: activePackage.id,
        instructorId: assignedInstructorId || 'UNASSIGNED',
        instructorName: assignedInstructor?.name || 'Unassigned',
        date,
        time: timeSlot,
        vehicle: selectedVehicle,
        status: 'scheduled',
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

  if (fetchingPackage) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // ── RULE: No booking without an active package ──────────────────────────────
  if (!activePackage) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border-2 border-dashed border-orange-300 shadow-sm p-10 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">No Active Package</h2>
          <p className="text-gray-500 mb-6">
            You need to select a training package before you can book a session.<br />
            All scheduling is tied to your enrolled package.
          </p>
          <a href="/student/packages"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm">
            Browse Packages →
          </a>
        </motion.div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-6">Your session has been scheduled. You can view it in your bookings.</p>
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
        
        {/* Vehicle Selection for Combo Packages */}
        {activePackage.included_vehicles && activePackage.included_vehicles.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><Car size={18} className="text-primary"/> Select Vehicle for this Session</label>
            <div className="grid grid-cols-2 gap-3">
              {activePackage.included_vehicles.map(v => (
                <button key={v} type="button" onClick={() => setSelectedVehicle(v)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${selectedVehicle === v ? 'bg-primary/10 text-primary border-primary shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Your package includes multiple vehicles. Choose which one to practice.</p>
          </div>
        )}

        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><CalendarIcon size={18} className="text-primary"/> Select Date</label>
          <DatePicker 
            value={date} 
            onChange={(val) => setDate(val)}
            minYear={new Date().getFullYear()} 
            maxYear={new Date().getFullYear() + 2}
            className="w-full sm:w-1/2" 
          />
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
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
            <Car size={18} className="text-primary"/> Preferred Instructor (Optional)
          </label>
          
          <div className="relative">
            <select 
              value={instructor} 
              onChange={(e) => setInstructor(e.target.value)}
              disabled={!date || !timeSlot || checkingAvailability || instructorsList.length === 0}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              {!date || !timeSlot ? (
                <option value="">Select Date & Time first</option>
              ) : checkingAvailability ? (
                <option value="">Checking availability...</option>
              ) : instructorsList.length === 0 ? (
                <option value="">No instructors available</option>
              ) : (
                <>
                  <option value="">Any Available Instructor</option>
                  {instructorsList.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>
          {date && timeSlot && !checkingAvailability && instructorsList.length === 0 && (
             <p className="text-xs text-red-500 font-bold mt-2">All instructors are booked or unavailable for this slot.</p>
          )}
          {instructorsList.length > 0 && (
             <p className="text-xs text-gray-500 mt-2">If you select "Any", we will assign the earliest available instructor for your slot.</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading || !date || !timeSlot || !selectedVehicle || instructorsList.length === 0}
            className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>

      </motion.form>
    </div>
  );
}
