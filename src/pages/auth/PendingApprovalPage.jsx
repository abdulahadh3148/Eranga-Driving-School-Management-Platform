import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Reusing login styles for the layout

const PendingApprovalPage = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = () => {
    // A full page reload will re-trigger the AuthContext fetch of the user profile
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="login-page-wrapper">
      {/* Hero Background Shapes */}
      <div className="login-bg-shapes">
        <div className="bg-shape-1"></div>
        <div className="bg-shape-2"></div>
      </div>

      <main className="login-main">
        <div className="login-container">
          {/* Logo Section */}
          <div className="login-header">
            <div style={{ backgroundColor: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(11, 37, 69, 0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pending_actions</span>
            </div>
            <h1 className="login-title">Account Under Review</h1>
            <p className="login-subtitle">Your registration is complete.</p>
          </div>

          {/* Card */}
          <div className="login-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#ca8a04'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>hourglass_empty</span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              Welcome, {userProfile?.name || 'Student'}!
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '32px', lineHeight: '1.6' }}>
              Your account has been created successfully, but it requires administrator approval before you can access the dashboard. We will notify you once your account is active.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleRefresh}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                <span className="material-symbols-outlined">refresh</span>
                Check Status
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#4b5563',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </div>

          <div className="login-support-links">
            <a className="support-link" href="/contact">
              <span className="material-symbols-outlined">help_outline</span>
              <span>Support Center</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingApprovalPage;
