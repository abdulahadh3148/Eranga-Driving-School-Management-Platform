import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle2, Circle, Trophy, Award, Target, BookOpen, Car } from 'lucide-react';

const steps = [
  { id: 'Medical Check', title: 'Medical Certificate', icon: Target, desc: 'Complete RMV medical fitness test.' },
  { id: 'Theory Classes', title: 'Theory Classes', icon: BookOpen, desc: 'Attend required theory sessions.' },
  { id: 'Written Exam', title: 'Written Exam', icon: Award, desc: 'Pass the government RMV written exam.' },
  { id: 'Practical Lessons', title: 'Practical Training', icon: Car, desc: 'Complete mandatory driving hours.' },
  { id: 'Trial Test', title: 'Mock Trial Test', icon: Target, desc: 'Pass the internal school trial test.' },
  { id: 'Road Test', title: 'Official Road Test', icon: CheckCircle2, desc: 'Pass the RMV driving test.' },
  { id: 'Licence Issued', title: 'Licence Issued', icon: Trophy, desc: 'Receive your official driving licence!' },
];

export default function ProgressTracker() {
  const { currentUser, userProfile } = useAuth();
  const [activePackage, setActivePackage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchPackage = async () => {
      try {
        const q = query(
          collection(db, 'student_packages'), 
          where('student_id', '==', currentUser.uid), 
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setActivePackage(snap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [currentUser]);

  const currentStepIdx = steps.findIndex(s => s.id === (userProfile?.currentStep || 'Medical Check'));
  const progress = userProfile?.progress || 0;
  
  // Use package data if available, fallback to profile defaults
  const classesTotal = activePackage?.total_classes || userProfile?.classesTotal || 18;
  const classesDone = activePackage?.completed_classes || userProfile?.classesCompleted || 0; 

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Training Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Track your journey to getting your licence.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6">Milestone Tracker</h2>
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-8 w-0.5 bg-gray-100" />
            
            <div className="space-y-6 relative">
              {steps.map((step, i) => {
                const done = i < currentStepIdx;
                const current = i === currentStepIdx;
                const Icon = step.icon;

                return (
                  <div key={i} className="flex gap-4 group">
                    <div className="relative z-10 flex items-center justify-center mt-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors
                        ${done ? 'bg-green-500 text-white' : current ? 'bg-primary/50 text-white ring-4 ring-orange-500/20' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                      </div>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl border transition-colors
                      ${current ? 'bg-primary/5 border-orange-200' : done ? 'bg-gray-50 border-transparent' : 'bg-white border-gray-100 opacity-60'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold ${current ? 'text-orange-900' : done ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</h3>
                        {current && <span className="px-2.5 py-0.5 rounded-full bg-primary/50 text-white text-xs font-bold uppercase tracking-wider">Current</span>}
                        {done && <span className="text-green-500 text-xs font-bold uppercase">Completed</span>}
                      </div>
                      <p className={`text-sm ${current ? 'text-orange-700' : 'text-gray-500'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-6">Overall Completion</h3>
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="10" 
                  strokeDasharray={`${progress / 100 * 283} 283`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-900">{progress}%</span>
              </div>
            </div>
            {progress === 100 && <p className="mt-4 text-sm font-bold text-green-500">Congratulations! 🎉</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Practical Lessons</h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-gray-900">{classesDone}</span>
              <span className="text-sm font-medium text-gray-500 mb-1">/ {classesTotal} completed</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${classesTotal > 0 ? (classesDone / classesTotal) * 100 : 0}%` }} />
            </div>
            {classesDone >= classesTotal && classesTotal > 0 && (
              <p className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={14}/> Required hours completed.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
