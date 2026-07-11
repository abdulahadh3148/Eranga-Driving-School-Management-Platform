import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, AlertTriangle, BarChart3, FileText, ShieldAlert, Award, Bell } from 'lucide-react';
import { ALL_SKILLS } from '../../firebase/helpers';
import './StudentProfile.css';

function getSkillStatus(count, total) {
  if (total === 0) return { label: 'Not learned', icon: '❌', cls: 'not-learned' };
  const pct = count / total;
  if (pct >= 0.7) return { label: 'Learned', icon: '✔', cls: 'learned' };
  if (pct >= 0.3) return { label: 'Improving', icon: '⚠', cls: 'improving' };
  return { label: 'Not learned', icon: '❌', cls: 'not-learned' };
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [progressRecords, setProgressRecords] = useState([]);
  const [studentSchedules, setStudentSchedules] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activePackage, setActivePackage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch student profile
    getDoc(doc(db, 'users', id)).then(snap => {
      if (snap.exists()) setStudent({ id: snap.id, ...snap.data() });
    });

    // Listen to session_progress for this student
    const q = query(collection(db, 'session_progress'), where('studentId', '==', id));
    const unsub = onSnapshot(q, snap => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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
    const schQ = query(collection(db, 'student_schedules'), where('studentId', '==', id));
    const unsubSch = onSnapshot(schQ, snap => {
      const schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      schedules.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      setStudentSchedules(schedules);
    });

    // Listen to daily attendance
    const attQ = query(collection(db, 'attendance'), where('student_id', '==', id));
    const unsubAtt = onSnapshot(attQ, snap => {
      setAttendanceRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub(); unsubSch(); unsubAtt(); };
  }, [id]);

  const handleApproveDocument = async (type) => {
    try {
      const field = type === 'medical' ? 'medical_status' : 'permit_status';
      await updateDoc(doc(db, 'users', id), { [field]: 'approved' });
      setStudent(s => ({ ...s, [field]: 'approved' }));
    } catch(err) { console.error(err); }
  }

  const handleRejectDocument = async (type) => {
    try {
      const statusField = type === 'medical' ? 'medical_status' : 'permit_status';
      const urlField = type === 'medical' ? 'medical_url' : 'permit_url';
      await updateDoc(doc(db, 'users', id), { [statusField]: 'not_started', [urlField]: null });
      setStudent(s => ({ ...s, [statusField]: 'not_started', [urlField]: null }));
    } catch(err) { console.error(err); }
  }

  const handleScheduleTrial = async () => {
    if (globalAttendancePct < 80 && attendanceRecords.length > 0) {
      alert("Cannot schedule trial. Minimum 80% attendance is required.");
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
      await updateDoc(doc(db, 'users', id), { trial_status: 'scheduled', trial_date: trialDate });
      setStudent(s => ({ ...s, trial_status: 'scheduled', trial_date: trialDate }));
    } catch(err) { console.error(err); }
  }
  
  const handleMarkTrialPassed = async () => {
    if (!window.confirm("Mark trial as Passed?")) return;
    try {
      await updateDoc(doc(db, 'users', id), { trial_status: 'completed' });
      setStudent(s => ({ ...s, trial_status: 'completed' }));
    } catch(err) { console.error(err); }
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
            {student.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 flex justify-between items-start">
            <div>
              <h1 className="sp-name">{student.name || 'Unknown Student'}</h1>
              <p className="sp-meta">{student.email} &middot; {student.phone || 'No phone'} &middot; NIC: {student.nic || 'N/A'}</p>
              <span className={`sp-status-badge sp-status-${(student.status || 'pending').toLowerCase().replace(/_/g, '-')}`}>
                {student.status || 'Pending'}
              </span>
            </div>
            <button 
              onClick={() => window.location.href = '/admin/notifications'}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors text-sm"
            >
              <Bell size={16} /> Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Package Info */}
      {activePackage && (
        <div className="sp-package-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="font-bold text-gray-900 mb-2">Enrolled Package: {activePackage.name || 'Unnamed Package'}</h2>
          <p className="text-sm text-gray-600 mb-2">Category: {activePackage.category_id || 'N/A'}</p>
          <div className="flex flex-wrap gap-2">
            {activePackage.included_vehicles && activePackage.included_vehicles.map(v => (
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
          ) : student.medical_status === 'uploaded' ? (
            <div>
              <p className="text-xs text-yellow-600 font-bold mb-2">Awaiting Approval</p>
              <div className="flex gap-2">
                <a href={student.medical_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">View</a>
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
              <div className="flex gap-2">
                <a href={student.permit_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">View</a>
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
        {presentRecords.length === 0 ? (
          <p className="sp-empty-text">No session data yet. Skills will appear once the instructor completes a session.</p>
        ) : (
          <div className="sp-skills-grid">
            {ALL_SKILLS.map(skill => {
              const count = skillCounts[skill] || 0;
              const total = presentRecords.length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const status = getSkillStatus(count, total);
              return (
                <div key={skill} className={`sp-skill-card ${status.cls}`}>
                  <div className="sp-skill-header">
                    <span className="sp-skill-name">{skill}</span>
                    <span className={`sp-skill-badge ${status.cls}`}>{status.icon} {status.label}</span>
                  </div>
                  <div className="sp-skill-bar-track">
                    <div className="sp-skill-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="sp-skill-detail">{count}/{total} sessions • {pct}%</span>
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
                        <span className={`sp-perf-badge sp-perf-${(r.performance || '').toLowerCase().replace(/\\s+/g, '-')}`}>
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

      {/* Auto-Generated Schedule */}
      <div className="sp-section">
        <h2 className="sp-section-title"><Calendar size={20} /> Generated Schedule</h2>
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
    </div>
  );
}
