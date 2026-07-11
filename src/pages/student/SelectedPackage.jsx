import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import {
  Package, BookOpen, Clock, CheckSquare, Square,
  TrendingUp, CalendarPlus, Car, Tag, AlertTriangle
} from 'lucide-react';
import { getCategoryById } from '../../data/packages';

// ── Theme ────────────────────────────────────────────────────────────────────
const CAT_THEME = {
  lv: {
    gradient: 'from-blue-500 to-blue-700',
    gradientLight: 'from-blue-50 to-white',
    light: 'bg-blue-50', border: 'border-blue-200',
    text: 'text-blue-700', hex: '#2563EB',
  },
  hv: {
    gradient: 'from-violet-500 to-violet-700',
    gradientLight: 'from-violet-50 to-white',
    light: 'bg-violet-50', border: 'border-violet-200',
    text: 'text-violet-700', hex: '#7C3AED',
  },
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SelectedPackage() {
  const { userProfile } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.packageId) { setLoading(false); return; }
    const uid = userProfile?.id || userProfile?.uid || userProfile?.userId || '';
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, 'student_packages'),
      where('student_id', '==', uid),
      where('status', '==', 'active')
    );
    const unsub = onSnapshot(q, snap => {
      setEnrollment(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      setLoading(false);
    });
    return unsub;
  }, [userProfile]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── No package ────────────────────────────────────────────────────────────
  if (!userProfile?.packageId || !enrollment) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto">
        <Package size={56} className="text-gray-200 mx-auto mb-5" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">No Active Training Package</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
          You haven't enrolled in any training package yet.<br />
          Start by choosing your category and vehicle.
        </p>
        <Link to="/student/packages"
          className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm">
          Browse Training Packages →
        </Link>
      </motion.div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const theme = CAT_THEME[enrollment.category_id] || CAT_THEME.lv;
  const total = enrollment.total_classes || 0;
  const completed = enrollment.completed_classes || userProfile?.classesCompleted || 0;
  const remaining = Math.max(0, total - completed);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const skills = enrollment.skills || [];
  const doneSkills = skills.filter(s => s.done).length;

  const endDate = enrollment.end_date ? new Date(enrollment.end_date) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / 86400000)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 5;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-gray-900">My Training Plan</h1>
        <p className="text-gray-500 mt-1">Track your progress, skills, and upcoming sessions.</p>
      </motion.div>

      {/* ── Expiry warning ── */}
      {isExpiringSoon && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-black text-sm">Package Expiring Soon</p>
            <p className="text-sm opacity-80">Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left. Contact admin to extend.</p>
          </div>
        </motion.div>
      )}

      {/* ── Hero banner ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-2xl overflow-hidden bg-gradient-to-r ${theme.gradient} text-white shadow-xl`}>
        <div className="p-6 md:p-8">
          {/* Category + Vehicle pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-black uppercase tracking-wider">🟢 Active</span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold">
              {enrollment.category_name || getCategoryById(enrollment.category_id)?.name || enrollment.category_id}
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold">
              {(enrollment.included_vehicles || []).join(' + ')}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black leading-tight">{enrollment.package_name}</h2>

          {/* Dates row */}
          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Started</p>
              <p className="font-bold">{fmt(enrollment.start_date)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Ends</p>
              <p className={`font-bold ${isExpiringSoon ? 'text-yellow-300' : ''}`}>{fmt(enrollment.end_date)}</p>
            </div>
            {daysLeft !== null && (
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Days Left</p>
                <p className={`font-bold ${isExpiringSoon ? 'text-yellow-300' : ''}`}>{daysLeft} days</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-8 pb-6">
          <div className="flex justify-between text-xs mb-2 text-white/80">
            <span>Overall Progress</span>
            <span className="font-black">{percent}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
              className="h-full bg-white rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Classes', value: total, icon: BookOpen, sub: 'in package', color: theme.text, bg: theme.light },
          { label: 'Completed', value: completed, icon: CheckSquare, sub: 'sessions done', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Remaining', value: remaining, icon: Clock, sub: 'sessions left', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs font-bold text-gray-600">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Details + Skills + Progress ── */}
      <div className="grid md:grid-cols-5 gap-5">

        {/* Skills checklist — wider */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900">Skills to Learn</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${theme.light} ${theme.text}`}>
              {doneSkills}/{skills.length} mastered
            </span>
          </div>

          {skills.length > 0 ? (
             <div className="space-y-2.5">
               {skills.map((skill, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                   className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors ${skill.done ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                   {skill.done
                     ? <CheckSquare size={20} className="text-green-500 flex-shrink-0" />
                     : <Square size={20} className="text-gray-300 flex-shrink-0" />
                   }
                   <span className={`text-sm font-semibold ${skill.done ? 'text-green-700 line-through decoration-green-400' : 'text-gray-700'}`}>
                     {skill.name}
                   </span>
                   {skill.done && <span className="ml-auto text-xs font-black text-green-500">✓ Done</span>}
                 </motion.div>
               ))}
             </div>
           ) : (
             <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
               <Package className="mx-auto text-gray-300 mb-2" size={24} />
               <p className="text-gray-500 text-sm font-medium">Skill tracking will start soon.</p>
             </div>
           )}
          <p className="text-xs text-gray-400 mt-4 text-center">
            Skills are marked complete by your instructor after each session.
          </p>
        </motion.div>

        {/* Right column */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="md:col-span-2 flex flex-col gap-4">

          {/* Circular progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
            <h3 className="font-black text-gray-900 text-sm mb-5 self-start">Session Progress</h3>
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12"
                  stroke={theme.hex}
                  strokeDasharray={`${percent * 3.14159} 314.159`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-gray-900">{percent}%</span>
                <span className="text-xs text-gray-400">Complete</span>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-700">{completed} of {total} sessions done</p>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
            <h3 className="font-black text-gray-900 text-sm">Training Info</h3>
            <div className="flex items-start gap-3">
              <Tag size={15} className={`${theme.text} mt-0.5 flex-shrink-0`} />
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="font-bold text-gray-800">{enrollment.category_name || getCategoryById(enrollment.category_id)?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car size={15} className={`${theme.text} mt-0.5 flex-shrink-0`} />
              <div>
                <p className="text-xs text-gray-400">Combo</p>
                <p className="font-bold text-gray-800">{(enrollment.included_vehicles || []).join(' + ')}</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2.5">
            <Link to="/student/book"
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-white font-black text-sm bg-gradient-to-r ${theme.gradient} hover:opacity-90 shadow-md transition-all`}>
              <CalendarPlus size={17} /> Book Next Session
            </Link>
            <Link to="/student/progress"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors">
              <TrendingUp size={17} /> View Full Progress
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
