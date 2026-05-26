import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Check, Package, Zap } from 'lucide-react';

export default function ViewPackages() {
  const { userProfile } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'packages'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Fallback packages if DB is empty
  const displayPackages = packages.length > 0 ? packages : [
    { id: 'pkg1', name: 'Basic Course', price: 15000, duration: '4 Weeks', vehicleType: 'Car', features: ['Theory Classes', '10 Practical Lessons', 'Exam Prep'] },
    { id: 'pkg2', name: 'Standard Course', price: 25000, duration: '6 Weeks', vehicleType: 'Car', features: ['Theory Classes', '18 Practical Lessons', 'Exam Prep', 'Vehicle for Test'], popular: true },
    { id: 'pkg3', name: 'Premium Course', price: 40000, duration: '8 Weeks', vehicleType: 'Car + Highway', features: ['Theory Classes', '25 Practical Lessons', 'Exam Prep', 'Vehicle for Test', 'Highway Driving'] },
  ];

  if (loading) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Available Packages</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and select a training package.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {displayPackages.map((pkg, i) => {
          const isEnrolled = userProfile?.packageId === pkg.name || userProfile?.packageId === pkg.id;
          return (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`relative bg-white rounded-2xl border-2 transition-shadow overflow-hidden flex flex-col h-full
                ${isEnrolled ? 'border-green-500 shadow-md' : pkg.popular ? 'border-primary shadow-lg' : 'border-gray-100 hover:shadow-md hover:border-gray-300'}`}>
              
              {isEnrolled && (
                <div className="bg-green-500 text-white text-xs font-bold px-4 py-1.5 text-center flex items-center justify-center gap-1">
                  CURRENTLY ENROLLED
                </div>
              )}
              {!isEnrolled && pkg.popular && (
                <div className="bg-primary/50 text-white text-xs font-bold px-4 py-1.5 text-center flex items-center justify-center gap-1">
                  <Zap size={14} /> MOST POPULAR
                </div>
              )}

              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{pkg.vehicleType} • {pkg.duration}</p>
                <p className="text-3xl font-black text-gray-900">Rs. {Number(pkg.price).toLocaleString()}</p>
                {pkg.description && <p className="text-sm text-gray-600 mt-3">{pkg.description}</p>}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {(pkg.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                
                {isEnrolled ? (
                  <Link to="/student/package" className="block w-full py-2.5 rounded-xl bg-green-50 text-green-700 font-bold text-sm text-center border border-green-200">
                    View Details
                  </Link>
                ) : (
                  <Link to={`/student/enroll/${pkg.id}`} className={`block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-colors
                    ${pkg.popular ? 'bg-primary/50 hover:bg-orange-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
                    Select Package
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
