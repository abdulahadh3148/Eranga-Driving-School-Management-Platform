import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { Calendar, Users, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [batches, setBatches] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  useEffect(() => {
    // Fetch batches and instructors for filters
    const fetchMetadata = async () => {
      try {
        const bSnap = await getDocs(collection(db, 'batches'));
        setBatches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const iSnap = await getDocs(collection(db, 'users'));
        setInstructors(iSnap.docs.filter(d => d.data().role === 'instructor').map(d => ({ id: d.id, ...d.data() })));
      } catch(err) { console.error(err); }
    };
    fetchMetadata();

    // Fetch all attendance
    const unsub = onSnapshot(collection(db, 'attendance'), (snap) => {
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (dateFilter && a.date !== dateFilter) return false;
      if (batchFilter !== 'all' && a.batch_id !== batchFilter) return false;
      if (instructorFilter !== 'all' && a.instructor_id !== instructorFilter) return false;
      return true;
    });
  }, [attendance, dateFilter, batchFilter, instructorFilter]);

  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    if (total === 0) return { present: 0, late: 0, absent: 0 };
    return {
      present: filteredAttendance.filter(a => a.status === 'present').length,
      late: filteredAttendance.filter(a => a.status === 'late').length,
      absent: filteredAttendance.filter(a => a.status === 'absent').length,
    };
  }, [filteredAttendance]);

  const getInstructorName = (id) => instructors.find(i => i.id === id)?.name || id;
  const getBatchName = (id) => batches.find(b => b.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor daily attendance across all batches and instructors.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Batch</label>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm">
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Instructor</label>
          <select value={instructorFilter} onChange={e => setInstructorFilter(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm">
            <option value="all">All Instructors</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-green-600 uppercase">Present</p><p className="text-2xl font-black text-green-700">{stats.present}</p></div>
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-yellow-600 uppercase">Late</p><p className="text-2xl font-black text-yellow-700">{stats.late}</p></div>
          <Clock className="text-yellow-500" size={32} />
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-red-600 uppercase">Absent</p><p className="text-2xl font-black text-red-700">{stats.absent}</p></div>
          <XCircle className="text-red-500" size={32} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No attendance records found for these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendance.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{record.student_name || record.student_id}</td>
                    <td className="px-6 py-4 text-gray-600">{getBatchName(record.batch_id)}</td>
                    <td className="px-6 py-4 text-gray-600">{getInstructorName(record.instructor_id)}</td>
                    <td className="px-6 py-4">
                      {record.status === 'present' && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Present</span>}
                      {record.status === 'late' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded uppercase">Late</span>}
                      {record.status === 'absent' && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">Absent</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
