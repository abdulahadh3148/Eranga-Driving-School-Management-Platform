import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Car, CheckCircle2, AlertCircle, Users, FileText } from 'lucide-react';
import DatePicker from '../../components/ui/DatePicker';

export default function BookingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [bookingType, setBookingType] = useState('Practice Lesson');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const timeSlots = [
    '07:00 AM - 08:00 AM', 
    '08:00 AM - 09:00 AM', 
    '09:00 AM - 10:00 AM', 
    '10:00 AM - 11:00 AM', 
    '14:00 PM - 15:00 PM', 
    '15:00 PM - 16:00 PM'
  ];

  // If user profile is not fully loaded yet
  if (!userProfile) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Check if L-Permit is approved
  if (userProfile.l_permit_status !== 'approved') {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border-2 border-dashed border-orange-300 shadow-sm p-10 text-center">
          <div className="text-6xl mb-4 text-orange-400"><FileText size={64} className="mx-auto" /></div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">L-Permit Pending</h2>
          <p className="text-gray-500 mb-6">
            Your Learner's Permit has not been approved yet. Please wait for the admin to verify and approve your L-Permit before booking practical sessions.
          </p>
          <button onClick={() => navigate('/student')}
            className="inline-block px-8 py-3 bg-primary hover:bg-orange-600 text-white font-black rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Check if student has been assigned an instructor by the admin
  if (!userProfile.assignedInstructorId) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border-2 border-dashed border-orange-300 shadow-sm p-10 text-center">
          <div className="text-6xl mb-4 text-orange-400"><Users size={64} className="mx-auto" /></div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Instructor Not Assigned</h2>
          <p className="text-gray-500 mb-6">
            You have not been assigned an instructor yet. Please wait for the admin to assign you an instructor and vehicle type before booking practical sessions.
          </p>
          <button onClick={() => navigate('/student')}
            className="inline-block px-8 py-3 bg-primary hover:bg-orange-600 text-white font-black rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      setError('Please select both a date and a time slot.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Conflict Check: Does the instructor already have a booking for this exact Date and Time Slot?
      const conflictQuery = query(
        collection(db, 'sessions'),
        where('instructorId', '==', userProfile.assignedInstructorId),
        where('date', '==', date),
        where('time', '==', timeSlot)
      );
      
      const conflictSnap = await getDocs(conflictQuery);
      
      if (!conflictSnap.empty) {
        // Instructor is booked
        setError('This slot is already booked, please choose another time.');
        setLoading(false);
        return;
      }

      const payload = {
        studentId: userProfile.id || currentUser.uid,
        studentName: userProfile?.name || 'Student',
        student_name: userProfile?.name || 'Student',
        instructorId: userProfile.assignedInstructorId,
        instructorName: userProfile.assignedInstructorName || 'Assigned Instructor',
        date: date,
        timeSlot: timeSlot,
        vehicle: userProfile.vehicleType || 'Not specified',
        type: bookingType,
        createdAt: new Date().toISOString()
      };

      // 2. Add directly to bookings
      const slotRef = await addDoc(collection(db, 'bookings'), {
        ...payload,
        status: 'pending' // Admin will just approve it to assign an instructor
      });

      setSuccess(true);
      setTimeout(() => navigate('/student'), 2500);
      
    } catch (err) {
      console.error(err);
      setError('Failed to initiate booking. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Requested!</h2>
        <p className="text-gray-500 mb-6">Your booking request has been submitted. It will show up on your instructor's schedule once the admin approves it.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
        <p className="text-gray-500 text-sm mt-1">Schedule your next practical driving lesson with your assigned instructor.</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertCircle size={20} className="shrink-0 mt-0.5" /> 
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <motion.form onSubmit={handleBooking} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Readonly Assignment Info */}
        <div className="bg-orange-50/50 p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Users size={16} className="text-primary"/> Assigned Instructor
            </label>
            <div className="text-lg font-bold text-gray-900">
              {userProfile.assignedInstructorName}
            </div>
          </div>
          
          <div className="flex-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Car size={16} className="text-primary"/> Assigned Vehicle Type
            </label>
            <div className="text-lg font-bold text-gray-900">
              {userProfile.vehicleType || 'Manual'}
            </div>
          </div>
        </div>
        
        {/* Booking Type Selection */}
        <div className="px-6 pt-6 pb-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
            <CalendarIcon size={18} className="text-primary"/> Select Booking Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setBookingType('Practice Lesson'); setError(''); }}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border text-left flex flex-col ${
                bookingType === 'Practice Lesson'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
              }`}
            >
              Practice Lesson
              <span className="text-xs font-normal text-gray-500 mt-1">Standard driving practice session.</span>
            </button>

            <button
              type="button"
              disabled={!userProfile.testReady}
              onClick={() => { setBookingType('Road Test'); setError(''); }}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border text-left flex flex-col relative ${
                bookingType === 'Road Test'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
              } ${!userProfile.testReady ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
            >
              Road Test
              <span className="text-xs font-normal text-gray-500 mt-1">
                {!userProfile.testReady ? 'Locked: Instructor approval required.' : 'Official RMV trial test booking.'}
              </span>
              {!userProfile.testReady && (
                <AlertCircle size={16} className="absolute top-3 right-3 text-red-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="p-6 pt-2 space-y-6">
          {/* Date Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
              <CalendarIcon size={18} className="text-primary"/> Select Date
            </label>
            <DatePicker 
              value={date} 
              onChange={(val) => {
                setDate(val);
                setError(''); // clear error when they change input
              }}
              minYear={new Date().getFullYear()} 
              maxYear={new Date().getFullYear() + 1}
              className="w-full sm:w-1/2" 
            />
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
              <Clock size={18} className="text-primary"/> Select Time Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map(slot => (
                <button 
                  key={slot} 
                  type="button" 
                  onClick={() => {
                    setTimeSlot(slot);
                    setError(''); // clear error when they change input
                  }}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                    timeSlot === slot 
                      ? 'bg-primary/90 text-white border-primary shadow-md shadow-orange-500/20' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <button 
            type="submit" 
            disabled={loading || !date || !timeSlot}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : 'Confirm Booking Request'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
