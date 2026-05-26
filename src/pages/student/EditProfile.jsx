import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Save, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function EditProfile() {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    nic: userProfile?.nic || '',
    dob: userProfile?.dob || '',
    gender: userProfile?.gender || '',
    address: userProfile?.address || '',
    emergencyContact: userProfile?.emergencyContact || '',
    licenseType: userProfile?.licenseType || '',
    vehiclePreference: userProfile?.vehiclePreference || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, form);
      // Update local context
      setUserProfile({ ...userProfile, ...form });
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/student/profile'), 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your personal information.</p>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} /> <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">NIC Number</label>
            <input name="nic" value={form.nic} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 transition-all bg-white">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Contact</label>
            <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Name - Phone"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input name="address" value={form.address} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Licence Type (Applying for)</label>
            <select name="licenseType" value={form.licenseType} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 transition-all bg-white">
              <option value="">Select Type</option>
              <option value="Class B (Car - Manual)">Class B (Car - Manual)</option>
              <option value="Class B (Car - Auto)">Class B (Car - Auto)</option>
              <option value="Class A (Motorcycle)">Class A (Motorcycle)</option>
              <option value="Class B1 (Three-Wheeler)">Class B1 (Three-Wheeler)</option>
              <option value="Class C/D (Van/Bus)">Class C/D (Van/Bus)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Preference</label>
            <input name="vehiclePreference" value={form.vehiclePreference} onChange={handleChange} placeholder="e.g. Toyota Aqua"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/50 text-white font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-70">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
          <button type="button" onClick={() => navigate('/student/profile')} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors">
            <X size={16} /> Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
