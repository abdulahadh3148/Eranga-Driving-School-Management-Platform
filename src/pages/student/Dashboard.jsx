import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, CalendarDays, BookOpen, CreditCard, ChevronRight, Clock } from 'lucide-react';

const steps = ['Medical Check', 'Theory Classes', 'Written Exam', 'Practical Lessons', 'Trial Test', 'Road Test', 'Licence Issued'];

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'bookings'), where('studentId', '==', currentUser.uid), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, snap => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [currentUser]);

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const currentStepIdx = steps.indexOf(userProfile?.currentStep || 'Medical Check');
  const progress = userProfile?.progress || 0;

  const stats = [
    { label: 'Progress', value: `${progress}%`, icon: TrendingUp, color: 'orange', sub: 'Overall completion' },
    { label: 'Classes Done', value: userProfile?.classesCompleted || 0, icon: BookOpen, color: 'blue', sub: `of ${userProfile?.classesTotal || 18} total` },
    { label: 'Upcoming', value: upcoming.length, icon: CalendarDays, color: 'green', sub: 'sessions booked' },
    { label: 'Fees Due', value: `Rs. ${(userProfile?.outstandingFees || 0).toLocaleString()}`, icon: CreditCard, color: 'red', sub: 'outstanding balance' },
  ];

  const colorMap = { orange: 'bg-primary/10 text-primary', blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600' };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userProfile?.name?.split(' ')[0] || 'Student'}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your driving progress.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Your Progress</h2>
            <Link to="/student/progress" className="text-primary text-sm font-medium hover:text-primary flex items-center gap-1">
              View Details <ChevronRight size={14} />
            </Link>
          </div>
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Overall Completion</span><span>{progress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" />
            </div>
          </div>
          {/* Steps */}
          <div className="space-y-2.5">
            {steps.map((step, i) => {
              const done = i < currentStepIdx;
              const current = i === currentStepIdx;
              return (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                  ${current ? 'bg-primary/5 border border-orange-200' : done ? 'bg-gray-50' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${done ? 'bg-green-500 text-white' : current ? 'bg-primary/50 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${current ? 'text-orange-700' : done ? 'text-gray-500' : 'text-gray-400'}`}>{step}</span>
                  {current && <span className="ml-auto text-xs bg-primary/50 text-white px-2 py-0.5 rounded-full">Current</span>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Upcoming Sessions</h2>
            <Link to="/student/bookings" className="text-primary text-sm font-medium hover:text-primary">View All</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No upcoming sessions</p>
              <Link to="/student/book" className="mt-3 inline-block text-primary text-sm font-medium hover:text-primary">Book Now →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-9 h-9 rounded-xl bg-primary/50 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.date}</p>
                    <p className="text-xs text-gray-500">{b.timeSlot || 'Time TBC'}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium
                      ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/student/book"
            className="mt-4 block w-full text-center py-2.5 rounded-xl bg-primary/50 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
            + Book Session
          </Link>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Book Session', path: '/student/book', icon: '📅', color: 'bg-primary/5 hover:bg-orange-100' },
            { label: 'View Progress', path: '/student/progress', icon: '📊', color: 'bg-blue-50 hover:bg-blue-100' },
            { label: 'Make Payment', path: '/student/payment', icon: '💳', color: 'bg-green-50 hover:bg-green-100' },
            { label: 'My Profile', path: '/student/profile', icon: '👤', color: 'bg-purple-50 hover:bg-purple-100' },
          ].map(({ label, path, icon, color }, i) => (
            <Link key={i} to={path}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors text-center ${color}`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
