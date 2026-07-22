import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Users, Calendar, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InstructorDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayClasses: 0,
    upcomingClasses: 0
  });
  const [todaySlots, setTodaySlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const instructorId = userProfile?.id || userProfile?.uid || currentUser?.uid;

  useEffect(() => {
    if (!instructorId) return;

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    // Fetch students count
    const fetchStudents = async () => {
      try {
        // 1. Fetch explicitly assigned students
        const stuQ = query(collection(db, 'students'), where('assignedInstructorId', '==', instructorId));
        const stuSnap = await getDocs(stuQ);
        const assignedIds = new Set(stuSnap.docs.map(d => d.id));

        // 2. Fetch students who have a session with this instructor
        const sessQ = query(collection(db, 'sessions'), where('instructorId', '==', instructorId));
        const sessSnap = await getDocs(sessQ);
        
        // Extract unique student IDs from sessions
        const sessionStudentIds = [...new Set(sessSnap.docs.map(d => d.data().studentId).filter(Boolean))];
        
        // Count total unique students
        sessionStudentIds.forEach(id => assignedIds.add(id));
        
        setStats(prev => ({ ...prev, totalStudents: assignedIds.size }));
      } catch (err) {
        console.error("Error fetching student count:", err);
      }
    };
    fetchStudents();

    // Listen to sessions
    const sessionsQ = query(collection(db, 'sessions'), where('instructorId', '==', instructorId));
    const unsubscribe = onSnapshot(sessionsQ, (snap) => {
      let todayCount = 0;
      let upcomingCount = 0;
      const todayList = [];

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'scheduled') {
          if (data.date === todayStr) {
            todayCount++;
            todayList.push({ id: doc.id, ...data });
          } else if (data.date > todayStr) {
            upcomingCount++;
          }
        }
      });

      todayList.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setTodaySlots(todayList);
      setStats(prev => ({ ...prev, todayClasses: todayCount, upcomingClasses: upcomingCount }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [instructorId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Calendar size={250} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
            Welcome back, {userProfile?.name?.split(' ')[0] || 'Instructor'}! 👋
          </h1>
          <p className="text-blue-100 text-lg max-w-xl">
            You have {stats.todayClasses} {stats.todayClasses === 1 ? 'class' : 'classes'} scheduled for today. Let's get out there and teach!
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">My Students</p>
            <p className="text-3xl font-black text-gray-900">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Today's Classes</p>
            <p className="text-3xl font-black text-gray-900">{stats.todayClasses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Upcoming Bookings</p>
            <p className="text-3xl font-black text-gray-900">{stats.upcomingClasses}</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your appointments for the day.</p>
          </div>
          <button 
            onClick={() => navigate('/instructor/schedule')}
            className="text-primary font-semibold text-sm flex items-center gap-1 hover:text-blue-800 transition-colors"
          >
            View Full Calendar <ChevronRight size={16} />
          </button>
        </div>

        {todaySlots.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Your day is clear!</h3>
            <p className="text-gray-500 mt-2">There are no classes scheduled for you today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todaySlots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <div className="flex h-full">
                  {/* Time Indicator */}
                  <div className="w-32 bg-gray-50 p-6 border-r border-gray-100 flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time</span>
                    <span className="text-lg font-black text-primary">{slot.time || slot.timeSlotId}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          slot.sessionType === 'theory' ? 'bg-purple-100 text-purple-700' :
                          slot.sessionType === 'exam_prep' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {slot.sessionType === 'theory' ? 'Theory Class' : slot.sessionType === 'exam_prep' ? 'Exam Prep' : 'Practical Driving'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Student</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {slot.studentName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <p className="text-xl font-bold text-gray-900">{slot.studentName || 'Unknown Student'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/instructor/students/${slot.studentId}`)}
                      className="w-full py-3 bg-gray-50 hover:bg-primary hover:text-white text-gray-700 font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Log Session & Mark Progress
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
