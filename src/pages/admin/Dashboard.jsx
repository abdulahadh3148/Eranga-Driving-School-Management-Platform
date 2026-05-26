import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Users, UserPlus, CreditCard, CalendarDays, TrendingUp, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, pending: 0, revenue: 0, bookings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsSnap, pendingSnap, paySnap, bookSnap, recentBookSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
          getDocs(query(collection(db, 'users'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'payments'), where('status', '==', 'paid'))),
          getDocs(query(collection(db, 'bookings'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5)))
        ]);

        const revenue = paySnap.docs.reduce((sum, doc) => sum + Number(doc.data().amount), 0);

        setStats({
          totalStudents: studentsSnap.size,
          pending: pendingSnap.size,
          revenue,
          bookings: bookSnap.size
        });

        setRecentBookings(recentBookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'blue' },
    { label: 'Pending Approvals', value: stats.pending, icon: UserPlus, color: 'orange' },
    { label: 'Total Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: CreditCard, color: 'green' },
    { label: 'Pending Bookings', value: stats.bookings, icon: CalendarDays, color: 'purple' },
  ];

  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of school operations and metrics.</p>
      </motion.div>

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

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-primary text-sm font-semibold hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>)}
            </div>
          ) : recentBookings.length === 0 ? (
             <p className="text-gray-500 text-center py-4">No recent bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Student</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.studentName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-600">{b.date} <br/><span className="text-xs text-gray-400">{b.timeSlot}</span></td>
                      <td className="px-4 py-3 text-gray-600">{b.instructorId === 'Any' ? 'Auto-Assign' : 'Specific'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize
                          ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { path: '/admin/pending-students', icon: UserPlus, label: 'Approvals' },
              { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
              { path: '/admin/instructors', icon: Users, label: 'Instructors' },
              { path: '/admin/vehicles', icon: Car, label: 'Vehicles' },
            ].map(({ path, icon: Icon, label }, i) => (
              <Link key={i} to={path} className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary transition-colors border border-gray-100">
                <Icon size={24} className="mb-2 text-gray-400" />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
