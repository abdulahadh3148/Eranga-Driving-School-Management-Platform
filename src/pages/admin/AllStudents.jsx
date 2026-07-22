import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Search, Edit, Trash, X, Check, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { PACKAGES } from '../../data/packages';

export default function AllStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = { id: '', name: '', nic: '', phone: '', email: '', packageId: '', status: 'pending' };
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    // Listen to the students collection directly, capped to 200 to prevent crash on large datasets
    const q = query(collection(db, 'students'), limit(200));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("Fetched Students: ", data);
      setStudents(data);
      setLoading(false);
    }, (err) => {
      console.error("Firebase fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.nic?.includes(search)
  );

  const handleEdit = (student) => {
    setIsEditing(true);
    setForm({
      id: student.id,
      name: student.name || '',
      nic: student.nic || '',
      phone: student.phone || '',
      email: student.email || '',
      packageId: student.packageId || '',
      status: student.status || 'pending'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student and all their associated records? This action cannot be undone.")) {
      try {
        const { writeBatch, collection, query, where, getDocs } = await import('firebase/firestore');
        const batch = writeBatch(db);
        
        // Delete the main student document
        batch.delete(doc(db, 'students', id));

        // Helper to query and delete associated records
        const deleteAssociated = async (colName, idField) => {
          const q = query(collection(db, colName), where(idField, '==', id));
          const snap = await getDocs(q);
          snap.docs.forEach(d => batch.delete(d.ref));
        };

        // Delete from all associated collections
        await deleteAssociated('sessions', 'studentId');
        await deleteAssociated('session_progress', 'studentId');
        await deleteAssociated('attendance', 'student_id');
        await deleteAssociated('student_packages', 'student_id');
        
        // Handle variations in field names across older docs
        await deleteAssociated('payments', 'student_id');
        await deleteAssociated('payments', 'studentId');
        
        // Ensure bookings and mock tests are also deleted
        await deleteAssociated('bookings', 'studentId');
        await deleteAssociated('mock_test_results', 'studentId');

        // Commit the batch deletion
        await batch.commit();

        showToast('Student and all related records deleted successfully.');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete student.', 'error');
      }
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        const selectedPkg = PACKAGES.find(p => p.id === form.packageId);
        
        await updateDoc(doc(db, 'students', form.id), {
          name: form.name,
          nic: form.nic,
          phone: form.phone,
          status: form.status,
          packageId: form.packageId,
          packageName: selectedPkg ? selectedPkg.name : null,
          updatedAt: new Date().toISOString()
        });
        
        showToast('Student profile updated successfully!');
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showToast('Error saving student.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all registered students in the system.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-orange-500" />
        </div>
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
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{s.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{s.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{s.nic || 'No NIC'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{s.phone || 'No Phone'}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{s.packageName || s.enrolledPackage || s.packageId || 'Not Enrolled'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize
                        ${s.status === 'approved' ? 'bg-green-100 text-green-700' : s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/admin/students/${s.id}`)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View Profile"><Eye size={16} /></button>
                      <button onClick={() => handleEdit(s)} className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal for Edit */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-6">
                <form id="student-form" onSubmit={handleSaveStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">NIC Number</label>
                    <input required value={form.nic} onChange={e => setForm({...form, nic: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Package / Course</label>
                    <select value={form.packageId || ''} onChange={e => setForm({...form, packageId: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                      <option value="">Not Enrolled</option>
                      {PACKAGES.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" form="student-form" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Check size={18} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold text-sm z-[60] ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
