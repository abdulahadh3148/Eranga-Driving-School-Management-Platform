import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { currentUser, userProfile, setUserProfile, loading: authLoading, loginMockUser } = useAuth();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Inline Validation States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      if (location.state?.pendingApproval) {
        setSuccessMessage('Account created successfully! Please wait for admin approval before logging in.');
      } else {
        setSuccessMessage('Account created successfully! Please login below.');
      }
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
      if (userProfile.status === 'pending') {
        navigate('/pending-approval');
      } else if (userProfile.role === 'student') {
        navigate('/student');
      } else if (userProfile.role === 'instructor') {
        navigate('/instructor');
      } else if (userProfile.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [authLoading, currentUser, userProfile, navigate]);

  const validateEmail = (val) => {
    setEmail(val);
    if (!val) {
      setEmailError('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordError('Password is required.');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setError('Please correct the validation errors below.');
      return;
    }

    setLoading(true);

    try {
      // Hardcoded Admin bypassing Firebase Auth for demo
      if (role === 'admin' && email === 'admin@drivingschool.com' && password === 'Admin@123') {
        const mockAdminProfile = {
          uid: 'admin-123',
          email: 'admin@drivingschool.com',
          name: 'Admin',
          role: 'admin'
        };
        loginMockUser(mockAdminProfile);
        navigate('/admin');
        setLoading(false);
        return;
      }

      // 1. Authenticate with Firebase Auth first to verify the password
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr) {
        console.error("Firebase Auth Error:", authErr);
        
        // --- AUTO-MIGRATE OLD USERS ---
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
          const q = query(collection(db, role + 's'), where('email', '==', email));
          const authUserSnap = await getDocs(q);
          if (!authUserSnap.empty) {
             const profile = authUserSnap.docs[0].data();
             const docId = authUserSnap.docs[0].id;
             if (!profile.authUid || profile.authUid.startsWith('mock-uid-') || profile.authUid.startsWith('mock-')) {
                console.log("Migrating old user to Firebase Auth...");
                try {
                  userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  await updateDoc(doc(db, role + 's', docId), { authUid: userCredential.user.uid });
                } catch (migrateErr) {
                  setError('Auto-migration failed: ' + migrateErr.message);
                  setLoading(false);
                  return;
                }
             } else {
                setError('Incorrect password for this user (Firebase Auth rejected it).');
                setLoading(false);
                return;
             }
          } else {
             setError(`Email not found in the ${role}s database.`);
             setLoading(false);
             return;
          }
        } else {
          setError(`Firebase Auth Error: ${authErr.message}`);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch profile from Firestore
      const q = query(collection(db, role + 's'), where('email', '==', email));
      const authUserSnap = await getDocs(q);

      if (!authUserSnap.empty) {
        const profile = authUserSnap.docs[0].data();
        profile.id = authUserSnap.docs[0].id;

        if (profile.role !== role) {
          setError(`This account is registered as a ${profile.role?.toUpperCase()}, not a ${role.toUpperCase()}.`);
          await auth.signOut();
          return;
        }

        if (profile.role === 'student') {
          if (profile.status === 'pending') {
            await auth.signOut();
            setError('Your account is still pending admin approval. Please wait until an admin approves your registration.');
            return;
          }
          if (profile.status !== 'approved' && profile.status !== 'active') {
            const errMsg = profile.status === 'rejected' ? 'Your account has been rejected. Contact admin.' : 'Your account is not active.';
            setError(errMsg);
            await auth.signOut();
            return;
          }
          // Clear any mock user so AuthContext fetches fresh data on reload
          localStorage.removeItem('mockUser');
          setUserProfile(profile);
          navigate('/student');
        } else if (profile.role === 'instructor') {
          localStorage.removeItem('mockUser');
          setUserProfile(profile);
          navigate('/instructor');
        } else if (profile.role === 'admin') {
          localStorage.removeItem('mockUser');
          setUserProfile(profile);
          navigate('/admin');
        }
      } else {
        setError(`Email not found in the ${role}s database.`);
        await auth.signOut();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Please try again.');
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
                <div className="input-wrapper" style={{ borderColor: emailError ? '#ef4444' : (email && !emailError ? '#10b981' : '') }}>
                  <span className="material-symbols-outlined input-icon" style={{ color: emailError ? '#ef4444' : (email && !emailError ? '#10b981' : '') }}>mail</span>
                  <input
                    className="input-field"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => validateEmail(e.target.value)}
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  {email && (
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: emailError ? '#ef4444' : '#10b981', fontSize: '18px' }}>
                      {emailError ? 'cancel' : 'check_circle'}
                    </span>
                  )}
                </div>
                {emailError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{emailError}</span>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="password-header">
                  <label className="form-label" htmlFor="password">Password</label>
                  <Link className="forgot-password" to="/contact">Forgot Password?</Link>
                </div>
                <div className="input-wrapper has-action" style={{ borderColor: passwordError ? '#ef4444' : (password && !passwordError ? '#10b981' : '') }}>
                  <span className="material-symbols-outlined input-icon" style={{ color: passwordError ? '#ef4444' : (password && !passwordError ? '#10b981' : '') }}>lock</span>
                  <input
                    className="input-field"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => validatePassword(e.target.value)}
                    disabled={loading}
                    style={{ paddingRight: '76px' }}
                  />
                  <button
                    className="input-action"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{ right: 12 }}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {passwordError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{passwordError}</span>}
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
