import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PendingStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAction = async (id, status) => {
    const confirmMsg = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${confirmMsg} this student?`)) return;
    try {
      await updateDoc(doc(db, 'users', id), { status });
      fetchStudents(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve new student registrations.</p>
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
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Package/License</th>
                  <th className="px-6 py-4">Registered On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{s.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{s.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{s.email} | {s.phone || 'No Phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{s.packageId || 'None'}</div>
                      <div className="text-xs text-gray-500">{s.licenseType || 'Any'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleAction(s.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-bold hover:bg-green-100 transition-colors">
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button onClick={() => handleAction(s.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors">
                        <XCircle size={16} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No pending approvals at this time.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
