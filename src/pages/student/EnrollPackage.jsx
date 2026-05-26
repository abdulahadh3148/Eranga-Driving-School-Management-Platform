import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EnrollPackage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPkg = async () => {
      try {
        const docRef = doc(db, 'packages', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPkg({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback if not found in real DB (for demo)
          setPkg({ id, name: 'Standard Course', price: 25000, duration: '6 Weeks' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPkg();
  }, [id]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must accept the terms and conditions.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      // 1. Update user profile
      const userRef = doc(db, 'users', currentUser.uid);
      const updates = {
        packageId: pkg.id,
        outstandingFees: (userProfile?.outstandingFees || 0) + pkg.price,
      };
      await updateDoc(userRef, updates);
      setUserProfile({ ...userProfile, ...updates });

      // 2. Create a pending payment record
      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid,
        packageId: pkg.id,
        amount: pkg.price,
        status: 'pending',
        method: 'Cash/Bank',
        date: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => navigate('/student/package'), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to enroll. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Successful!</h2>
        <p className="text-gray-500 mb-6">You have successfully enrolled in the {pkg?.name}. Redirecting to your package details...</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Confirm Enrollment</h1>
        <p className="text-gray-500 text-sm mt-1">Review details before finalizing your package selection.</p>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="p-6 bg-primary/5 border-b border-orange-100">
          <h2 className="text-xl font-bold text-gray-900">{pkg?.name}</h2>
          <p className="text-primary text-sm">{pkg?.duration}</p>
          <p className="text-3xl font-black text-gray-900 mt-2">Rs. {Number(pkg?.price).toLocaleString()}</p>
        </div>

        <form onSubmit={handleEnroll} className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Student Details</h3>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{userProfile?.name}</span></p>
              <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{userProfile?.email}</span></p>
              <p><span className="text-gray-500">NIC:</span> <span className="font-medium text-gray-900">{userProfile?.nic || 'Not provided'}</span></p>
            </div>
            <p className="text-xs text-primary mt-2">Need to update this? Go to Edit Profile first.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-orange-500" />
            <span className="text-sm text-gray-600">
              I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a>, including the payment policies and lesson cancellation rules of Eranga Driving School.
            </span>
          </label>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" disabled={submitting || !termsAccepted}
              className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
              {submitting ? 'Processing...' : 'Confirm & Enroll'}
            </button>
            <button type="button" onClick={() => navigate(-1)} disabled={submitting}
              className="w-full mt-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors">
              Cancel
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
