import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { Calendar, Clock, User, UserCheck, Search, Edit, X, CalendarDays } from 'lucide-react';

export default function AdminScheduling() {
  const [schedules, setSchedules] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', instructorId: '', status: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const snap = await getDocs(q);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    fetchInstructors();

    const unsub = onSnapshot(query(collection(db, 'student_schedules')), (snap) => {
      // client-side sort to avoid requiring complex indexes immediately
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setSchedules(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return schedules.filter(s => {
      if (statusFilter !== 'all' && (s.status || 'scheduled') !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (s.studentName || '').toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q) ||
          (s.type || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [schedules, statusFilter, searchTerm]);

  const handleEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      date: session.date || '',
      time: session.time || '',
      instructorId: session.instructorId || '',
      status: session.status || 'scheduled'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'student_schedules', editingSession.id), {
        date: editForm.date,
        time: editForm.time,
        instructorId: editForm.instructorId,
        instructorName: instructors.find(i => i.id === editForm.instructorId)?.name || '',
        status: editForm.status
      });
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInstructorName = (id) => {
    if (!id) return 'Unassigned';
    return instructors.find(i => i.id === id)?.name || 'Unknown Instructor';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and assign instructors to auto-generated student schedules.</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by student name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-colors
                  ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No schedules found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 uppercase text-xs font-bold border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Session Type</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-primary" />
                        {s.date || 'TBD'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <Clock size={12} />
                        {s.time || 'TBD'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{s.studentName || 'Unknown Student'}</div>
                      <div className="text-xs text-gray-500 font-mono">{s.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                        {s.type || 'Practice'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.instructorId ? (
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} className="text-green-500" />
                          <span className="font-semibold text-gray-700">{getInstructorName(s.instructorId)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize
                        ${s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {s.status || 'scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(s)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Manage Schedule</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                   <p className="text-xs text-gray-500 font-bold uppercase mb-1">Student</p>
                   <p className="font-bold text-gray-900">{editingSession.studentName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                    <input type="date" required value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                    <input type="time" required value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assign Instructor</label>
                  <select value={editForm.instructorId} onChange={e => setEditForm({...editForm, instructorId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none appearance-none">
                    <option value="">-- Unassigned --</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none appearance-none">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-700 font-bold rounded-xl hover:bg-gray-100 text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm shadow-sm shadow-primary/20">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
