import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Clock, User, Star, MapPin } from 'lucide-react';

const RatingInput = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl">
      <span className="font-bold text-gray-700 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${
              value === num 
                ? 'bg-primary text-white shadow-md shadow-orange-500/20' 
                : 'bg-white text-gray-500 border border-gray-200 hover:border-primary/50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function InstructorAttendance() {
  const { userProfile } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // Forms state: keyed by sessionId
  const [forms, setForms] = useState({});

  useEffect(() => {
    fetchTodaySessions();
  }, [userProfile]);

  const fetchTodaySessions = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    
    try {
      // Get today's date string in YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      const q = query(
        collection(db, 'schedules'), 
        where('instructorId', '==', userProfile.id),
        where('date', '==', today)
      );
      
      const snap = await getDocs(q);
      const fetchedSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter out those already completed, and sort by time
      const pendingSessions = fetchedSessions
        .filter(s => s.status !== 'Completed' && s.status !== 'completed')
        .sort((a, b) => a.time.localeCompare(b.time));

      setSessions(pendingSessions);
      
      // Initialize form states
      const initialForms = {};
      pendingSessions.forEach(s => {
        initialForms[s.id] = {
          attendance: 'Present',
          ratings: {
            steering: 3,
            gear: 3,
            parking: 3
          },
          remarks: ''
        };
      });
      setForms(initialForms);

    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (sessionId, field, value) => {
    setForms(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: value
      }
    }));
  };

  const updateRating = (sessionId, category, value) => {
    setForms(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        ratings: {
          ...prev[sessionId].ratings,
          [category]: value
        }
      }
    }));
  };

  const handleSubmit = async (sessionId, studentId) => {
    const formData = forms[sessionId];
    if (!formData) return;
    
    setSubmittingId(sessionId);
    try {
      // 1. Update the Session Document
      await updateDoc(doc(db, 'schedules', sessionId), {
        status: 'Completed',
        attendance: formData.attendance,
        ratings: formData.ratings,
        remarks: formData.remarks,
        completedAt: new Date().toISOString()
      });

      // 2. Update Student Profile if Present
      if (formData.attendance === 'Present') {
        await updateDoc(doc(db, 'students', studentId), {
          classesCompleted: increment(1)
        });
      }

      // 3. Remove session from view
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
    } catch (err) {
      console.error('Error submitting tracker:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-20 px-4 md:px-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Daily Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track today's sessions, mark attendance, and grade your students.
        </p>
      </motion.div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading today's schedule...</p>
        </div>
      ) : sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-500">There are no pending sessions to track for today.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, index) => {
            const formData = forms[session.id];
            if (!formData) return null;

            return (
              <motion.div 
                key={session.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-900 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">
                      {session.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{session.studentName}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                        <span className="flex items-center gap-1"><Clock size={12}/> {session.time}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 uppercase tracking-wider">{session.vehicle}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-6">
                  
                  {/* Attendance */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Attendance</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateForm(session.id, 'attendance', 'Present')}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                          formData.attendance === 'Present' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-200 text-gray-500 hover:border-green-200'
                        }`}
                      >
                        <User size={18} /> Present
                      </button>
                      <button
                        onClick={() => updateForm(session.id, 'attendance', 'Absent')}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                          formData.attendance === 'Absent' 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-200 text-gray-500 hover:border-red-200'
                        }`}
                      >
                        <User size={18} /> Absent
                      </button>
                    </div>
                  </div>

                  {formData.attendance === 'Present' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                      
                      {/* Ratings */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Performance Ratings (1-5)</label>
                        <div className="space-y-3">
                          <RatingInput 
                            label="Steering Control" 
                            value={formData.ratings.steering} 
                            onChange={(v) => updateRating(session.id, 'steering', v)} 
                          />
                          <RatingInput 
                            label="Gear Shifting" 
                            value={formData.ratings.gear} 
                            onChange={(v) => updateRating(session.id, 'gear', v)} 
                          />
                          <RatingInput 
                            label="Parking Skills" 
                            value={formData.ratings.parking} 
                            onChange={(v) => updateRating(session.id, 'parking', v)} 
                          />
                        </div>
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Remarks / Notes</label>
                        <textarea
                          rows={3}
                          placeholder="How did the student perform today? Any areas of improvement?"
                          value={formData.remarks}
                          onChange={(e) => updateForm(session.id, 'remarks', e.target.value)}
                          className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 resize-none"
                        ></textarea>
                      </div>

                    </motion.div>
                  )}

                </div>
                
                {/* Submit Action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleSubmit(session.id, session.studentId)}
                    disabled={submittingId === session.id}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingId === session.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Mark Completed
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
