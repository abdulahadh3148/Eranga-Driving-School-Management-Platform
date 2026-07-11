import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from "../../firebase/config";
import { generateCustomId } from '../../utils/idGenerator';
import { useAuth } from '../../context/AuthContext';
import './RegisterPage.css';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect if already logged in and profile is fully loaded
    if (!authLoading && currentUser && userProfile) {
      if (userProfile.role === 'student') navigate('/student');
      else if (userProfile.role === 'instructor') navigate('/instructor');
      else if (userProfile.role === 'admin') navigate('/admin');
    }
  }, [authLoading, currentUser, userProfile, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Input Validation
    if (!fullName || !email || !phone || !nic || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Generate Custom ID (EDSxxx)
      const customId = await generateCustomId('EDS');

      // 3. Initialize student profile in Firestore with Custom ID as Primary Key
      const userDocRef = doc(db, 'users', customId);
      const newProfile = {
        id: customId,
        authUid: user.uid,
        name: fullName,
        email: email,
        phone: phone,
        nic: nic,
        role: 'student',
        status: 'pending',
        setup_completed: false,
        progress: 0,
        classesCompleted: 0,
        classesTotal: 18,
        lessonsScheduled: 0,
        outstandingFees: 0,
        currentStep: 'Medical Check',
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, newProfile);

      // Sign out the automatically logged-in user so they must log in manually
      await auth.signOut();

      // Navigate to login with success state
      navigate('/login', { state: { registrationSuccess: true, email } });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Basic dynamic password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Weak', class: 'weak', activeBars: 1 };
    if (password.length < 6) return { label: 'Weak', class: 'weak', activeBars: 1 };
    if (password.length >= 6 && password.length < 10) return { label: 'Medium', class: 'medium', activeBars: 2 };
    return { label: 'Strong', class: 'strong', activeBars: 4 };
  };

  const strength = getPasswordStrength();

  return (
    <div className="register-page-wrapper">
      <main className="register-main">
        {/* Back to Home Link */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#505f76', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Back to Home
          </Link>
        </div>

        {/* Logo Header */}
        <div className="register-header">
          <div style={{ backgroundColor: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(11, 37, 69, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>directions_car</span>
          </div>
          <h1 className="register-title">Create Student Account</h1>
          <p className="register-subtitle">Start your journey to professional driving excellence</p>
        </div>

        {/* Registration Card */}
        <div className="register-glass-card">
          {error && (
            <div className="register-error-banner" style={{
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

          <form className="register-form" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="full-name">Full Name</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">person</span>
                <input
                  className="register-input"
                  id="full-name"
                  name="full-name"
                  placeholder="John Doe"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="email">Email Address</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">mail</span>
                <input
                  className="register-input"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* NIC Number */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="nic">NIC Number</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">badge</span>
                <input
                  className="register-input"
                  id="nic"
                  name="nic"
                  placeholder="200012345678"
                  type="text"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="phone">Phone Number</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">call</span>
                <input
                  className="register-input"
                  id="phone"
                  name="phone"
                  placeholder="+94 (77) 123-4567"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="register-grid-2">
              {/* Password */}
              <div className="register-form-group">
                <label className="register-label" htmlFor="password">Password</label>
                <div className="register-input-wrapper">
                  <span className="material-symbols-outlined register-input-icon">lock</span>
                  <input
                    className="register-input"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="register-form-group">
                <label className="register-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="register-input-wrapper">
                  <span className="material-symbols-outlined register-input-icon">verified_user</span>
                  <input
                    className="register-input"
                    id="confirm-password"
                    name="confirm-password"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            <div className="password-strength-container">
              <div className="password-strength-header">
                <span className="strength-label">Password Strength</span>
                <span className="strength-text">{strength.label}</span>
              </div>
              <div className="strength-bars">
                <div className={`strength-bar ${strength.activeBars >= 1 ? 'active' : ''}`}></div>
                <div className={`strength-bar ${strength.activeBars >= 2 ? 'active' : ''}`}></div>
                <div className={`strength-bar ${strength.activeBars >= 3 ? 'active' : ''}`}></div>
                <div className={`strength-bar ${strength.activeBars >= 4 ? 'active' : ''}`}></div>
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="register-submit-btn" 
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
              {loading ? 'Creating Account...' : 'Register'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Link */}
          <div className="register-footer-text">
            <p>
              Already have an account?{' '}
              <Link to="/login">Login</Link>
            </p>
          </div>
        </div>

        {/* Role Context Badge */}
        <div className="register-role-badge">
          <span className="role-badge">
            Registration Mode: Student
          </span>
        </div>
      </main>

      {/* Footer Content */}
      <footer className="register-footer-bottom">
        <span>&copy; {new Date().getFullYear()} Eranga Driving School. All rights reserved.</span>
        <div className="footer-bottom-links">
          <Link to="/about">Privacy Policy</Link>
          <Link to="/about">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
