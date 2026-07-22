import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from "../../firebase/config";
import { useAuth } from '../../context/AuthContext';
import { generateCustomId } from '../../utils/idGenerator';
import { sendNotification } from '../../utils/notifications';
import { sendAdminNotification } from '../../utils/email';
import './RegisterPage.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // New Demographics & Emergency Contact
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [district, setDistrict] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  
  // Real-time error states
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nicError, setNicError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  // Real-time validations
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

  const validatePhone = (val) => {
    setPhone(val);
    if (!val) {
      setPhoneError('Phone number is required.');
      return false;
    }
    // Sri Lanka phone format check: supports +94xxxxxxxxx, 07xxxxxxxx, 7xxxxxxxx
    const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    if (!phoneRegex.test(val.replace(/[\s-()]/g, ''))) {
      setPhoneError('Enter a valid Sri Lankan phone number (e.g. 0771234567).');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateNic = (val) => {
    setNic(val);
    if (!val) {
      setNicError('NIC number is required.');
      return false;
    }
    // Sri Lankan NIC check: 9 digits + V/X, or 12 digits
    const nicRegex = /^(?:[0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(val)) {
      setNicError('Enter a valid Sri Lankan NIC (e.g., 991234567V or 200012345678).');
      return false;
    }
    setNicError('');
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
    // Additional security checks
    const hasNumber = /\d/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    if (!hasNumber || !hasSpecial) {
      setPasswordError('Password should contain at least one number and one special character.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Trigger all validations
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isNicValid = validateNic(nic);
    const isPasswordValid = validatePassword(password);

    if (!fullName) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isEmailValid || !isPhoneValid || !isNicValid || !isPasswordValid) {
      setError('Please correct the validation errors below.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      setError('Passwords do not match.');
      return;
    } else {
      setConfirmPasswordError('');
    }

    setLoading(true);

    try {
      // Check NIC uniqueness
      const nicQ = query(collection(db, 'students'), where('nic', '==', nic));
      const nicSnap = await getDocs(nicQ);
      
      if (!nicSnap.empty) {
        setError('This NIC number is already registered.');
        setLoading(false);
        return;
      }

      // Check phone uniqueness
      const phoneQ = query(collection(db, 'students'), where('phone', '==', phone));
      const phoneSnap = await getDocs(phoneQ);
      const isPhoneDuplicate = !phoneSnap.empty;
      
      if (isPhoneDuplicate) {
        setError('This phone number is already registered.');
        setLoading(false);
        return;
      }

      // 2. Generate Custom ID (EDSxxx)
      const customId = await generateCustomId('EDS');

      // 1.5 Create user in Firebase Auth
      let authUid = `mock-uid-${customId}`;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        authUid = userCredential.user.uid;
        // Sign out immediately so they don't get auto-logged in, forcing them to wait for approval
        await auth.signOut();
      } catch (authErr) {
        console.error("Firebase Auth Registration Error:", authErr);
        if (authErr.code === 'auth/email-already-in-use') {
           setError('This email is already registered in Authentication.');
           setLoading(false);
           return;
        }
        throw authErr; // re-throw to be caught by the outer catch
      }

      // 3. Initialize student profile in Firestore
      const userDocRef = doc(db, 'students', customId);
      const newProfile = {
        id: customId,
        authUid: authUid, 
        name: fullName,
        email: email,
        phone: phone,
        nic: nic,
        gender: gender,
        dob: dob,
        district: district,
        emergencyName: emergencyName,
        emergencyPhone: emergencyPhone,
        emergencyRelationship: emergencyRelationship,
        role: 'student',
        status: 'pending',
        setup_completed: false,
        l_permit_status: 'not_started',
        medical_status: 'not_started',
        progress: 0,
        classesCompleted: 0,
        classesTotal: 18,
        lessonsScheduled: 0,
        outstandingFees: 0,
        learned_skills: [],
        currentStep: 'Medical Check',
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, newProfile);

      // Send Notification to Admin
      await sendNotification({
        userId: 'admin',
        title: 'New Student Registration',
        message: `${fullName} has registered and their account requires approval.`,
        type: 'info',
        link: '/admin/pending'
      });

      // Send Email Notification to Admin via Web3Forms
      await sendAdminNotification(
        "New Student Registration",
        "A new student has registered and requires approval.",
        {
          "Student Name": fullName,
          "Email": email,
          "Phone": phone,
          "NIC": nic
        }
      );

      setLoading(false);
      
      alert('Registration successful! You can now log in.');
      navigate('/login', { state: { registrationSuccess: true, pendingApproval: false, email } });
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
    if (!password) return { label: 'Weak', class: 'weak', activeBars: 0 };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', class: 'weak', activeBars: 1 };
    if (score <= 4) return { label: 'Medium', class: 'medium', activeBars: 2.5 };
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
                    autoFocus
                  />
                </div>
              </div>

              {/* NIC Number */}
              <div className="register-form-group">
                <label className="register-label" htmlFor="nic">NIC Number</label>
                <div className="register-input-wrapper" style={{ borderColor: nicError ? '#ef4444' : (nic && !nicError ? '#10b981' : '') }}>
                  <span className="material-symbols-outlined register-input-icon" style={{ color: nicError ? '#ef4444' : (nic && !nicError ? '#10b981' : '') }}>badge</span>
                  <input
                    className="register-input"
                    id="nic"
                    name="nic"
                    placeholder="200012345678"
                    type="text"
                    value={nic}
                    onChange={(e) => validateNic(e.target.value)}
                    disabled={loading}
                  />
                  {nic && (
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: nicError ? '#ef4444' : '#10b981', fontSize: '18px' }}>
                      {nicError ? 'cancel' : 'check_circle'}
                    </span>
                  )}
                </div>
                {nicError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{nicError}</span>}
              </div>

            {/* Phone Number */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="phone">Phone Number</label>
              <div className="register-input-wrapper" style={{ borderColor: phoneError ? '#ef4444' : (phone && !phoneError ? '#10b981' : '') }}>
                <span className="material-symbols-outlined register-input-icon" style={{ color: phoneError ? '#ef4444' : (phone && !phoneError ? '#10b981' : '') }}>call</span>
                <input
                  className="register-input"
                  id="phone"
                  name="phone"
                  placeholder="+94 (77) 123-4567"
                  type="tel"
                  value={phone}
                  onChange={(e) => validatePhone(e.target.value)}
                  disabled={loading}
                />
                {phone && (
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: phoneError ? '#ef4444' : '#10b981', fontSize: '18px' }}>
                    {phoneError ? 'cancel' : 'check_circle'}
                  </span>
                )}
              </div>
              {phoneError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{phoneError}</span>}
            </div>

            {/* Email Address */}
            <div className="register-form-group">
              <label className="register-label" htmlFor="email">Email Address</label>
              <div className="register-input-wrapper" style={{ borderColor: emailError ? '#ef4444' : (email && !emailError ? '#10b981' : '') }}>
                <span className="material-symbols-outlined register-input-icon" style={{ color: emailError ? '#ef4444' : (email && !emailError ? '#10b981' : '') }}>mail</span>
                <input
                  className="register-input"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  disabled={loading}
                />
                {email && (
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: emailError ? '#ef4444' : '#10b981', fontSize: '18px' }}>
                    {emailError ? 'cancel' : 'check_circle'}
                  </span>
                )}
              </div>
              {emailError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{emailError}</span>}
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }}></div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '16px' }}>Demographics</h3>
            
            <div className="register-grid-2">
              <div className="register-form-group">
                <label className="register-label" htmlFor="dob">Date of Birth</label>
                <div className="register-input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined register-input-icon" style={{ zIndex: 1 }}>calendar_month</span>
                  <div style={{ width: '100%' }}>
                    <DatePicker
                      selected={dob ? new Date(dob) : null}
                      onChange={(date) => {
                        if (date) {
                          const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                          setDob(localDate);
                        } else {
                          setDob('');
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      maxDate={new Date()}
                      placeholderText="Select Date of Birth"
                      customInput={<input className="register-input" disabled={loading} style={{ width: '100%', boxSizing: 'border-box' }} />}
                    />
                  </div>
                </div>
              </div>
              <div className="register-form-group">
                <label className="register-label" htmlFor="gender">Gender</label>
                <div className="register-input-wrapper">
                  <select
                    className="register-input"
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="district">District</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">location_on</span>
                <input
                  className="register-input"
                  id="district"
                  name="district"
                  type="text"
                  placeholder="e.g. Kurunegala"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }}></div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '16px' }}>Emergency Contact</h3>

            <div className="register-form-group">
              <label className="register-label" htmlFor="emergencyName">Contact Name</label>
              <div className="register-input-wrapper">
                <span className="material-symbols-outlined register-input-icon">person_alert</span>
                <input
                  className="register-input"
                  id="emergencyName"
                  name="emergencyName"
                  type="text"
                  placeholder="Name of Emergency Contact"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="register-grid-2">
              <div className="register-form-group">
                <label className="register-label" htmlFor="emergencyPhone">Contact Phone</label>
                <div className="register-input-wrapper">
                  <input
                    className="register-input"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    placeholder="07X XXX XXXX"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="register-form-group">
                <label className="register-label" htmlFor="emergencyRelationship">Relationship</label>
                <div className="register-input-wrapper">
                  <input
                    className="register-input"
                    id="emergencyRelationship"
                    name="emergencyRelationship"
                    type="text"
                    placeholder="e.g. Parent, Sibling"
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }}></div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '16px' }}>Security</h3>

            {/* Password Row */}
            <div className="register-grid-2">
              {/* Password */}
              <div className="register-form-group">
                <label className="register-label" htmlFor="password">Password</label>
                <div className="register-input-wrapper" style={{ borderColor: passwordError ? '#ef4444' : (password && !passwordError ? '#10b981' : '') }}>
                  <span className="material-symbols-outlined register-input-icon" style={{ color: passwordError ? '#ef4444' : (password && !passwordError ? '#10b981' : '') }}>lock</span>
                  <input
                    className="register-input"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => validatePassword(e.target.value)}
                    disabled={loading}
                    style={{ paddingRight: '48px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {passwordError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{passwordError}</span>}
              </div>

              {/* Confirm Password */}
              <div className="register-form-group">
                <label className="register-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="register-input-wrapper" style={{ borderColor: confirmPasswordError ? '#ef4444' : (confirmPassword && !confirmPasswordError ? '#10b981' : '') }}>
                  <span className="material-symbols-outlined register-input-icon" style={{ color: confirmPasswordError ? '#ef4444' : (confirmPassword && !confirmPasswordError ? '#10b981' : '') }}>verified_user</span>
                  <input
                    className="register-input"
                    id="confirm-password"
                    name="confirm-password"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (password !== e.target.value) {
                        setConfirmPasswordError('Passwords do not match.');
                      } else {
                        setConfirmPasswordError('');
                      }
                    }}
                    disabled={loading}
                    style={{ paddingRight: '48px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {confirmPasswordError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block', fontWeight: 550 }}>{confirmPasswordError}</span>}
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

            {/* Action Button Step 2 */}
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
              {loading ? 'Creating Account...' : 'Complete Registration'}
              {!loading && <span className="material-symbols-outlined">check_circle</span>}
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
