import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, AlertTriangle, BarChart3, FileText, ShieldAlert, Award, Bell, CreditCard, MessageCircle } from 'lucide-react';
import { ALL_SKILLS } from '../../firebase/helpers';
import StudentIdCard from '../../components/StudentIdCard';
import './StudentProfile.css';

function getSkillStatus(count, total) {
  if (total === 0) return { label: 'Not learned', icon: '❌', cls: 'not-learned' };
  const pct = count / total;
  if (pct >= 0.7) return { label: 'Learned', icon: '✔', cls: 'learned' };
  if (pct >= 0.3) return { label: 'Improving', icon: '⚠', cls: 'improving' };
  return { label: 'Not learned', icon: '❌', cls: 'not-learned' };
}

export default function StudentProfile() {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [progressRecords, setProgressRecords] = useState([]);
  const [studentSchedules, setStudentSchedules] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activePackage, setActivePackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [assigningInstructor, setAssigningInstructor] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    // Fetch student profile
    getDoc(doc(db, 'students', id)).then(async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.skills || data.skills.length === 0) {
          const { generateSkills } = await import('../../utils/skillGenerator');
          const generated = generateSkills(data.packageId ? [data.packageId] : [], data.classesTotal || 0);
          const { updateDoc, doc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'students', id), { skills: generated });
          setStudent({ id: snap.id, ...data, skills: generated });
        } else if (data.classesTotal && data.skills.length < data.classesTotal) {
          let updatedSkills = [...data.skills];
          const extra = data.classesTotal - updatedSkills.length;
          for(let i=0; i<extra; i++) {
            updatedSkills.push({ name: `General Practice ${i+1}`, level: 0 });
          }
          const { updateDoc, doc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'students', id), { skills: updatedSkills });
          setStudent({ id: snap.id, ...data, skills: updatedSkills });
        } else {
          setStudent({ id: snap.id, ...data });
        }
      }
    });

    // Listen to session_progress for this student
    const q = query(collection(db, 'session_progress'), where('studentId', '==', id));
    const unsub = onSnapshot(q, snap => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      records.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      setProgressRecords(records);
      setLoading(false);
    }, () => setLoading(false));

    // Fetch active package for this student
    const pkgQuery = query(collection(db, 'student_packages'), where('student_id', '==', id), where('status', '==', 'active'));
    getDocs(pkgQuery).then(pkgSnap => {
      if (!pkgSnap.empty) {
        setActivePackage({ id: pkgSnap.docs[0].id, ...pkgSnap.docs[0].data() });
      }
    }).catch(err => console.error('Package fetch error', err));

    // Listen to auto-generated schedules
    const schQ = query(collection(db, 'sessions'), where('studentId', '==', id));
    const unsubSch = onSnapshot(schQ, snap => {
      const schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      schedules.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      setStudentSchedules(schedules);
    });

    // Listen to daily attendance
    const attQ = query(collection(db, 'attendance'), where('student_id', '==', id));
    const unsubAtt = onSnapshot(attQ, snap => {
      setAttendanceRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // Fetch all instructors for assignment
    const instQ = query(collection(db, 'instructors'));
    getDocs(instQ).then(snap => {
      setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(err => console.error('Error fetching instructors', err));

    return () => { unsub(); unsubSch(); unsubAtt(); };
  }, [id]);

  const handleAssignInstructor = async (instructorId) => {
    setAssigningInstructor(true);
    try {
      if (!instructorId) {
        // Remove instructor assignment
        await updateDoc(doc(db, 'students', id), {
          assignedInstructorId: null,
          assignedInstructorName: null,
          practiceStatus: 'not_started'
        });
        setStudent(s => ({ ...s, assignedInstructorId: null, assignedInstructorName: null, practiceStatus: 'not_started' }));
      } else {
        const instructor = instructors.find(i => i.id === instructorId);
        await updateDoc(doc(db, 'students', id), {
          assignedInstructorId: instructorId,
          assignedInstructorName: instructor.name,
          practiceStatus: 'assigned'
        });
        setStudent(s => ({ 
          ...s, 
          assignedInstructorId: instructorId, 
          assignedInstructorName: instructor.name,
          practiceStatus: 'assigned'
        }));
      }
    } catch (err) {
      console.error('Error assigning instructor:', err);
    } finally {
      setAssigningInstructor(false);
    }
  };

  const handleApproveFinalCompletion = async () => {
    try {
      await updateDoc(doc(db, 'students', id), {
        practiceStatus: 'approved_by_admin',
        training_completed: true
      });
      setStudent(s => ({ ...s, practiceStatus: 'approved_by_admin', training_completed: true }));
    } catch (err) {
      console.error('Error approving final completion:', err);
    }
  };

  const handleApproveDocument = async (type) => {
    try {
      const updates = {};
      if (type === 'medical') {
        updates.medical_status = 'approved';
      } else {
        updates.permit_status = 'approved';
        updates.l_permit_verified_by = currentUser?.uid || 'admin';
        updates.l_permit_verified_date = new Date().toISOString();
        updates.l_permit_completed = true;
        
        // Auto-assign instructor if not already assigned
        if (!student.assignedInstructorId && instructors.length > 0) {
          const randomInst = instructors[Math.floor(Math.random() * instructors.length)];
          updates.assignedInstructorId = randomInst.id;
          updates.assignedInstructorName = randomInst.name;
          updates.practiceStatus = 'assigned';
          alert(`L-Permit Approved! Auto-assigned to instructor: ${randomInst.name}. You can change this below if needed.`);
        }
      }
      await updateDoc(doc(db, 'students', id), updates);
      setStudent(s => ({ ...s, ...updates }));
    } catch(err) { console.error(err); }
  }

  const handleRejectDocument = async (type) => {
    try {
      const updates = {};
      if (type === 'medical') {
        updates.medical_status = 'not_started';
        updates.medical_url = null;
      } else {
        updates.permit_status = 'not_started';
        updates.permit_url = null;
      }
      await updateDoc(doc(db, 'students', id), updates);
      setStudent(s => ({ ...s, ...updates }));
    } catch(err) { console.error(err); }
  }

  const handleScheduleTrial = async () => {
    const currentOutstanding = student.outstandingFees !== undefined ? student.outstandingFees : (student.total_price || 0);
    
    if (currentOutstanding > 0) {
      alert(`Cannot schedule trial. Student has an outstanding balance of Rs. ${currentOutstanding}. Payments must be completed first.`);
      return;
    }

    if (student.practiceStatus !== 'waiting_for_trial') {
      alert("Cannot schedule trial. The instructor has not approved the student for the trial exam yet. Ensure all skills are mastered.");
      return;
    }

    const trialDate = prompt("Enter trial date (YYYY-MM-DD):");
    if (!trialDate) return;
    
    // Basic date validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trialDate)) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }
    
    try {
      await updateDoc(doc(db, 'students', id), { 
        trial_status: 'scheduled', 
        trial_date: trialDate,
        trialDate: trialDate,
        practiceStatus: 'trial_scheduled'
      });
      setStudent(s => ({ 
        ...s, 
        trial_status: 'scheduled', 
        trial_date: trialDate,
        trialDate: trialDate,
        practiceStatus: 'trial_scheduled'
      }));
    } catch(err) { console.error(err); }
  }
  
  const handleMarkTrialPassed = async () => {
    if (!window.confirm("Mark trial as Passed?")) return;
    try {
      await updateDoc(doc(db, 'students', id), { trial_status: 'passed' });
      setStudent(s => ({ ...s, trial_status: 'passed' }));
    } catch(err) { console.error(err); }
  }

  const handleWhatsAppShare = () => {
    let phone = student.phone || '0776550369';
    // Format Sri Lankan number (replace starting 0 with 94)
    if (phone.startsWith('0')) {
      phone = '94' + phone.substring(1);
    }
    // Remove any spaces or dashes
    phone = phone.replace(/[\s-]/g, '');
    
    const message = `Hello ${student.name},%0A%0AHere is your Digital Student ID for Eranga Driving School!%0A%0A*ID No:* ${student.id}%0A*Package:* ${student.enrolledPackage || student.packageName || student.packageId || 'Standard'}%0A%0APlease keep this ID reference for your practical training and exams.`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleToggleScheduleStatus = async (scheduleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const scheduleRef = doc(db, 'sessions', scheduleId);
      
      // Update schedule status (only update status, do not clear date)
      await updateDoc(scheduleRef, { 
        status: newStatus
      });

      // Check if all schedules are now completed
      const updatedSchedules = studentSchedules.map(s => 
        s.id === scheduleId ? { ...s, status: newStatus } : s
      );
      
      const allCompleted = updatedSchedules.length > 0 && updatedSchedules.every(s => s.status === 'completed');
      
      if (allCompleted && student.training_completed !== true) {
        await updateDoc(doc(db, 'students', id), { training_completed: true });
        setStudent(s => ({ ...s, training_completed: true }));
      } else if (!allCompleted && student.training_completed === true) {
        await updateDoc(doc(db, 'students', id), { training_completed: false });
        setStudent(s => ({ ...s, training_completed: false }));
      }

    } catch(err) { console.error('Error updating schedule', err); }
  }

  // ─── Computed stats ───────────────────────────
  const totalSessions = progressRecords.length;

  // Global Attendance Calculation (from attendance tracking system)
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const globalAttendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100; // Default to 100 if no records yet

  // Aggregate skills
  const skillCounts = {};
  const presentRecords = progressRecords.filter(r => r.attendance === 'present');
  presentRecords.forEach(r => {
    if (r.skills && typeof r.skills === 'object') {
      Object.entries(r.skills).forEach(([skill, practiced]) => {
        if (!skillCounts[skill]) skillCounts[skill] = 0;
        if (practiced) skillCounts[skill]++;
      });
    }
  });

  // Performance breakdown
  const perfCounts = { Good: 0, Average: 0, 'Needs Improvement': 0 };
  presentRecords.forEach(r => {
    if (r.performance && perfCounts[r.performance] !== undefined) {
      perfCounts[r.performance]++;
    }
  });

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <p>Loading student profile…</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="sp-loading">
        <p>Student not found.</p>
        <button onClick={() => navigate('/admin/students')} className="sp-back-btn">
          <ArrowLeft size={18} /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="sp-container">
      {/* Header */}
      <div className="sp-header">
        <button onClick={() => navigate('/admin/students')} className="sp-back-btn">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="sp-header-info">
          <div className="sp-avatar">
            {String(student.name || '').charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 flex justify-between items-start">
            <div>
              <h1 className="sp-name">{student.name || 'Unknown Student'}</h1>
              <p className="sp-meta">{student.email} &middot; {student.phone || 'No phone'} &middot; NIC: {student.nic || 'N/A'}</p>
              <span className={`sp-status-badge sp-status-${String(student.status || 'pending').toLowerCase().replace(/_/g, '-')}`}>
                {student.status || 'Pending'}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowIdCard(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition-colors text-sm shadow-sm"
              >
                <CreditCard size={16} /> View ID
              </button>
              <button 
                onClick={() => window.location.href = '/admin/notifications'}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors text-sm shadow-sm"
              >
                <Bell size={16} /> Notify
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Package Info */}
      {activePackage && (
        <div className="sp-package-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="font-bold text-gray-900 mb-2">Enrolled Package: {activePackage.name || 'Unnamed Package'}</h2>
          <p className="text-sm text-gray-600 mb-2">Category: {activePackage.category_id || 'N/A'}</p>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(activePackage.included_vehicles) && activePackage.included_vehicles.map(v => (
              <span key={v} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{v}</span>
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions Panel */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Medical Document */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="text-blue-500" size={20} />
            <h3 className="font-bold text-gray-900">Medical Certificate</h3>
          </div>
          {student.medical_status === 'approved' ? (
             <span className="text-green-600 font-bold text-sm">✅ Approved</span>
          ) : student.medical_status === 'submitted' ? (
            <div>
              <p className="text-xs text-yellow-600 font-bold mb-2">Awaiting Approval</p>
              <div className="flex gap-2 items-center">
                {student.medical_url !== 'pending-upload' ? (
                  <a href={student.medical_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">View</a>
                ) : (
                  <span className="text-gray-500 text-xs italic">Mock Upload</span>
                )}
                <button onClick={() => handleApproveDocument('medical')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">Approve</button>
                <button onClick={() => handleRejectDocument('medical')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm font-medium">Not Uploaded</span>
          )}
        </div>

        {/* L Permit Document */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="text-purple-500" size={20} />
            <h3 className="font-bold text-gray-900">L Permit</h3>
          </div>
          {student.permit_status === 'approved' ? (
             <span className="text-green-600 font-bold text-sm">✅ Approved</span>
          ) : student.permit_status === 'uploaded' ? (
            <div>
              <p className="text-xs text-yellow-600 font-bold mb-2">Awaiting Approval</p>
              <div className="flex gap-2 items-center">
                {student.permit_url !== 'pending-upload' ? (
                  <a href={student.permit_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">View</a>
                ) : (
                  <span className="text-gray-500 text-xs italic">Mock Upload</span>
                )}
                <button onClick={() => handleApproveDocument('permit')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">Approve</button>
                <button onClick={() => handleRejectDocument('permit')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm font-medium">Not Uploaded</span>
          )}
        </div>

        {/* Trial Management */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
          {globalAttendancePct < 80 && totalAttendance > 0 && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
              Low Attendance
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <Award className="text-orange-500" size={20} />
            <h3 className="font-bold text-gray-900">Trial Exam</h3>
          </div>
          {student.trial_status === 'completed' ? (
            <span className="text-green-600 font-bold text-sm">✅ Passed</span>
          ) : student.trial_status === 'scheduled' ? (
            <div>
              <p className="text-xs text-blue-600 font-bold mb-2">Scheduled: {student.trial_date}</p>
              <button onClick={handleMarkTrialPassed} className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">Mark Passed</button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2">Attendance: <span className={`font-bold ${globalAttendancePct < 80 ? 'text-red-500' : 'text-green-500'}`}>{globalAttendancePct}%</span></p>
              <button 
                onClick={handleScheduleTrial} 
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-colors ${globalAttendancePct < 80 && totalAttendance > 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
              >
                Schedule Trial
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructor Assignment */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <User className="text-blue-500" size={24} /> Instructor Assignment
          </h3>
          {student.assignedInstructorId && (
            <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">Assigned</span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <p className="text-sm text-gray-500 mb-2">Assign an instructor to manage this student's practical training schedule.</p>
            {student.assignedInstructorId ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-bold">Current Instructor</div>
                  <div className="text-gray-900 font-bold text-lg">{student.assignedInstructorName || 'Unknown Instructor'}</div>
                </div>
                <button 
                  onClick={() => handleAssignInstructor(null)} 
                  className="text-red-500 text-sm font-bold hover:underline"
                  disabled={assigningInstructor}
                >
                  Remove
                </button>
              </div>
            ) : (
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
                onChange={(e) => handleAssignInstructor(e.target.value)}
                value={student.assignedInstructorId || ''}
                disabled={assigningInstructor}
              >
                <option value="">-- Select Instructor --</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone})</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Training Schedule Checklist */}
      {studentSchedules && studentSchedules.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <CheckCircle className="text-green-500" size={24} /> Training Schedule Progress
            </h3>
            {student.training_completed && <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs">All Completed!</span>}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[...studentSchedules]
              .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
              .map((session, index) => (
              <div 
                key={session.id} 
                className={`flex items-center gap-3 p-3 border rounded-xl transition-all cursor-pointer ${session.status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                onClick={() => handleToggleScheduleStatus(session.id, session.status)}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 ${session.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent'}`}>
                  {session.status === 'completed' && <CheckCircle size={16} />}
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-sm ${session.status === 'completed' ? 'text-green-800' : 'text-gray-900'}`}>Class {index + 1}: {session.notes || `Driving Session - ${session.vehicle || 'Any'}`}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{session.status === 'completed' ? `Completed` : 'Pending'} {session.date ? `• ${session.date} (${session.timeSlot || session.time || ''})` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Completion Approval */}
      {student.practiceStatus === 'completed_by_instructor' && (
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-yellow-800 text-lg flex items-center gap-2">
                <Award className="text-yellow-600" size={24} /> Instructor Marked Training Complete
              </h3>
              <p className="text-sm text-yellow-700 mt-1">All practice sessions are complete. Approve to finalize this student's training.</p>
            </div>
            <button 
              onClick={handleApproveFinalCompletion}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              ✅ Approve Final Completion
            </button>
          </div>
        </div>
      )}
      {student.practiceStatus === 'approved_by_admin' && (
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200 shadow-sm mb-8">
          <h3 className="font-black text-green-800 text-lg flex items-center gap-2">
            <Award className="text-green-600" size={24} /> Training Approved ✅
          </h3>
          <p className="text-sm text-green-700 mt-1">This student's practical training has been fully approved by Admin.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-icon blue"><Calendar size={22} /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{totalSessions}</span>
            <span className="sp-stat-label">Total Sessions</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon green"><CheckCircle size={22} /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{presentCount}</span>
            <span className="sp-stat-label">Present</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon red"><XCircle size={22} /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{absentCount}</span>
            <span className="sp-stat-label">Absent</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon orange"><BarChart3 size={22} /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{globalAttendancePct}%</span>
            <span className="sp-stat-label">Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      {totalSessions > 0 && (
        <div className="sp-section">
          <h2 className="sp-section-title"><BarChart3 size={20} /> Performance Breakdown</h2>
          <div className="sp-perf-grid">
            {Object.entries(perfCounts).map(([label, count]) => (
              <div key={label} className={`sp-perf-card sp-perf-${label.toLowerCase().replace(/\\s+/g, '-')}`}>
                <span className="sp-perf-count">{count}</span>
                <span className="sp-perf-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Progress */}
      <div className="sp-section">
        <h2 className="sp-section-title"><CheckCircle size={20} /> Skill Progress</h2>
        {!student?.skills || student.skills.length === 0 ? (
          <p className="sp-empty-text">No skill curriculum generated. (Student may have registered before dynamic skills were introduced).</p>
        ) : (
          <div className="sp-skills-grid">
            {student.skills.map((skill, index) => {
              const isMastered = skill.level === 2;
              const isStarted = skill.level === 1;
              const statusCls = isMastered ? 'mastered' : isStarted ? 'started' : 'not-started';
              const statusLabel = isMastered ? 'Mastered' : isStarted ? 'In Progress' : 'Not Started';
              const statusIcon = isMastered ? '✅' : isStarted ? '▶️' : '🔒';
              const pct = isMastered ? 100 : isStarted ? 50 : 0;
              
              return (
                <div key={index} className={`sp-skill-card ${statusCls}`}>
                  <div className="sp-skill-header">
                    <span className="sp-skill-name">{skill.name}</span>
                    <span className={`sp-skill-badge ${statusCls}`}>{statusIcon} {statusLabel}</span>
                  </div>
                  <div className="sp-skill-bar-track">
                    <div className="sp-skill-bar-fill" style={{ width: `${pct}%`, background: isMastered ? '#22c55e' : isStarted ? '#3b82f6' : '#e5e7eb' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session History */}
      <div className="sp-section">
        <h2 className="sp-section-title"><Calendar size={20} /> Session History</h2>
        {progressRecords.length === 0 ? (
          <p className="sp-empty-text">No sessions recorded yet.</p>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Skills Practiced</th>
                  <th>Performance</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {progressRecords.map(r => {
                  const practicedSkills = r.skills && typeof r.skills === 'object'
                    ? Object.entries(r.skills).filter(([, v]) => v).map(([k]) => k)
                    : [];
                  return (
                    <tr key={r.id}>
                      <td className="sp-td-date">{r.date || '—'}</td>
                      <td>
                        <span className={`sp-att-badge ${r.attendance === 'present' ? 'present' : 'absent'}`}>
                          {r.attendance === 'present' ? '✅ Present' : '❌ Absent'}
                        </span>
                      </td>
                      <td>
                        {practicedSkills.length > 0 ? (
                          <div className="sp-skill-tags">
                            {practicedSkills.map(s => (
                              <span key={s} className="sp-skill-tag">{s}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="sp-no-data">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`sp-perf-badge sp-perf-${String(r.performance || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {r.performance || '—'}
                        </span>
                      </td>
                      <td className="sp-td-notes">{r.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled Classes */}
      <div className="sp-section">
        <h2 className="sp-section-title"><Calendar size={20} /> Scheduled Classes</h2>
        {studentSchedules.length === 0 ? (
          <p className="sp-empty-text">No schedule generated for this student yet.</p>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Label</th>
                  <th>Vehicle Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentSchedules.map(sch => (
                  <tr key={sch.id}>
                    <td className="sp-td-date">{sch.date || '—'}</td>
                    <td>{sch.timeLabel || sch.timeSlotId || '—'}</td>
                    <td>
                      <span className="sp-skill-tag">{sch.vehicleType}</span>
                    </td>
                    <td>
                      <span className={`sp-att-badge ${sch.status === 'scheduled' ? 'present' : 'absent'}`} style={{background: sch.status === 'scheduled' ? '#e7eeff' : '#dee2e6', color: sch.status === 'scheduled' ? '#0B2545' : '#505f76', border: 'none'}}>
                        {sch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-md w-full flex flex-col items-center">
            <button 
              onClick={() => setShowIdCard(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <h3 className="font-bold text-gray-900 mb-6 w-full text-left border-b pb-2">Student Digital ID</h3>
            
            <StudentIdCard student={student} />
            
            <div className="mt-6 w-full flex flex-col gap-3">
              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleWhatsAppShare}
                  className="flex-1 py-3 bg-[#25D366] text-white font-bold rounded-xl shadow-lg hover:bg-[#128C7E] transition-colors flex justify-center items-center gap-2"
                >
                  <MessageCircle size={20} /> Share
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors flex justify-center items-center gap-2"
                >
                  Print ID
                </button>
              </div>
              <button 
                onClick={() => setShowIdCard(false)}
                className="w-full py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors flex justify-center items-center gap-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
