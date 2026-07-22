import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, ChevronRight, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MySchedule() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const instructorId = userProfile?.id || userProfile?.uid || currentUser?.uid;

  useEffect(() => {
    if (!instructorId) return;

    const sessionsQ = query(collection(db, 'sessions'), where('instructorId', '==', instructorId));
    
    const unsubscribe = onSnapshot(sessionsQ, (snap) => {
      const fetchedSessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(fetchedSessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [instructorId]);

  // Derived state
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const allBookings = [...sessions].sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));
  
  const upcoming = allBookings
    .filter(b => (b?.date || '') >= todayStr && b?.status !== "completed")
    .sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));
    
  const past = allBookings
    .filter(b => (b?.date || '') < todayStr || b?.status === "completed")
    .sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));

  const displayList = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-500 text-lg">View and manage all your driving classes.</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="bg-white p-1.5 rounded-xl flex gap-2 border border-gray-100 shadow-sm w-full md:w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 md:w-32 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'upcoming' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 md:w-32 py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'past' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Past
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No {activeTab} sessions</h3>
          <p className="text-gray-500">You don't have any {activeTab} classes in your schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((slot) => (
            <div 
              key={slot.id} 
              className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${
                activeTab === 'past' ? 'border-gray-100 opacity-75 grayscale-[20%]' : 'border-gray-200 hover:shadow-xl hover:border-primary/30'
              }`}
            >
              {/* Header Banner */}
              <div className={`p-4 border-b flex justify-between items-center ${
                activeTab === 'past' ? 'bg-gray-50 border-gray-100' : 'bg-primary/5 border-primary/10'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className={activeTab === 'past' ? 'text-gray-400' : 'text-primary'} />
                  <span className={`font-bold ${activeTab === 'past' ? 'text-gray-500' : 'text-primary'}`}>
                    {slot.date}
                  </span>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                  slot.status === 'completed' ? 'bg-green-100 text-green-700' :
                  slot.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {slot.status || 'scheduled'}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-xl font-black text-gray-900">{slot.time || slot.timeSlotId}</span>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                      {slot.studentName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Student</p>
                      <p className="font-bold text-gray-900">{slot.studentName || 'Unknown Student'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Session Type</p>
                      <p className="font-semibold text-gray-700">
                        {slot.sessionType === 'theory' ? 'Theory Class' : slot.sessionType === 'exam_prep' ? 'Exam Prep' : 'Practical Driving'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                <button 
                  onClick={() => navigate(`/instructor/students/${slot.studentId}`)}
                  className="w-full py-2.5 bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <User size={16} />
                  View Student Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
