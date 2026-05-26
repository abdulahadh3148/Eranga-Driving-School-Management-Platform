import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const snap = await getDocs(q);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching instructors:', err);
      }
    };
    fetchInstructors();

    const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignInstructor = async (bookingId, instructorId) => {
    try {
      const selectedInst = instructors.find(i => i.id === instructorId);
      const instructorName = selectedInst ? selectedInst.name : 'Any';
      await updateDoc(doc(db, 'bookings', bookingId), {
        instructorId,
        instructorName
      });
    } catch (err) {
      console.error('Error assigning instructor:', err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage practical session schedules.</p>
      </motion.div>

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
                      <div className="text-xs text-gray-500 ml-6">{b.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{b.studentName || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={b.instructorId || 'Any'}
                        onChange={(e) => handleAssignInstructor(b.id, e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-orange-500/20"
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
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(b.id, 'confirmed')} className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">
                            <CheckCircle size={14}/> Confirm
                          </button>
                          <button onClick={() => handleStatusUpdate(b.id, 'cancelled')} className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                            <XCircle size={14}/> Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
