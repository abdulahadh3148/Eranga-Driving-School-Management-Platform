import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, CreditCard, MapPin, Shield, Package, Car, Edit } from 'lucide-react';

export default function MyProfile() {
  const { userProfile } = useAuth();
  const p = userProfile || {};

  const statusColor = p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal information and account details.</p>
        </div>
        <Link to="/student/edit-profile"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold text-sm hover:bg-orange-600 transition-colors">
          <Edit size={16} /> Edit Profile
        </Link>
      </motion.div>

      {/* Avatar & Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/30 shrink-0">
          {p.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{p.name || '—'}</h2>
          <p className="text-gray-500 text-sm">{p.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor}`}>
              {p.status || 'pending'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
              {p.role || 'student'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={18} className="text-primary" /> Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: p.name, icon: User },
            { label: 'Email Address', value: p.email, icon: Mail },
            { label: 'Phone Number', value: p.phone || '—', icon: Phone },
            { label: 'NIC Number', value: p.nic || '—', icon: CreditCard },
            { label: 'Date of Birth', value: p.dob || '—', icon: Shield },
            { label: 'Gender', value: p.gender || '—', icon: User },
            { label: 'Address', value: p.address || '—', icon: MapPin },
            { label: 'Emergency Contact', value: p.emergencyContact || '—', icon: Phone },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <Icon size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Package Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Package size={18} className="text-primary" /> Package & Training</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Current Package', value: p.packageId || 'Not Enrolled', icon: Package },
            { label: 'Licence Type', value: p.licenseType || '—', icon: CreditCard },
            { label: 'Vehicle Preference', value: p.vehiclePreference || '—', icon: Car },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} className="p-4 rounded-xl bg-primary/5 border border-orange-100">
              <Icon size={18} className="text-primary mb-2" />
              <p className="text-xs text-primary font-medium">{label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
