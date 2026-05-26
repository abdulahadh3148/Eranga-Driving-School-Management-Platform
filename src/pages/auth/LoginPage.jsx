import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { loginMockUser } = useAuth();
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Hardcoded admin credentials (for a single admin user)
      const ADMIN_EMAIL = 'admin@drivingschool.com';
      const ADMIN_PASSWORD = 'Admin@123';

      // If the entered credentials match the hardcoded admin, bypass Firebase auth
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Force role to admin regardless of the role tab selection
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

      // 1. Sign in using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch profile from Firestore to check role
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data();

        // Check if selected role matches database role
        if (profile.role !== role) {
          setError(`This account is registered as a ${profile.role.toUpperCase()}, not a ${role.toUpperCase()}.`);
          auth.signOut();
          return;
        }

        // Navigate based on role
        // Navigate based on role with admin approval check for students
        if (profile.role === 'student') {
          const status = profile.status ? profile.status.toLowerCase() : 'pending';
          if (status !== 'approved') {
            setError('Your account is waiting for admin approval.');
            auth.signOut();
            return;
          }
          navigate('/student');
        } else if (profile.role === 'instructor') {
          navigate('/instructor');
        } else if (profile.role === 'admin') {
          navigate('/admin');
        }
      } else {
        // If it's a seed account like alex@example.com, the AuthStateChanged in AuthContext
        // will automatically create the document. We will wait briefly and reload or navigate.
        if (email === 'alex@example.com') {
          navigate('/student');
        } else {
          setError('User profile not found in database.');
          auth.signOut();
        }
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
          {/* Logo Section */}
          <div className="login-header">
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
                  <a className="forgot-password" href="#">Forgot Password?</a>
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
            <a className="support-link" href="#">
              <span className="material-symbols-outlined">help_outline</span>
              <span>Support Center</span>
            </a>
            <a className="support-link" href="#">
              <span className="material-symbols-outlined">privacy_tip</span>
              <span>Privacy Policy</span>
            </a>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <footer className="shared-footer">
        <div className="footer-brand">Eranga Driving School</div>
        <div className="footer-copyright">

        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
