const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

const profilePageMatch = content.match(/function ProfilePage\(\{ user[^}]*\}\) \{[\s\S]*?\n\}/);
const editProfilePageMatch = content.match(/function EditProfilePage\(\{ user[^}]*\}\) \{[\s\S]*?\n\}/);

if (!profilePageMatch || !editProfilePageMatch) {
  console.log('Could not find ProfilePage or EditProfilePage');
  process.exit(1);
}

const newProfilePage = `function ProfilePage({ user, currentUser, userProfile, setUserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', nic: user.nic || '', dob: user.dob || '', gender: user.gender || '',
    address: user.address || '', emergencyContact: user.emergencyContact || '', licenseType: user.licenseType || 'B_manual', vehiclePreference: user.vehiclePreference || 'toyota_axio',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rows = [
    ['Full Name', user.name], ['NIC Number', user.nic || '—'], ['Date of Birth', user.dob || '—'], ['Gender', user.gender || '—'],
    ['District', user.district || '—'], ['DMT Office', (user.dmtOffice || '—') + ' DMT'], ['Address', user.address || '—'],
    ['Emergency Contact', user.emergencyContact || '—'], ['License Class', LICENSE_LABELS[user.licenseType] || user.licenseType || '—'],
    ['Training Vehicle', VEHICLE_LABELS[user.vehiclePreference] || user.vehiclePreference || '—'], ['Enrolled Package', user.enrolledPackage || 'None'],
    ['Account Status', user.status === 'approved' ? '✅ Active & Approved' : '⏳ Pending Approval'],
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, form);
      setUserProfile({ ...userProfile, ...form });
      setSuccess('Profile updated successfully!');
      setTimeout(() => { setSuccess(''); setIsEditing(false); }, 1500);
    } catch (err) {
      console.error(err); setError('Failed to update profile.');
    } finally { setLoading(false); }
  };

  if (isEditing) {
    return (
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Edit Profile" sub="Update your personal information" />
        {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
        {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
        <form onSubmit={handleSubmit} style={{ ...css.card, marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} required />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="07X XXX XXXX" />
            <FormField label="NIC Number" name="nic" value={form.nic} onChange={handleChange} />
            <FormField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
            <div>
              <label style={css.formLabel}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={css.formInput}>
                <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
              </select>
            </div>
            <FormField label="Address" name="address" value={form.address} onChange={handleChange} />
            <FormField label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} />
            <div>
              <label style={css.formLabel}>License Class</label>
              <select name="licenseType" value={form.licenseType} onChange={handleChange} style={css.formInput}>
                {Object.entries(LICENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={css.formLabel}>Preferred Vehicle</label>
              <select name="vehiclePreference" value={form.vehiclePreference} onChange={handleChange} style={css.formInput}>
                {Object.entries(VEHICLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button type="submit" disabled={loading} style={css.primaryBtn} className="accent-btn">{loading ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setIsEditing(false)} style={css.ghostBtn} className="ghost-btn">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader title="My Profile" sub="Your registration details" />
        <button onClick={() => setIsEditing(true)} style={{...css.ghostBtn, border: '1px solid #1e1a18'}} className="ghost-btn">✎ Edit Profile</button>
      </div>
      <div style={{ ...css.card, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #1e1a18' }}>
          <div style={{ ...css.avatar, width: 56, height: 56, fontSize: 24 }}>{user.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f5f0eb' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: '#8a7f74', marginTop: 2 }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rows.map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1614', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b6460', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#c9bfb5', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(profilePageMatch[0], newProfilePage);
content = content.replace(/\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n\/\/\s*EDIT PROFILE PAGE\r?\n\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n/, '');
content = content.replace(editProfilePageMatch[0], '');

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Merged ProfilePage successfully.');
