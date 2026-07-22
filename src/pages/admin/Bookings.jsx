import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, where, setDoc } from 'firebase/firestore';
import { Calendar, Car, Clock, Plus, X, Search, UserPlus, Users, AlertCircle } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';
import { TIME_SLOTS, VEHICLE_TYPES } from '../../utils/schedulingEngine';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Walk-in Modal
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinError, setWalkinError] = useState('');
  const [studentMode, setStudentMode] = useState('existing'); // 'existing' | 'new'
  const [studentSearch, setStudentSearch] = useState('');
  const [walkinForm, setWalkinForm] = useState({
    studentId: '',
    studentName: '',
    newStudentName: '',
    newStudentPhone: '',
    vehicleType: '',
    date: new Date().toISOString().split('T')[0],
    timeSlotId: '',
    instructorId: '',
  });

  useEffect(() => {
    // Fetch instructors
    const fetchInstructors = async () => {
      setInstructorsLoading(true);
      try {
        const q = query(collection(db, 'instructors'));
        const snap = await getDocs(q);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching instructors:', err);
      } finally {
        setInstructorsLoading(false);
      }
    };

    // Fetch students
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'students'));
        const snap = await getDocs(q);
        setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };

    fetchInstructors();
    fetchStudents();

    // Listen to BOTH 'bookings' and 'training_slots' so we never miss student-created bookings
    let bookingsList = [];
    let slotsList = [];
    const mergeBoth = () => {
      const combined = [...bookingsList, ...slotsList];
      combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setBookings(combined);
      setLoading(false);
    };

    const q1 = query(collection(db, 'bookings'));
    const unsub1 = onSnapshot(q1, (snap) => {
      bookingsList = snap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'bookings' }));
      mergeBoth();
    });

    const q2 = query(collection(db, 'training_slots'));
    const unsub2 = onSnapshot(q2, (snap) => {
      slotsList = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        _collection: 'training_slots',
        // Normalize field names so the UI renders correctly
        timeSlot: d.data().timeSlot || (d.data().startTime ? `${d.data().startTime} - ${d.data().endTime}` : d.data().time || ''),
        vehicle: d.data().vehicle || d.data().vehicleType || 'Not specified',
      }));
      mergeBoth();
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const booking = bookings.find(b => b.id === id);
      const col = booking?._collection || 'bookings';
      await updateDoc(doc(db, col, id), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignInstructor = async (booking, instructorId) => {
    try {
      const selectedInst = instructors.find(i => i.id === instructorId);
      const instructorName = selectedInst ? selectedInst.name : 'Any';
      const col = booking._collection || 'bookings';
      
      // Only change status if it was already assigned/scheduled, or if changing to 'Any'
      let newStatus = booking.status;
      if (instructorId === 'Any') newStatus = 'pending';
      else if (booking.status === 'pending' || booking.status === 'pending_payment_approval') {
         // keep it pending until they click Approve
      }

      await updateDoc(doc(db, col, booking.id), {
        instructorId,
        instructorName,
        status: newStatus
      });

    } catch (err) {
      console.error('Error assigning instructor:', err);
    }
  };

  const handleApproveBooking = async (booking) => {
    try {
      const instId = booking.instructorId || 'Any';
      if (instId === 'Any') {
        alert("Please assign an instructor from the dropdown first before approving.");
        return;
      }
      const selectedInst = instructors.find(i => i.id === instId);
      const instructorName = selectedInst ? selectedInst.name : 'Unknown';
      const col = booking._collection || 'bookings';
      
      await updateDoc(doc(db, col, booking.id), {
        status: 'scheduled',
        instructorName
      });

      const scheduleId = `SCH-${booking.id}`;
      await setDoc(doc(db, 'sessions', scheduleId), {
        bookingId: booking.id,
        instructorId: instId,
        instructorName: instructorName,
        studentId: booking.studentId,
        studentName: booking.studentName || booking.student_name || 'Unknown',
        date: booking.date,
        time: booking.timeSlot || booking.time || '',
        timeSlot: booking.timeSlot || booking.time || '',
        vehicle: booking.vehicle || booking.vehicleType || 'Any',
        status: 'scheduled',
        createdAt: new Date().toISOString()
      }, { merge: true });

    } catch (err) {
      console.error('Error approving booking:', err);
    }
  };

  const handleRejectBooking = async (booking) => {
    if (!window.confirm("Are you sure you want to reject this booking?")) return;
    try {
      const col = booking._collection || 'bookings';
      await updateDoc(doc(db, col, booking.id), { status: 'cancelled' });
      const scheduleId = `SCH-${booking.id}`;
      await updateDoc(doc(db, 'sessions', scheduleId), { status: 'cancelled' }).catch(() => {});
    } catch (err) {
      console.error('Error rejecting booking:', err);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'pending_payment_approval': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'ongoing': return 'bg-orange-100 text-orange-700';
      case 'absent': return 'bg-red-50 text-red-900';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isInstructorAvailable = (instId, booking) => {
    const conflict = bookings.find(b => 
      b.id !== booking.id && 
      b.instructorId === instId && 
      b.date === booking.date && 
      b.timeSlot === booking.timeSlot && 
      b.status !== 'cancelled'
    );
    return !conflict;
  };

  // ─── Walk-in: All instructors available (no strict filtering) ───
  const walkinAvailableInstructors = useMemo(() => {
    return instructors;
  }, [instructors]);

  // ─── Walk-in: Filtered student list ───
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return allStudents;
    const q = studentSearch.toLowerCase();
    return allStudents.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      s.id.toLowerCase().includes(q)
    );
  }, [allStudents, studentSearch]);

  // ─── Walk-in: Open Modal ───
  const openWalkInModal = () => {
    setWalkinForm({
      studentId: '', studentName: '', newStudentName: '', newStudentPhone: '',
      vehicleType: '', date: new Date().toISOString().split('T')[0],
      timeSlotId: '', instructorId: '',
    });
    setStudentMode('existing');
    setStudentSearch('');
    setWalkinError('');
    setShowWalkIn(true);
  };

  // ─── Walk-in: Submit ───
  const handleWalkinSubmit = async () => {
    setWalkinError('');

    // Validate
    let studentId = walkinForm.studentId;
    let studentName = walkinForm.studentName;

    if (studentMode === 'new') {
      if (!walkinForm.newStudentName.trim()) { setWalkinError('Student name is required.'); return; }
      if (!walkinForm.newStudentPhone.trim()) { setWalkinError('Phone number is required.'); return; }
    } else {
      if (!studentId) { setWalkinError('Please select a student.'); return; }
    }
    if (!walkinForm.vehicleType) { setWalkinError('Vehicle type is required.'); return; }
    if (!walkinForm.date) { setWalkinError('Date is required.'); return; }
    if (!walkinForm.timeSlotId) { setWalkinError('Time slot is required.'); return; }
    if (!walkinForm.instructorId) { setWalkinError('Instructor is required.'); return; }

    setWalkinSubmitting(true);
    try {
      // If creating a new student, save them first
      if (studentMode === 'new') {
        const newStudentId = await generateCustomId('STU');
        await setDoc(doc(db, 'students', newStudentId), {
          id: newStudentId,
          name: walkinForm.newStudentName.trim(),
          phone: walkinForm.newStudentPhone.trim(),
          role: 'student',
          status: 'approved',
          progressLevel: 'Beginner',
          progress: 0,
          createdAt: new Date().toISOString(),
          source: 'walk-in',
        });
        studentId = newStudentId;
        studentName = walkinForm.newStudentName.trim();
      }

      // Create the booking
      const bookingId = await generateCustomId('BKG');
      const selectedSlot = TIME_SLOTS.find(ts => ts.id === walkinForm.timeSlotId);
      const instructor = instructors.find(i => i.id === walkinForm.instructorId);

      await setDoc(doc(db, 'bookings', bookingId), {
        id: bookingId,
        studentId: studentId,
        studentName: studentName,
        instructorId: walkinForm.instructorId,
        instructorName: instructor?.name || '',
        date: walkinForm.date,
        timeSlot: selectedSlot?.label || walkinForm.timeSlotId,
        vehicle: walkinForm.vehicleType,
        status: 'assigned',
        bookingType: 'walk-in',
        createdAt: new Date().toISOString(),
      });

      // Create session entry
      const scheduleId = `SCH-${bookingId}`;
      await setDoc(doc(db, 'sessions', scheduleId), {
        bookingId: bookingId,
        instructorId: walkinForm.instructorId,
        instructorName: instructor?.name || '',
        studentId: studentId,
        studentName: studentName,
        date: walkinForm.date,
        time: selectedSlot?.label || walkinForm.timeSlotId,
        vehicle: walkinForm.vehicleType,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      });

      setShowWalkIn(false);
    } catch (err) {
      console.error('Error creating walk-in booking:', err);
      setWalkinError('Failed to create walk-in booking. ' + err.message);
    } finally {
      setWalkinSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage practical session schedules and assign instructors.</p>
        </div>
        <button
          onClick={openWalkInModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/90 text-white font-semibold hover:bg-primary transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Walk-in
        </button>
      </motion.div>

      {/* ─── Bookings Table ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={16} className="text-primary"/>{b.date}</div>
                      <div className="text-xs text-gray-500 ml-6 flex items-center gap-1"><Clock size={12}/> {b.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{b.studentName || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.bookingType === 'walk-in'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}>
                        {b.bookingType === 'walk-in' ? 'Walk-in' : 'Booked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Car size={16} className="text-gray-400"/>
                        {b.vehicle || 'Any Vehicle'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={b.instructorId || 'Any'}
                        onChange={(e) => handleAssignInstructor(b, e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-orange-500/20 max-w-[150px]"
                      >
                        <option value="Any">Not Assigned (Any)</option>
                        {instructors.map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${getStatusColor(b.status)}`}>
                        {b.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {(b.status === 'pending' || b.status === 'pending_payment_approval') ? (
                          <>
                            <button onClick={() => handleApproveBooking(b)} className="flex items-center justify-center gap-1 w-20 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold text-xs transition shadow-sm">✓ Approve</button>
                            <button onClick={() => handleRejectBooking(b)} className="flex items-center justify-center gap-1 w-20 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-bold text-xs transition shadow-sm">✕ Reject</button>
                          </>
                        ) : (
                          <select 
                            className="px-3 py-1.5 text-xs border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            value="" 
                            onChange={(e) => { if(e.target.value) handleStatusUpdate(b.id, e.target.value) }}
                          >
                            <option value="">Update Status...</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="assigned">Assigned</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          WALK-IN MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showWalkIn && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowWalkIn(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Walk-in Student</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Create a session for a student without a prior booking.</p>
                </div>
                <button onClick={() => setShowWalkIn(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* ─── Section 1: Student ─── */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3">
                    <Users size={13}/> Student
                  </div>
                  {/* Toggle: Existing vs New */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setStudentMode('existing')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${studentMode === 'existing' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <Search size={13} className="inline mr-1"/> Existing Student
                    </button>
                    <button
                      onClick={() => setStudentMode('new')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${studentMode === 'new' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <UserPlus size={13} className="inline mr-1"/> New Student
                    </button>
                  </div>

                  {studentMode === 'existing' ? (
                    <div>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input
                          type="text"
                          placeholder="Search by name, phone, or ID..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-lg">
                        {filteredStudents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">No students found.</div>
                        ) : (
                          filteredStudents.map(s => (
                            <div
                              key={s.id}
                              onClick={() => setWalkinForm(p => ({ ...p, studentId: s.id, studentName: s.name || 'Unknown' }))}
                              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition text-sm ${walkinForm.studentId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                            >
                              <div>
                                <div className="font-semibold text-gray-800">{s.name || 'Unknown'}</div>
                                <div className="text-[11px] text-gray-400">{s.phone || s.email || s.id}</div>
                              </div>
                              {walkinForm.studentId === s.id && <span className="text-primary text-xs font-bold">Selected ✓</span>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label>
                        <input
                          type="text" placeholder="e.g. Ahmed Khan"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={walkinForm.newStudentName}
                          onChange={e => setWalkinForm(p => ({ ...p, newStudentName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number *</label>
                        <input
                          type="tel" placeholder="e.g. 03001234567"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={walkinForm.newStudentPhone}
                          onChange={e => setWalkinForm(p => ({ ...p, newStudentPhone: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Section 2: Session Details ─── */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3">
                    <Calendar size={13}/> Session Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Date *</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        value={walkinForm.date}
                        onChange={e => setWalkinForm(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Time Slot *</label>
                      <select
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        value={walkinForm.timeSlotId}
                        onChange={e => setWalkinForm(p => ({ ...p, timeSlotId: e.target.value, instructorId: '' }))}
                      >
                        <option value="">Select time</option>
                        {TIME_SLOTS.map(ts => (
                          <option key={ts.id} value={ts.id}>{ts.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Vehicle Type *</label>
                      <select
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        value={walkinForm.vehicleType}
                        onChange={e => setWalkinForm(p => ({ ...p, vehicleType: e.target.value }))}
                      >
                        <option value="">Select vehicle type</option>
                        {VEHICLE_TYPES.map(vt => (
                          <option key={vt} value={vt}>{vt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── Section 3: Instructor Assignment ─── */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3">
                    <UserPlus size={13}/> Assign Instructor
                  </div>
                  {instructorsLoading ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 text-xs font-semibold">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> Loading instructors...
                    </div>
                  ) : walkinAvailableInstructors.length > 0 ? (
                    <select
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      value={walkinForm.instructorId}
                      onChange={e => setWalkinForm(p => ({ ...p, instructorId: e.target.value }))}
                    >
                      <option value="">Select instructor</option>
                      {walkinAvailableInstructors.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
                      <AlertCircle size={14}/> No instructors available.
                    </div>
                  )}
                </div>

                {/* ─── Error ─── */}
                {walkinError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
                    <AlertCircle size={14}/> {walkinError}
                  </div>
                )}

                {/* ─── Submit ─── */}
                <button
                  onClick={handleWalkinSubmit}
                  disabled={walkinSubmitting}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {walkinSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16}/> Create Walk-in Booking
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
