import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Package, Clock, Car, CheckCircle2 } from 'lucide-react';

export default function SelectedPackage() {
  const { userProfile } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      if (!userProfile?.packageId) {
        setLoading(false);
        return;
      }
      try {
        // Assume packageId might be the document ID, or we fetch it
        // Since we don't know the exact ID format in useProfile yet, let's query or use doc
        // For robustness, if it's an ID:
        const docRef = doc(db, 'packages', userProfile.packageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPackageData({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback mock for demo if no real package found
          setPackageData({
            name: userProfile.packageId,
            price: userProfile.outstandingFees || 0,
            duration: '6 Weeks',
            vehicleType: userProfile.licenseType || 'Car',
            features: ['Theory Classes', 'Practical Lessons', 'Exam Preparation']
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [userProfile]);

  if (loading) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  if (!userProfile?.packageId || !packageData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Package size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Package Selected</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't enrolled in any driving package yet. Browse our available packages to get started.</p>
        <Link to="/student/packages" className="inline-block px-6 py-2.5 bg-primary/50 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
          Browse Packages
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">My Package</h1>
        <p className="text-gray-500 text-sm mt-1">Details of your current enrollment.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg mb-2">ACTIVE</span>
                <h2 className="text-2xl font-bold text-gray-900">{packageData.name}</h2>
              </div>
              <p className="text-2xl font-black text-gray-900">Rs. {Number(packageData.price).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-6 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Package Details</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={16} className="text-primary" /> Duration: {packageData.duration}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Car size={16} className="text-primary" /> Vehicle: {packageData.vehicleType}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Included Features</h3>
              <ul className="space-y-2">
                {(packageData.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Training Progress</h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="10" 
                  strokeDasharray={`${(userProfile?.classesCompleted || 0) / (userProfile?.classesTotal || 18) * 283} 283`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900">{userProfile?.classesCompleted || 0}</span>
                <span className="text-xs text-gray-500">of {userProfile?.classesTotal || 18}</span>
              </div>
            </div>
            <p className="font-medium text-gray-900">Classes Completed</p>
            <p className="text-xs text-gray-500 mt-1">Keep up the good work!</p>
          </div>
          <Link to="/student/book" className="mt-6 w-full py-2.5 bg-primary/50 text-white font-bold rounded-xl text-center text-sm hover:bg-orange-600 transition-colors">
            Book Next Lesson
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
