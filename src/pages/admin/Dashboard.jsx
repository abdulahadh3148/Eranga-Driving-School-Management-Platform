import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Users, FileText, CheckCircle, ShieldAlert, CreditCard, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendingMedical: 0, pendingPermit: 0, readyForTrial: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("Fetched Students in Dashboard: ", allStudents);
      // Client-side sort to prevent Firebase missing index error
      allStudents.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      let pendingMedical = 0;
      let pendingPermit = 0;
      let readyForTrial = 0;

      const enrichedStudents = allStudents.map(student => {
        const medStatus = student.medical_status || 'not_started';
        if (medStatus === 'submitted') pendingMedical++;

        const permitStatus = student.l_permit_status || student.permit_status || 'not_started';
        if (permitStatus === 'submitted') pendingPermit++;

        const practiceDone = student.practiceStatus === 'waiting_for_trial' || ((student.classesTotal > 0) && (student.classesCompleted >= student.classesTotal));
        const paymentDone = student.total_price > 0 && student.outstandingFees <= 0;
        if ((student.practiceStatus === 'waiting_for_trial' || practiceDone) && student.trial_status !== 'completed' && student.trial_status !== 'scheduled') {
          readyForTrial++;
        }

        return { ...student, practiceDone, paymentDone };
      });

      setStats({ total: allStudents.length, pendingMedical, pendingPermit, readyForTrial });
      setStudents(enrichedStudents);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching students:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    { label: 'Total Enrolled', value: stats.total, icon: Users, color: 'blue' },
    { label: 'Pending Medical', value: stats.pendingMedical, icon: FileText, color: 'orange' },
    { label: 'Pending L-Permits', value: stats.pendingPermit, icon: ShieldAlert, color: 'purple' },
    { label: 'Ready for Trial', value: stats.readyForTrial, icon: Award, color: 'green' },
  ];

  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  };

  const getStatusBadge = (type, val) => {
    if (type === 'doc') {
      if (val === 'approved') return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold uppercase">Approved</span>;
      if (val === 'submitted') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold uppercase animate-pulse">Needs Review</span>;
      return <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold uppercase">Missing</span>;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Lifecycle Master</h1>
          <p className="text-gray-500 text-sm mt-1">Track every student's journey from registration to trial exam.</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{label}</p>
              <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Master Tracking Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Student Progress Tracking</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-center">Medical</th>
                  <th className="px-6 py-4 text-center">L Permit</th>
                  <th className="px-6 py-4 text-center">Practice</th>
                  <th className="px-6 py-4 text-center">Payment</th>
                  <th className="px-6 py-4 text-center">Trial</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/admin/students/${s.id}`)}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.enrolledPackage || 'No Package'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge('doc', s.medical_status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge('doc', s.permit_status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold ${s.practiceDone ? 'text-green-600' : 'text-gray-600'}`}>
                          {s.classesCompleted || 0} / {s.classesTotal || 0}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${s.classesTotal > 0 ? ((s.classesCompleted||0)/s.classesTotal)*100 : 0}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${s.paymentDone ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.paymentDone ? 'Settled' : `Due: Rs.${s.outstandingFees}`}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.trial_status === 'completed' ? (
                        <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> Passed</span>
                      ) : s.trial_status === 'scheduled' ? (
                        <span className="text-blue-600 font-bold text-xs">{s.trial_date}</span>
                      ) : s.practiceStatus === 'waiting_for_trial' ? (
                        <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 font-bold text-xs uppercase animate-pulse">Ready</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold uppercase">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors">
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
