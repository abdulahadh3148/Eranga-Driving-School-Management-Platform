const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

const packagesPageMatch = content.match(/function PackagesPage\(\{ packages[^}]*\}\) \{[\s\S]*?\n\}/);
const bookSessionPageMatch = content.match(/function BookSessionPage\(\{ user[^}]*\}\) \{[\s\S]*?\n\}/);

if (!packagesPageMatch || !bookSessionPageMatch) {
  console.log('Could not find PackagesPage or BookSessionPage');
  process.exit(1);
}

const newBookSessionPage = `function BookSessionPage({ packages, user, currentUser, userProfile, setUserProfile, instructors, goTo }) {
  const [sessionType, setSessionType] = useState('driving');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Packages state
  const [enrolling, setEnrolling] = useState(null);

  const handleEnroll = async (pkg) => {
    setEnrolling(pkg.id);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        enrolledPackage: pkg.name,
        packageId: pkg.id,
        classesTotal: pkg.features.some(f => f.includes('25')) ? 25 : pkg.features.some(f => f.includes('18')) ? 18 : 10,
        outstandingFees: (userProfile?.outstandingFees || 0) + pkg.price
      });
      setUserProfile({ ...userProfile, enrolledPackage: pkg.name, packageId: pkg.id });
    } catch (e) {
      console.error(e);
      alert("Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const instructor = instructors.find(i => i.id === instructorId);
      await addDoc(collection(db, 'bookings'), {
        studentId: currentUser.uid,
        studentName: user.name,
        instructorId,
        instructorName: instructor?.name || 'Unassigned',
        date, timeSlot, sessionType,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess('Session booked successfully!');
      setTimeout(() => { setSuccess(''); setDate(''); setTimeSlot(''); }, 2000);
    } catch (err) { console.error(err); setError('Booking failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* ── Package Selection ── */}
      <div style={{ marginBottom: 40 }}>
        <PageHeader title="Course Packages" sub="Select or view your enrolled course package" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
          {packages.filter(p => p.isActive).map(pkg => {
            const isEnrolled = user.enrolledPackage === pkg.name || userProfile?.packageId === pkg.id;
            return (
              <div key={pkg.id} style={{ ...css.card, position: 'relative', border: isEnrolled ? '2px solid #f59e0b' : '1px solid #1e1a18' }}>
                {pkg.popular && <div style={{ position: 'absolute', top: -12, left: 24, background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 12 }}>POPULAR</div>}
                {isEnrolled && <div style={{ position: 'absolute', top: 12, right: 12, background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 12 }}>ENROLLED</div>}
                
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f5f0eb' }}>{pkg.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', margin: '12px 0' }}>{fmtLKR(pkg.price)}</div>
                <div style={{ fontSize: 12, color: '#8a7f74', marginBottom: 20 }}>{pkg.duration} • {pkg.vehicleType}</div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: 13, color: '#c9bfb5' }}>
                  {pkg.features.map((f, i) => <li key={i} style={{ marginBottom: 8 }}>✓ {f}</li>)}
                </ul>
                <button
                  onClick={() => handleEnroll(pkg)}
                  disabled={isEnrolled || enrolling === pkg.id}
                  style={isEnrolled ? { ...css.primaryBtn, background: '#1e1a18', color: '#6b6460' } : css.primaryBtn}
                  className={!isEnrolled ? 'accent-btn' : ''}
                >
                  {isEnrolled ? 'Current Package' : enrolling === pkg.id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e1a18', margin: '40px 0' }}></div>

      {/* ── Book a Session ── */}
      <PageHeader title="Book a Session" sub="Schedule your next driving lesson or theory class" />
      {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
      {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
      
      <form onSubmit={handleBook} style={{ ...css.card, marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          <div>
            <label style={css.formLabel}>Session Type</label>
            <select style={css.formInput} value={sessionType} onChange={e => setSessionType(e.target.value)}>
              <option value="driving">Practical Driving</option>
              <option value="theory">Theory Class</option>
              <option value="exam_prep">Exam Prep</option>
            </select>
          </div>
          <div>
            <label style={css.formLabel}>Instructor</label>
            <select style={css.formInput} value={instructorId} onChange={e => setInstructorId(e.target.value)} required>
              <option value="">Select Instructor</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label style={css.formLabel}>Date</label>
            <input type="date" style={css.formInput} value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={css.formLabel}>Time Slot</label>
            <select style={css.formInput} value={timeSlot} onChange={e => setTimeSlot(e.target.value)} required>
              <option value="">Select Time</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 28, width: 'auto', padding: '0 32px' }} className="accent-btn">
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}`;

content = content.replace(bookSessionPageMatch[0], newBookSessionPage);
content = content.replace(/\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n\/\/\s*PACKAGES PAGE\r?\n\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n/, '');
content = content.replace(packagesPageMatch[0], '');

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Merged BookSessionPage successfully.');
