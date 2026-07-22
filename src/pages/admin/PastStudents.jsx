import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Calendar, Award } from 'lucide-react';

export default function PastStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Fetch students and filter those who have completed their training
    const q = query(collection(db, 'students'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter for students who have passed the trial or graduated
      data = data.filter(s => 
        s.practiceStatus === 'graduated' || 
        s.trial_status === 'completed' || 
        s.trial_status === 'passed' ||
        ['completed', 'COMPLETED', 'TRIAL_PASSED'].includes(s.status)
      );

      data.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      
      setStudents(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Past Students & Alumni</h1>
          <p className="text-gray-500 font-medium mt-1">Students who have fully completed their driving training and passed their trials.</p>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex items-center gap-2 shadow-sm">
          <Award className="text-green-600" size={20} />
          <span className="font-bold text-green-800">{students.length} Graduates</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        {loading ? (
           <div className="p-12 text-center">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <p className="text-gray-500 mt-4 font-semibold">Loading alumni records...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-extrabold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5">Student ID</th>
                  <th className="px-6 py-5">Student Name</th>
                  <th className="px-6 py-5">Package Details</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, index) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
                    key={s.id} 
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 font-mono font-bold text-blue-600">
                      {s.id.substring(0, 8).toUpperCase()}...
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 text-base">{s.name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs font-medium mt-1">{s.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-800">{s.selected_package || s.enrolledPackage || 'Standard Package'}</div>
                      <div className="text-gray-500 text-xs font-medium flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {s.classesTotal || 0} Sessions
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-green-100 text-green-700 flex items-center gap-1.5 w-max">
                        <CheckCircle size={14} /> Completed
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => navigate(`/admin/student-report/${s.id}`)}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <FileText size={16} /> View Report
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Award size={48} className="mb-4 text-gray-300" />
                        <p className="text-lg font-bold text-gray-600">No past students yet.</p>
                        <p className="text-sm mt-1">Students will appear here once they complete their training and trial.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
