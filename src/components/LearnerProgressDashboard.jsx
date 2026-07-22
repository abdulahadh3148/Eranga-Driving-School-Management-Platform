import React from 'react';
import { 
  UserCheck, 
  Package, 
  CalendarCheck, 
  Car, 
  ClipboardCheck, 
  Trophy,
  Check,
  CalendarPlus 
} from 'lucide-react';
import './LearnerProgressDashboard.css';

export default function LearnerProgressDashboard({ user, past, mockResults, goTo, userProfile }) {
  const totalClasses = user?.classesTotal || 14;
  const completedClasses = user?.classesCompleted || 0;
  const mockTestsDone = mockResults?.length || 0;
  const hasPassedMock = mockResults?.some(r => r.passed || r.score >= 70);

  const medicalApproved = userProfile?.medical_status === 'approved';
  const lPermitApproved = userProfile?.l_permit_status === 'approved' || userProfile?.permit_status === 'approved';

  // ── Practice-to-Test Roadmap ──
  const stages = [
    {
      id: 1,
      title: 'Learner Permit',
      desc: lPermitApproved ? `Verified by Admin` : 'Pending RMV Exam',
      icon: <Check size={20} />,
      done: lPermitApproved,
    },
    {
      id: 2,
      title: 'Beginner Lessons',
      desc: completedClasses >= 3 ? 'Completed' : 'Basic car control & safety',
      icon: <Car size={20} />,
      done: completedClasses >= 3,
    },
    {
      id: 3,
      title: 'Intermediate Lessons',
      desc: completedClasses >= 8 ? 'Completed' : 'Traffic, turning, parking',
      icon: <Car size={20} />,
      done: completedClasses >= 8,
    },
    {
      id: 4,
      title: 'Advanced Practice',
      desc: completedClasses >= totalClasses ? 'Completed' : 'Mock test routes',
      icon: <Trophy size={20} />,
      done: completedClasses >= totalClasses,
    },
    {
      id: 5,
      title: 'Readiness Review',
      desc: userProfile?.testReady ? 'Instructor Approved' : 'Pending instructor evaluation',
      icon: <ClipboardCheck size={20} />,
      done: !!userProfile?.testReady,
    },
    {
      id: 6,
      title: 'Road Test',
      desc: user?.trialPassed ? 'Passed Final Trial ✓' : (userProfile?.testReady ? 'Book your test!' : 'Locked'),
      icon: <UserCheck size={20} />,
      done: !!user?.trialPassed,
    },
  ];

  // Find the first incomplete stage to mark as "active"
  const firstIncompleteIdx = stages.findIndex(s => !s.done);

  const getState = (stage, idx) => {
    if (stage.done) return 'done';
    if (idx === firstIncompleteIdx) return 'active';
    return 'locked';
  };

  const completedCount = stages.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';

  return (
    <div className="learner-dash-wrapper">
      <div className="dash">
        <h2 className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
          Learner progress dashboard
        </h2>

        <div className="header">
          <div className="avatar">{initials}</div>
          <div>
            <div className="learner-name">{user?.name || 'Student Name'}</div>
            <div className="learner-sub">ID: {user?.id || 'Pending'} &nbsp;·&nbsp; Package: {user?.enrolledPackage || 'None'}</div>
          </div>
        </div>

        <div className="section-label">Overall progress</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {completedCount} of {stages.length} stages completed
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#185FA5' }}>{progressPercent}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-num">{completedClasses}</div>
            <div className="stat-lbl">Practice sessions</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{completedClasses}h</div>
            <div className="stat-lbl">Drive time</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{mockTestsDone}</div>
            <div className="stat-lbl">Mock tests</div>
          </div>
        </div>

        <div className="section-label">Your journey</div>
        <div className="steps-grid">
          {stages.map((stage, idx) => {
            const state = getState(stage, idx);
            return (
              <div key={stage.id} className={`step-card ${state}`}>
                <div className={`step-icon ${state}`}>
                  {stage.icon}
                </div>
                <div className="step-info">
                  <div className="step-title">{stage.title}</div>
                  <div className="step-desc">{stage.desc}</div>
                </div>
                <span className={`step-badge badge-${state}`}>
                  {state === 'done' ? (
                    <><Check size={12} strokeWidth={3} /> Done</>
                  ) : state === 'active' ? (
                    'In progress'
                  ) : (
                    'Upcoming'
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {userProfile?.skills && userProfile.skills.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: '24px' }}>Skill Checklist (Curriculum)</div>
            <div className="steps-grid" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
              {userProfile.skills.map((skill, index) => {
                const isMastered = skill.level === 2;
                const isStarted = skill.level === 1;
                const stateCls = isMastered ? 'done' : isStarted ? 'active' : 'locked';
                
                return (
                  <div key={index} className={`step-card ${stateCls}`} style={{ padding: '12px 16px', minHeight: 'auto' }}>
                    <div className="step-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="step-title" style={{ fontSize: '14px', marginBottom: 0 }}>{skill.name}</div>
                      <span className={`step-badge badge-${stateCls}`} style={{ marginTop: 0 }}>
                        {isMastered ? '✅ Mastered' : isStarted ? '▶️ In Progress' : '🔒 Not Started'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="section-label" style={{ marginTop: '24px' }}>Payment summary</div>
        <div className="payment-card">
          <div className="payment-row">
            <span className="pay-label">Total Course Fee</span>
            <span className="pay-amount">Rs. {Number(user?.packagePrice || 0).toLocaleString()}</span>
            <span className="pay-status"></span>
          </div>
          <div className="payment-row">
            <span className="pay-label">Amount Paid</span>
            <span className="pay-amount" style={{ color: '#0F6E56' }}>
              Rs. {Number((user?.packagePrice || 0) - (user?.outstandingFees || 0)).toLocaleString()}
            </span>
            <span className="pay-status paid">Paid</span>
          </div>
          <div className="payment-row">
            <span className="pay-label">Outstanding Balance</span>
            <span className="pay-amount" style={{ color: user?.outstandingFees > 0 ? '#854F0B' : '#505f76' }}>
              Rs. {Number(user?.outstandingFees || 0).toLocaleString()}
            </span>
            <span className={`pay-status ${user?.outstandingFees > 0 ? 'pending' : 'paid'}`}>
              {user?.outstandingFees > 0 ? 'Due' : 'Settled'}
            </span>
          </div>
        </div>

        <button className="cta-btn" onClick={() => goTo('/student/book')}>
          <CalendarPlus size={18} />
          Book next driving session ↗
        </button>
      </div>
    </div>
  );
}
