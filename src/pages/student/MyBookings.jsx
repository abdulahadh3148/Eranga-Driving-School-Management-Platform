import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { CalendarDays, Clock, User, XCircle, CheckCircle } from 'lucide-react';

export default function MyBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Upcoming');
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, 'instructors'));
        const snap = await getDocs(q);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching instructors:', err);
      }
    };
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'sessions'), where('studentId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBookings(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const getInstructorName = (b) => {
    if (b.instructorId === 'Any') return 'Auto-assigned (Pending)';
    if (b.instructorName && b.instructorName !== 'Any') return b.instructorName;
    const inst = instructors.find(i => i.id === b.instructorId);
    return inst ? inst.name : 'Assigned';
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await updateDoc(doc(db, 'sessions', id), { status: 'cancelled' });
      } catch (err) {
        console.error('Error cancelling:', err);
      }
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (tab === 'Upcoming') return b.status === 'scheduled' || b.status === 'ongoing';
    if (tab === 'Completed') return b.status === 'completed';
    if (tab === 'Cancelled') return b.status === 'cancelled' || b.status === 'missed';
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'ongoing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'missed':
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your practical driving sessions.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit">
        {['Upcoming', 'Completed', 'Cancelled'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <CalendarDays size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No {tab.toLowerCase()} bookings found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${getStatusColor(b.status)}`}>
                  {b.status}
                </span>
                {tab === 'Upcoming' && (
                  <button onClick={() => handleCancel(b.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Cancel Booking">
                    <XCircle size={20} />
                  </button>
                )}
              </div>
              <div className="space-y-2.5 mb-4 flex-1">
                <div className="flex items-center gap-3 text-gray-700">
                  <CalendarDays size={18} className="text-primary" /> <span className="text-sm font-medium">{b.date}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={18} className="text-primary" /> <span className="text-sm font-medium">{b.time}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <User size={18} className="text-primary" /> <span className="text-sm font-medium">Instructor: {getInstructorName(b)}</span>
                </div>
              </div>
              {b.status === 'completed' && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-center text-sm text-green-600 font-medium gap-1">
                  <CheckCircle size={16} /> Session Completed
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
