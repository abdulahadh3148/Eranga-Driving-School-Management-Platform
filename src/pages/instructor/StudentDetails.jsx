import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Phone, MapPin, Award, CheckCircle, Send, Car, Calendar, Package, UserCheck, UserX, Clock } from 'lucide-react';
import './StudentDetails.css';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingReady, setMarkingReady] = useState(false);
  const [completingSessionId, setCompletingSessionId] = useState(null);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState('-1');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      setLoading(true);
      setStudent(null);
      setSessions([]);
      try {
        const docSnap = await getDoc(doc(db, 'students', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.skills || data.skills.length === 0) {
            const { generateSkills } = await import('../../utils/skillGenerator');
            const generated = generateSkills(data.packageId ? [data.packageId] : [], data.classesTotal || 0);
            await updateDoc(doc(db, 'students', id), { skills: generated });
            setStudent({ id: docSnap.id, ...data, skills: generated });
          } else if (data.classesTotal && data.skills.length < data.classesTotal) {
            let updatedSkills = [...data.skills];
            const extra = data.classesTotal - updatedSkills.length;
            for(let i=0; i<extra; i++) {
              updatedSkills.push({ name: `General Practice ${i+1}`, level: 0 });
            }
            await updateDoc(doc(db, 'students', id), { skills: updatedSkills });
            setStudent({ id: docSnap.id, ...data, skills: updatedSkills });
          } else {
            setStudent({ id: docSnap.id, ...data });
          }
        }

        // Fetch sessions for this student
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const sessionsQ = query(
          collection(db, 'sessions'), 
          where('studentId', '==', id)
        );
        const sessionsSnap = await getDocs(sessionsQ);
        
        let allSessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by date descending
        allSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(allSessions);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  const handleMarkReadyForTrial = async () => {
    setMarkingReady(true);
    try {
      await updateDoc(doc(db, 'students', id), {
        practiceStatus: 'waiting_for_trial'
      });
      setStudent(s => ({ ...s, practiceStatus: 'waiting_for_trial' }));
    } catch (err) {
      console.error('Error marking ready for trial:', err);
    } finally {
      setMarkingReady(false);
    }
  };

  const handleUpdateSkill = async (skillIndex, newLevel) => {
    if (!student || !student.skills) return;
    
    // Create a new skills array
    const updatedSkills = [...student.skills];
    updatedSkills[skillIndex] = { ...updatedSkills[skillIndex], level: newLevel };
    
    try {
      await updateDoc(doc(db, 'students', id), {
        skills: updatedSkills
      });
      setStudent(s => ({ ...s, skills: updatedSkills }));
    } catch (err) {
      console.error("Error updating skill:", err);
      alert("Failed to update skill.");
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'in_progress' } : s
      ));
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Failed to start session.');
    }
  };

  const handleCompleteSession = (sessionId) => {
    setCompletingSessionId(sessionId);
    // Find the next unmastered skill to suggest automatically
    let nextIndex = '-1';
    if (student?.skills) {
      const idx = student.skills.findIndex(s => s.level !== 2);
      if (idx !== -1) nextIndex = String(idx);
    }
    setSelectedSkillIndex(nextIndex);
    setPracticeNotes('');
    setAttendanceStatus('present');
  };

  const RECOMMENDED_FEEDBACKS = [
    "Excellent clutch control and smooth gear transitions.",
    "Very good spatial awareness and frequent mirror checks.",
    "Great progress on hill starts and reverse parking maneuvers.",
    "Needs more focus on speed control and lane discipline.",
    "Keep practicing the clutch bite point on inclines.",
    "Good response to road signs and signals today."
  ];

  const handleSubmitPractice = async () => {
    const targetSessionId = completingSessionId;
    if (!targetSessionId) {
      alert('No active session is selected to log.');
      return;
    }
    if (!practiceNotes.trim()) {
      alert('Please enter feedback/notes on what was practiced.');
      return;
    }

    try {
      const { increment, writeBatch, doc, collection } = await import('firebase/firestore');
      const batch = writeBatch(db);
      const todayStr = new Date().toISOString().split('T')[0];
      
      let loggedSession = null;

      if (targetSessionId !== 'custom_log') {
        const sessionRef = doc(db, 'sessions', targetSessionId);
        batch.update(sessionRef, {
          status: 'completed',
          attendance: attendanceStatus,
          notes: practiceNotes,
          updatedAt: new Date().toISOString()
        });

        // Find the matching session details for state update
        const match = sessions.find(s => s.id === targetSessionId);
        if (match) {
          loggedSession = { ...match, status: 'completed', attendance: attendanceStatus, notes: practiceNotes };
        }
      } else {
        // Create manual custom session
        const newSessionRef = doc(collection(db, 'sessions'));
        const customSessionData = {
          studentId: id,
          studentName: student.name,
          instructorId: student.assignedInstructorId || 'manual',
          instructorName: student.assignedInstructorName || 'Instructor',
          date: todayStr,
          time: 'Manual Custom Log',
          status: 'completed',
          attendance: attendanceStatus,
          notes: practiceNotes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        batch.set(newSessionRef, customSessionData);
        loggedSession = { id: newSessionRef.id, ...customSessionData };
      }

      // Increment completed classes count and update skills if chosen (only if present)
      const studentRef = doc(db, 'students', id);
      let updatedSkills = [...(student.skills || [])];
      
      let studentUpdates = {};
      let isLastSession = false;

      if (attendanceStatus === 'present') {
        studentUpdates.classesCompleted = increment(1);

        if (selectedSkillIndex !== '-1' && updatedSkills[Number(selectedSkillIndex)]) {
          const skillIdx = Number(selectedSkillIndex);
          updatedSkills[skillIdx] = {
            ...updatedSkills[skillIdx],
            level: 2 // Automatically mark as Mastered (Level 2)
          };
          // Auto-start the NEXT skill if it exists so the student sees their next step
          if (skillIdx + 1 < updatedSkills.length) {
            updatedSkills[skillIdx + 1] = {
              ...updatedSkills[skillIdx + 1],
              level: Math.max(updatedSkills[skillIdx + 1].level || 0, 1) // Set to In Progress (Level 1)
            };
          }
          
          studentUpdates.skills = updatedSkills;
        }
      }

      if (Object.keys(studentUpdates).length > 0) {
        batch.update(studentRef, studentUpdates);
      }

      // Log for analytics
      const progressRef = doc(collection(db, 'session_progress'));
      batch.set(progressRef, {
        sessionId: targetSessionId === 'custom_log' ? loggedSession.id : targetSessionId,
        studentId: id,
        instructorId: student.assignedInstructorId || 'manual',
        date: new Date().toISOString(),
        attendance: attendanceStatus,
        notes: practiceNotes,
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      // Update local sessions state
      if (targetSessionId !== 'custom_log') {
        setSessions(prev => prev.map(s => s.id === targetSessionId ? loggedSession : s));
      } else {
        setSessions(prev => [loggedSession, ...prev]);
      }

      // Send notification to student
      try {
        const { sendNotification } = await import('../../utils/notifications');
        await sendNotification({
          userId: id,
          title: 'Session Logged',
          message: `Feedback received: "${practiceNotes}"`,
          type: 'success',
          link: '/student'
        });
      } catch (e) {
        console.error('Failed to send notification:', e);
      }

      setStudent(prev => {
        const newCompleted = attendanceStatus === 'present' ? (prev.classesCompleted || 0) + 1 : prev.classesCompleted;
        return {
          ...prev,
          classesCompleted: newCompleted,
          skills: attendanceStatus === 'present' && selectedSkillIndex !== '-1' ? updatedSkills : prev.skills
        };
      });

      alert('Practice logged successfully!');
      setCompletingSessionId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to log practice session.');
    }
  };



  if (loading) return <div className="sd-loading">Loading student profile...</div>;
  if (!student) return <div className="sd-loading">Student not found.</div>;

  const completed = student.classesCompleted || 0;
  const total = student.classesTotal || 0;
  const isReady = total > 0 && completed >= total;
  const progressPct = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

  return (
    <div className="sd-page-wrapper">
      <div className="sd-header">
        <button onClick={() => navigate(-1)} className="sd-back-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="sd-title">Student Profile</h1>
          <p className="sd-subtitle">View details and check trial readiness</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="sd-profile-card">
        <div className="sd-avatar">
          {student.name?.charAt(0).toUpperCase() || 'S'}
        </div>
        <h2 className="sd-name">{student.name || 'Unknown'}</h2>
        <div className="sd-level">{student.packageId || 'Standard Training'}</div>

        <div className="sd-info-grid">
          <div className="sd-info-item">
            <span className="sd-info-label"><Phone size={14} /> Phone</span>
            <span className="sd-info-value">{student.phone || 'N/A'}</span>
          </div>
          <div className="sd-info-item">
            <span className="sd-info-label"><Award size={14} /> Practice Status</span>
            <span className="sd-info-value" style={{ textTransform: 'capitalize', color: '#ea580c', fontWeight: 700 }}>
              {(student.practiceStatus || 'assigned').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="sd-info-item">
            <span className="sd-info-label"><Package size={14} /> Selected Package</span>
            <span className="sd-info-value">{student.packageName || student.packageId || 'Standard Training'}</span>
          </div>
        </div>

        {student.address && (
          <div className="sd-address-row mt-4">
            <span className="sd-info-label"><MapPin size={14} /> Address</span>
            <span className="sd-info-value" style={{ fontSize: '0.875rem' }}>{student.address}</span>
          </div>
        )}
      </div>

      {/* Training Progress based on actual classes */}
      <div className="sd-section-card">
        <h3 className="sd-section-title">Practical Training Progress</h3>
        <div className="sd-stats-row">
          <div className="sd-stat-box" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <div className="sd-stat-num" style={{ color: '#166534' }}>{completed}</div>
            <div className="sd-stat-label">Classes Completed</div>
          </div>
          <div className="sd-stat-box" style={{ borderColor: '#fef08a', background: '#fefce8' }}>
            <div className="sd-stat-num" style={{ color: '#854d0e' }}>{total}</div>
            <div className="sd-stat-label">Total Assigned</div>
          </div>
        </div>

        <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '12px', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #ea580c)', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 700, marginTop: '0.5rem', textAlign: 'right' }}>
          {progressPct}% COMPLETE
        </div>
      </div>

      {/* Sessions List */}
      <div className="sd-section-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="sd-section-title" style={{ margin: 0 }}>Scheduled Sessions</h3>
          <button 
            onClick={() => {
              setCompletingSessionId('custom_log');
              let nextIndex = '-1';
              if (student?.skills) {
                const idx = student.skills.findIndex(s => s.level !== 2);
                if (idx !== -1) nextIndex = String(idx);
              }
              setSelectedSkillIndex(nextIndex);
              setPracticeNotes('');
              setAttendanceStatus('present');
            }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #ea580c',
              background: 'transparent', color: '#ea580c', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '0.875rem', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.background = '#ea580c'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ea580c'; }}
          >
            + Log Custom Practice
          </button>
        </div>
        {sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {(showAllSessions ? sessions : sessions.slice(0, 1)).map(session => {
              const status = session.status?.toLowerCase() || 'scheduled';
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in_progress';

              return (
                <div key={session.id} style={{ 
                  border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', 
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  background: isCompleted ? '#f0fdf4' : isInProgress ? '#eff6ff' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      <Calendar size={18} color="#ea580c" />
                      {session.date}
                    </div>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: isCompleted ? '#dcfce7' : isInProgress ? '#dbeafe' : '#fef3c7',
                      color: isCompleted ? '#166534' : isInProgress ? '#1e40af' : '#92400e'
                    }}>
                      {isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : 'SCHEDULED'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                    {session.timeSlot || session.time || 'Unscheduled'}
                  </div>

                  {!isCompleted && !isInProgress && (
                    <button 
                      onClick={() => handleStartSession(session.id)}
                      style={{
                        marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                        background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      <CheckCircle size={18} /> Start Session
                    </button>
                  )}

                  {isInProgress && (
                    <button 
                      onClick={() => handleCompleteSession(session.id)}
                      style={{
                        marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                        background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      <CheckCircle size={18} /> Finish & Log Practice
                    </button>
                  )}
                </div>
              );
            })}
            
            {sessions.length > 1 && (
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                style={{
                  marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                  border: '1px dashed #cbd5e1', background: 'transparent', color: '#64748b',
                  fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem'
                }}
                onMouseEnter={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#94a3b8'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#cbd5e1'; }}
              >
                {showAllSessions ? 'View Less' : `View All Previous Sessions (${sessions.length - 1} more)`}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No sessions scheduled yet.
          </div>
        )}
      </div>

      {/* Dynamic Skill Checklist */}
      {student.skills && student.skills.length > 0 && (
        <div className="sd-section-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="sd-section-title">Skill Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {student.skills.map((skill, index) => {
              const isMastered = skill.level === 2;
              const isStarted = skill.level === 1;
              return (
                <div key={index} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: '#f9fafb', border: `1px solid ${isMastered ? '#86efac' : '#e5e7eb'}`, 
                  borderRadius: '0.5rem' 
                }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>
                    {skill.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleUpdateSkill(index, 0)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', background: skill.level === 0 ? '#e5e7eb' : 'white', cursor: 'pointer', fontWeight: 600 }}
                    >Not Started</button>
                    <button 
                      onClick={() => handleUpdateSkill(index, 1)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.25rem', border: '1px solid #bfdbfe', background: isStarted ? '#dbeafe' : 'white', color: isStarted ? '#1d4ed8' : '#374151', cursor: 'pointer', fontWeight: 600 }}
                    >Started</button>
                    <button 
                      onClick={() => handleUpdateSkill(index, 2)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.25rem', border: '1px solid #86efac', background: isMastered ? '#dcfce7' : 'white', color: isMastered ? '#15803d' : '#374151', cursor: 'pointer', fontWeight: 600 }}
                    >Mastered</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Readiness Action */}
      {isReady && student.practiceStatus !== 'waiting_for_trial' && student.practiceStatus !== 'trial_scheduled' && (
        <button
          onClick={() => {
            const currentOutstanding = student.outstandingFees !== undefined ? student.outstandingFees : (student.total_price || 0);
            if (currentOutstanding > 0) {
              alert(`Cannot approve. Student has an outstanding balance of Rs. ${currentOutstanding}. Payments must be completed first.`);
              return;
            }
            if (student.permit_status !== 'approved' && student.l_permit_status !== 'approved') {
              alert(`Cannot approve. Student's L Permit is not yet verified.`);
              return;
            }
            handleMarkReadyForTrial();
          }}
          disabled={markingReady}
          style={{
            width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none',
            background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white',
            fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            marginBottom: '1rem', transition: 'all 0.2s ease',
            opacity: markingReady ? 0.7 : 1,
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
          }}
        >
          <CheckCircle size={20} /> {markingReady ? 'Processing...' : 'Approve Student for Trial Exam'}
        </button>
      )}

      {student.practiceStatus === 'waiting_for_trial' && (
        <div style={{
          padding: '1rem 1.5rem', background: '#fef9c3', border: '2px dashed #fde047',
          borderRadius: '0.75rem', textAlign: 'center', fontWeight: 700, color: '#854d0e',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
        }}>
          <Clock size={20} /> Student is Waiting for Admin to Schedule Trial Exam
        </div>
      )}

      {student.practiceStatus === 'trial_scheduled' && (
        <div style={{
          padding: '1rem 1.5rem', background: '#f0fdf4', border: '2px solid #bbf7d0',
          borderRadius: '0.75rem', textAlign: 'center', fontWeight: 700, color: '#166534',
          marginBottom: '1rem'
        }}>
          ✅ Trial Exam Scheduled for: {student.trialDate || 'Date Not Set'}
        </div>
      )}

      {/* Call Button */}
      {student.phone && (
        <a href={`tel:${student.phone}`} className="sd-call-btn" style={{ marginTop: '1rem' }}>
          <Phone size={20} /> Call {student.name?.split(' ')[0] || 'Student'}
        </a>
      )}

      {/* Log Practice Modal */}
      {completingSessionId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={() => setCompletingSessionId(null)}>
          <div style={{
            background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '400px',
            overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#10b981" />
                Log Practice
              </h3>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  Student Attendance:
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus('present')}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid',
                      borderColor: attendanceStatus === 'present' ? '#10b981' : '#e2e8f0',
                      background: attendanceStatus === 'present' ? '#f0fdf4' : '#fff',
                      color: attendanceStatus === 'present' ? '#166534' : '#64748b',
                      fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s', cursor: 'pointer'
                    }}
                  >
                    <UserCheck size={18} /> Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus('absent')}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid',
                      borderColor: attendanceStatus === 'absent' ? '#ef4444' : '#e2e8f0',
                      background: attendanceStatus === 'absent' ? '#fef2f2' : '#fff',
                      color: attendanceStatus === 'absent' ? '#991b1b' : '#64748b',
                      fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s', cursor: 'pointer'
                    }}
                  >
                    <UserX size={18} /> Absent
                  </button>
                </div>
              </div>

              {attendanceStatus === 'present' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Select Curriculum Skill Practiced/Completed:
                  </label>
                  <select
                    value={selectedSkillIndex}
                    onChange={(e) => setSelectedSkillIndex(e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.95rem',
                      background: '#ffffff', cursor: 'pointer', color: '#1e293b'
                    }}
                  >
                    <option value="-1">None / General Practice (No specific skill)</option>
                    {(student?.skills || []).map((skill, idx) => (
                      <option key={idx} value={idx}>
                        {skill.name} {skill.level === 2 ? '✅ (Mastered)' : skill.level === 1 ? '🚗 (Started)' : '⚪ (Not Started)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  What was practiced today? / Feedback:
                </label>
                <textarea
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  placeholder="e.g. Reverse parking, hill start..."
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical',
                    fontFamily: 'inherit', fontSize: '0.95rem'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  💡 Click to Auto-Fill Recommended Comments:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '110px', overflowY: 'auto', padding: '2px' }}>
                  {RECOMMENDED_FEEDBACKS.map((feedback, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPracticeNotes(feedback)}
                      style={{
                        background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '9999px',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#334155',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                        fontWeight: 500
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                    >
                      {feedback}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setCompletingSessionId(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitPractice}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
