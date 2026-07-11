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

export default function LearnerProgressDashboard({ user, past, mockResults, goTo }) {
  const totalClasses = user?.classesTotal || 14;
  const completedClasses = user?.classesCompleted || 0;
  const mockTestsDone = mockResults?.length || 0;
  const hasPassedMock = mockResults?.some(r => r.passed || r.score >= 70);

  // ── Simple 6-stage journey ──
  // Each stage derives its status from actual data — no scoring system
  const stages = [
    {
      id: 1,
      title: 'Registration',
      desc: 'Profile & documents submitted',
      icon: <UserCheck size={20} />,
      done: !!user?.is_profile_completed,
    },
    {
      id: 2,
      title: 'Medical Clearance',
      desc: user?.medicalStatus === 'approved' ? 'Approved by Admin' : (user?.medicalStatus === 'pending' ? 'Pending Approval' : 'Upload Medical Report'),
      icon: <ClipboardCheck size={20} />,
      done: user?.medicalStatus === 'approved',
    },
    {
      id: 3,
      title: 'Learner Permit',
      desc: user?.permitStatus === 'issued' ? `Issued: ${user?.learnerPermit || ''}` : 'Pending Admin Issuance',
      icon: <Check size={20} />,
      done: user?.permitStatus === 'issued',
    },
    {
      id: 4,
      title: 'Practice Sessions',
      desc: `${completedClasses} of ${totalClasses} completed`,
      icon: <Car size={20} />,
      done: completedClasses > 0 && completedClasses >= totalClasses,
    },
    {
      id: 5,
      title: 'Trial Test',
      desc: user?.trialPassed ? 'Passed Final Trial ✓' : 'Complete practice first',
      icon: <Trophy size={20} />,
      done: !!user?.trialPassed,
    },
    {
      id: 6,
      title: 'Payment Completed',
      desc: user?.outstandingFees <= 0 ? 'Fully Paid' : `Outstanding: Rs. ${user?.outstandingFees || 0}`,
      icon: <Package size={20} />,
      done: user?.outstandingFees != null && user?.outstandingFees <= 0,
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

        <div className="section-label">Payment summary</div>
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
