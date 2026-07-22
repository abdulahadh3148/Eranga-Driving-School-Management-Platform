import React, { useState, useEffect } from 'react';
import { CalendarClock, PlusCircle, Trash, Clock, User, CheckCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, addDoc, deleteDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { sendNotification } from '../../utils/notifications';

export default function SchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const initialFormState = {
    date: getTodayString(),
    timeSlot: '08:00-09:00',
    instructorId: '',
    studentId: '',
    sessionType: 'practical'
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instSnap = await getDocs(query(collection(db, 'instructors')));
        setInstructors(instSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const stuSnap = await getDocs(query(collection(db, 'students')));
        setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching data for schedule:", err);
      }
    };
    fetchData();

    const q = query(collection(db, 'sessions'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let fetchedSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date descending
      fetchedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(fetchedSessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedInstructor = instructors.find(i => i.id === form.instructorId);
      const selectedStudent = students.find(s => s.id === form.studentId);

      // Helper to parse time string "HH:MM" into minutes
      const toMins = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const [startTimeRaw, endTimeRaw] = form.timeSlot.split('-');
      const startTime = startTimeRaw.trim();
      const endTime = endTimeRaw.trim();

      const newStart = toMins(startTime);
      const newEnd = toMins(endTime);

      if (newStart >= newEnd) {
        alert("Start time must be before end time.");
        setSubmitting(false);
        return;
      }

      // Find any overlapping session on the same date
      const overlap = sessions.find(s => {
        if (s.date !== form.date) return false;
        // Ignore completed or cancelled sessions for conflicts
        if (s.status === 'completed' || s.status === 'cancelled') return false;

        // Retrieve or parse start/end times
        let sStart = 0;
        let sEnd = 0;

        if (s.startTime && s.endTime) {
          sStart = toMins(s.startTime);
          sEnd = toMins(s.endTime);
        } else if (s.time) {
          // Fallback parsing for time slot strings like "09:00 - 10:00" or similar
          const parts = s.time.split('-');
          if (parts.length === 2) {
            sStart = toMins(parts[0].trim());
            sEnd = toMins(parts[1].trim());
          } else {
            sStart = toMins(s.time.trim());
            sEnd = sStart + 60; // default 1 hour if not parsable
          }
        }

        // Check if times overlap
        const isOverlapping = newStart < sEnd && sStart < newEnd;
        if (!isOverlapping) return false;

        // Check if same instructor or same student
        return s.instructorId === form.instructorId || s.studentId === form.studentId;
      });

      if (overlap) {
        if (overlap.instructorId === form.instructorId) {
          alert(`Conflict: Instructor ${selectedInstructor?.name || 'this instructor'} is already scheduled for a session from ${overlap.startTime || overlap.time} with student ${overlap.studentName}.`);
        } else {
          alert(`Conflict: Student ${selectedStudent?.name || 'this student'} is already scheduled for a session from ${overlap.startTime || overlap.time} with instructor ${overlap.instructorName}.`);
        }
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'sessions'), {
        date: form.date,
        time: `${startTime} - ${endTime}`,
        startTime: startTime,
        endTime: endTime,
        instructorId: form.instructorId,
        instructorName: selectedInstructor?.name || 'Unknown',
        studentId: form.studentId,
        studentName: selectedStudent?.name || 'Unknown',
        sessionType: form.sessionType,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });

      // Send notifications to Student and Instructor
      await sendNotification({
        userId: form.studentId,
        title: 'New Session Scheduled',
        message: `You have a new ${form.sessionType.replace('_', ' ')} session on ${form.date} from ${startTime} to ${endTime}.`,
        type: 'info',
        link: '/student/booking'
      });

      await sendNotification({
        userId: form.instructorId,
        title: 'New Session Assigned',
        message: `You have a new session on ${form.date} from ${startTime} to ${endTime} with ${selectedStudent?.name}.`,
        type: 'info',
        link: '/instructor'
      });

      setForm(initialFormState);
    } catch (err) {
      console.error("Error scheduling session:", err);
      alert("Failed to schedule session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteDoc(doc(db, 'sessions', id));
      } catch (err) {
        console.error("Error deleting session:", err);
      }
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Master Schedule</h1>
        <p className="text-gray-500 mt-1">Manage instructor availability and schedule driving sessions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Side: Create Slot Form (35%) */}
        <div className="w-full lg:w-[35%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <PlusCircle className="text-primary" size={24} />
            <h2 className="text-lg font-semibold text-gray-800">Schedule a Session</h2>
          </div>

          <form className="space-y-4" onSubmit={handleAddSession}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                required
                type="date" 
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <select 
                required
                value={form.timeSlot}
                onChange={e => setForm({...form, timeSlot: e.target.value})}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white"
              >
                <option value="06:00-07:00">06:00 AM - 07:00 AM</option>
                <option value="07:00-08:00">07:00 AM - 08:00 AM</option>
                <option value="08:00-09:00">08:00 AM - 09:00 AM</option>
                <option value="09:00-10:00">09:00 AM - 10:00 AM</option>
                <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                <option value="12:00-13:00">12:00 PM - 01:00 PM</option>
                <option value="13:00-14:00">01:00 PM - 02:00 PM</option>
                <option value="14:00-15:00">02:00 PM - 03:00 PM</option>
                <option value="15:00-16:00">03:00 PM - 04:00 PM</option>
                <option value="16:00-17:00">04:00 PM - 05:00 PM</option>
                <option value="17:00-18:00">05:00 PM - 06:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <select 
                required
                value={form.instructorId}
                onChange={e => setForm({...form, instructorId: e.target.value})}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white"
                disabled={!!students.find(s => s.id === form.studentId)?.assignedInstructorId}
              >
                <option value="">Select Instructor...</option>
                {instructors
                  .filter(inst => {
                    const selStu = students.find(s => s.id === form.studentId);
                    if (selStu?.assignedInstructorId) {
                      return inst.id === selStu.assignedInstructorId;
                    }
                    return true;
                  })
                  .map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select 
                required
                value={form.studentId}
                onChange={e => {
                  const val = e.target.value;
                  const selStu = students.find(s => s.id === val);
                  let inst = form.instructorId;
                  if (selStu?.assignedInstructorId) {
                    inst = selStu.assignedInstructorId;
                  }
                  setForm({...form, studentId: val, instructorId: inst});
                }}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white"
              >
                <option value="">Select Student...</option>
                {students.map(stu => (
                  <option key={stu.id} value={stu.id}>{stu.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <select 
                required
                value={form.sessionType}
                onChange={e => setForm({...form, sessionType: e.target.value})}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white"
              >
                <option value="practical">Practical Driving</option>
                <option value="theory">Theory Class</option>
                <option value="exam_prep">Exam Prep</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors mt-4 flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} />
              {submitting ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </form>
        </div>

        {/* Right Side: List of Sessions (65%) */}
        <div className="w-full lg:w-[65%] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarClock className="text-primary" size={20} />
              All Scheduled Sessions
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{sessions.length} Sessions</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 text-gray-500 flex flex-col items-center">
                <CalendarClock size={48} className="text-gray-300 mb-4" />
                <p>No sessions scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-50 text-orange-600 rounded-lg p-3 text-center min-w-[70px]">
                        <div className="text-xs font-bold uppercase">{new Date(session.date).toLocaleString('default', { month: 'short' })}</div>
                        <div className="text-xl font-black">{new Date(session.date).getDate()}</div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            session.status === 'completed' ? 'bg-green-100 text-green-700' :
                            session.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {session.status || 'Scheduled'}
                          </span>
                          <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                            <Clock size={14} /> {session.time}
                          </span>
                        </div>
                        
                        <div className="font-bold text-gray-900 flex items-center gap-2 mt-2">
                          <User size={16} className="text-gray-400" />
                          {session.studentName} <span className="text-gray-400 text-sm font-normal">with</span> {session.instructorName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">
                          {session.sessionType?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Session"
                      >
                        <Trash size={18} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
