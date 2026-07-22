import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Calendar, User, Car, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrialExams() {
  const [students, setStudents] = useState([]);
  const [scheduledStudents, setScheduledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' | 'scheduled'
  
  // State for storing the selected dates for each student
  const [examDates, setExamDates] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const qWaiting = query(
        collection(db, 'students'), 
        where('practiceStatus', '==', 'waiting_for_trial')
      );
      const snapWaiting = await getDocs(qWaiting);
      const fetchedWaiting = snapWaiting.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(fetchedWaiting);

      const qScheduled = query(
        collection(db, 'students'), 
        where('practiceStatus', '==', 'trial_scheduled')
      );
      const snapScheduled = await getDocs(qScheduled);
      setScheduledStudents(snapScheduled.docs.map(d => ({ id: d.id, ...d.data() })));

      // Initialize date states
      const datesObj = {};
      fetchedWaiting.forEach(s => {
        datesObj[s.id] = '';
      });
      setExamDates(datesObj);

    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (id, value) => {
    setExamDates(prev => ({ ...prev, [id]: value }));
  };

  const handleSchedule = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentOutstanding = student.outstandingFees !== undefined ? student.outstandingFees : (student.total_price || 0);
    if (currentOutstanding > 0) {
      alert(`Cannot schedule trial. Student has an outstanding balance of Rs. ${currentOutstanding}. Payments must be completed first.`);
      return;
    }

    const selectedDate = examDates[studentId];
    if (!selectedDate) {
      alert("Please select an exam date before scheduling.");
      return;
    }

    setSubmittingId(studentId);
    try {
      await updateDoc(doc(db, 'students', studentId), {
        trialDate: selectedDate,
        trial_date: selectedDate,
        trial_status: 'scheduled',
        practiceStatus: 'trial_scheduled'
      });

      // Remove from list and add to scheduled
      const scheduledStudent = students.find(s => s.id === studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (scheduledStudent) {
        setScheduledStudents(prev => [...prev, { ...scheduledStudent, trialDate: selectedDate, trial_date: selectedDate, trial_status: 'scheduled', practiceStatus: 'trial_scheduled' }]);
      }
      alert("Trial Exam scheduled successfully!");
    } catch (err) {
      console.error("Error scheduling trial:", err);
      alert("Failed to schedule trial. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePass = async (studentId) => {
    if (!window.confirm('Mark this student as PASSED?')) return;
    setSubmittingId(studentId);
    try {
      await updateDoc(doc(db, 'students', studentId), {
        practiceStatus: 'graduated',
        trial_status: 'completed'
      });
      setScheduledStudents(prev => prev.filter(s => s.id !== studentId));
      alert("Student marked as Graduated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleFail = async (student) => {
    if (!window.confirm('Mark this student as FAILED? This will add a Rs. 5000 fee and grant 3 more sessions.')) return;
    setSubmittingId(student.id);
    try {
      await updateDoc(doc(db, 'students', student.id), {
        practiceStatus: 'retraining',
        total_price: (Number(student.total_price) || 0) + 5000,
        packageSessions: (Number(student.packageSessions) || 0) + 3
      });
      setScheduledStudents(prev => prev.filter(s => s.id !== student.id));
      alert("Student marked as Failed. Retraining required.");
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Trial Exams</h1>
          <p className="text-gray-500 text-sm mt-1">
            Schedule trials and record exam results for your students.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'waiting' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Waiting for Trial ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'scheduled' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Scheduled Trials ({scheduledStudents.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading waiting list...</p>
        </div>
      ) : activeTab === 'waiting' ? (
        students.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Students Waiting</h2>
            <p className="text-gray-500">There are currently no students awaiting a final trial exam.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {students.map((student, index) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                {/* Student Info */}
                <div className="p-6 md:w-2/3 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <Users size={16} className="text-gray-400" />
                      <span className="font-bold text-gray-700">Instructor:</span>
                      <span className="text-gray-900">{student.assignedInstructorName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <Car size={16} className="text-gray-400" />
                      <span className="font-bold text-gray-700">Vehicle:</span>
                      <span className="text-gray-900">{student.vehicleType || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Scheduling Action */}
                <div className="p-6 md:w-1/3 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-primary"/> Select Exam Date
                    </label>
                    <input 
                      type="date"
                      value={examDates[student.id] || ''}
                      onChange={(e) => handleDateChange(student.id, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700"
                    />
                  </div>
                  
                  <button
                    onClick={() => handleSchedule(student.id)}
                    disabled={submittingId === student.id || !examDates[student.id]}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    {submittingId === student.id ? 'Scheduling...' : 'Schedule Trial Exam'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        scheduledStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Trials</h2>
            <p className="text-gray-500">There are currently no students with a scheduled trial exam.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {scheduledStudents.map((student, index) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                <div className="p-6 md:w-2/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                      <p className="text-sm font-bold text-primary flex items-center gap-1">
                        <Calendar size={14} /> Scheduled Date: {new Date(student.trialDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:w-1/3 bg-gray-50 flex flex-col justify-center gap-3">
                  <h4 className="text-sm font-bold text-gray-700 text-center mb-2">Record Result</h4>
                  <button
                    onClick={() => handlePass(student.id)}
                    disabled={submittingId === student.id}
                    className="w-full py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {submittingId === student.id ? 'Saving...' : 'Pass (Graduate)'}
                  </button>
                  <button
                    onClick={() => handleFail(student)}
                    disabled={submittingId === student.id}
                    className="w-full py-2.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {submittingId === student.id ? 'Saving...' : 'Fail (Retrain & Rs. 5000 Fee)'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
