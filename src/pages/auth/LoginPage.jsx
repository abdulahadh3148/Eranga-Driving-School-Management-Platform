import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { currentUser, userProfile, loading: authLoading, loginMockUser } = useAuth();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setSuccessMessage('Account created successfully! Please login below.');
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      // Clear location state after reading
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    // Auto-redirect if already logged in and profile is fully loaded
    if (!authLoading && currentUser && userProfile) {
      if (userProfile.role === 'student') navigate('/student');
      else if (userProfile.role === 'instructor') navigate('/instructor');
      else if (userProfile.role === 'admin') navigate('/admin');
    }
  }, [authLoading, currentUser, userProfile, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // ─── Admin: Hardcoded mock login ───
      const ADMIN_EMAIL = 'admin@drivingschool.com';
      const ADMIN_PASSWORD = 'Admin@123';

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        if (role !== 'admin') {
          setError('Admin login must be selected in the role tabs.');
          setLoading(false);
          return;
        }
        loginMockUser({
          uid: 'admin-mock-uid',
          name: 'School Administrator',
          email: ADMIN_EMAIL,
          role: 'admin',
          status: 'approved',
          createdAt: new Date().toISOString()
        });
        navigate('/admin');
        setLoading(false);
        return;
      }

      // ─── Instructor / Student: Try Firestore-first mock login for seeded users ───
      // This handles users created via the admin seeder who don't have Firebase Auth accounts
      const DEFAULT_PASSWORD = 'password123';

      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('role', '==', role)
      );
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty && password === DEFAULT_PASSWORD) {
        const profile = userSnap.docs[0].data();
        const profileId = userSnap.docs[0].id;

        // Mock login for seeded users (students/instructors) with status validation
        const mockProfile = {
          uid: profile.authUid || profileId,
          id: profileId,
          name: profile.name || 'User',
          email: profile.email,
          role: profile.role,
          status: profile.status || 'approved',
          phone: profile.phone || '',
          progressLevel: profile.progressLevel || '',
          progress: profile.progress || 0,
          createdAt: profile.createdAt || new Date().toISOString()
        };

        // Enforce student approval status before allowing login
        if (mockProfile.role === 'student' && mockProfile.status !== 'approved') {
          const errMsg = mockProfile.status === 'rejected' ? 'Your account has been rejected. Contact admin.' : 'Your account is waiting for admin approval.';
          setError(errMsg);
          setLoading(false);
          return;
        }

        // Proceed with mock login
        loginMockUser(mockProfile);

        if (role === 'instructor') navigate('/instructor');
        else if (role === 'student') navigate('/student');
        else navigate('/');

        setLoading(false);
        return;
      }

      // ─── Firebase Auth login (for users created via registration form) ───
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch profile from Firestore using authUid
      const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
      const authUserSnap = await getDocs(q);

      if (!authUserSnap.empty) {
        const profile = authUserSnap.docs[0].data();
        profile.id = authUserSnap.docs[0].id;

        if (profile.role !== role) {
          setError(`This account is registered as a ${profile.role.toUpperCase()}, not a ${role.toUpperCase()}.`);
          auth.signOut();
          return;
        }

        if (profile.role === 'student') {
          if (profile.status !== 'approved') {
            const errMsg = profile.status === 'rejected' ? 'Your account has been rejected. Contact admin.' : 'Your account is waiting for admin approval.';
            setError(errMsg);
            await auth.signOut();
            return;
          }
          navigate('/student');
        } else if (profile.role === 'instructor') {
          navigate('/instructor');
        } else if (profile.role === 'admin') {
          navigate('/admin');
        }
      } else {
        setError('User profile not found in database.');
        auth.signOut();
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Hero Background Shapes */}
      <div className="login-bg-shapes">
        <div className="bg-shape-1"></div>
        <div className="bg-shape-2"></div>
      </div>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-container">
          {/* Back to Home Link */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#505f76', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'color 0.2s', ':hover': { color: '#0B2545' } }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Back to Home
            </Link>
          </div>

          {/* Logo Section */}
          <div className="login-header">
            <div style={{ backgroundColor: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(11, 37, 69, 0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>directions_car</span>
            </div>
            <h1 className="login-title">Eranga Driving School Login</h1>
            <p className="login-subtitle">Professional Excellence in Driver Education</p>
          </div>

          {/* Login Card */}
          <div className="login-card">
            {/* Role Selection Tabs */}
            <div className="login-tabs">
              <button
                className={`login-tab ${role === 'student' ? 'active' : ''}`}
                onClick={() => { setRole('student'); setError(''); }}
                disabled={loading}
              >
                Student
              </button>
              <button
                className={`login-tab ${role === 'instructor' ? 'active' : ''}`}
                onClick={() => { setRole('instructor'); setError(''); }}
                disabled={loading}
              >
                Instructor
              </button>
              <button
                className={`login-tab ${role === 'admin' ? 'active' : ''}`}
                onClick={() => { setRole('admin'); setError(''); }}
                disabled={loading}
              >
                Admin
              </button>
            </div>

            {successMessage && (
              <div className="login-success-banner" style={{
                backgroundColor: 'rgba(77, 124, 15, 0.05)',
                border: '1px solid #16a34a',
                color: '#16a34a',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="login-error-banner" style={{
                backgroundColor: 'rgba(186, 26, 26, 0.05)',
                border: '1px solid #ba1a1a',
                color: '#ba1a1a',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form Section */}
            <form className="login-form" onSubmit={handleLoginSubmit}>
              {/* Email Input */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    className="input-field"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="password-header">
                  <label className="form-label" htmlFor="password">Password</label>
                  <Link className="forgot-password" to="/contact">Forgot Password?</Link>
                </div>
                <div className="input-wrapper has-action">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    className="input-field"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    className="input-action"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="remember-me">
                <input className="remember-checkbox" id="remember" type="checkbox" disabled={loading} />
                <label className="remember-label" htmlFor="remember">Remember this device for 30 days</label>
              </div>

              {/* Submit Button */}
              <button
                className="login-submit"
                type="submit"
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Authenticating...' : 'Login to Dashboard'}
              </button>
            </form>

            {/* Footer link in card */}
            <div className="login-footer-text">
              <p>
                Don't have an account? <Link to="/register">Join the school</Link>
              </p>
            </div>

          </div>

          {/* Additional Help/Support */}
          <div className="login-support-links">
            <Link className="support-link" to="/contact">
              <span className="material-symbols-outlined">help_outline</span>
              <span>Support Center</span>
            </Link>
            <Link className="support-link" to="/about">
              <span className="material-symbols-outlined">privacy_tip</span>
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <footer className="shared-footer">
        <div className="footer-brand">Eranga Driving School</div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Eranga Driving School. All rights reserved.
        </div>
        <div className="footer-links">
          <Link to="/about">Privacy Policy</Link>
          <Link to="/about">Terms of Service</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
