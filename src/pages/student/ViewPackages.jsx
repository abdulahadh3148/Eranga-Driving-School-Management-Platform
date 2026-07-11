import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Check, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { CATEGORIES, getPackagesByCategory, formatPrice } from '../../data/packages';

// ── Theme per category ───────────────────────────────────────────────────────
const CAT_THEME = {
  lv: {
    gradient: 'from-blue-500 to-blue-700',
    border: 'border-blue-200',
    light: 'bg-blue-50',
    text: 'text-blue-700',
  },
  hv: {
    gradient: 'from-violet-500 to-violet-700',
    border: 'border-violet-200',
    light: 'bg-violet-50',
    text: 'text-violet-700',
  },
};

function StepBadge({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all
        ${done ? 'bg-green-500 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {done ? <Check size={14} /> : n}
      </div>
      <span className={`text-sm font-bold hidden sm:block ${active ? 'text-gray-900' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

export default function ViewPackages() {
  const { userProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedCatId, setSelectedCatId] = useState(null);

  const selectedCat = CATEGORIES.find(c => c.id === selectedCatId);
  const theme = selectedCatId ? (CAT_THEME[selectedCatId] || CAT_THEME.lv) : CAT_THEME.lv;
  const filteredVehicles = selectedCatId ? getPackagesByCategory(selectedCatId) : [];

  const selectCategory = (id) => { setSelectedCatId(id); setStep(2); };
  const goBack = () => { if (step === 2) { setStep(1); setSelectedCatId(null); } };

  const userVehicles = userProfile?.selected_vehicles || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-gray-900">Vehicle Training Prices</h1>
        <p className="text-gray-500 mt-1">Browse our vehicle training prices. Select multiple vehicles during setup to build your own package.</p>
      </motion.div>

      {userVehicles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-bold text-green-800 text-sm">Your Selected Vehicles</p>
            <p className="text-green-700 text-sm">{userProfile?.enrolledPackage || 'None'} — Total: {formatPrice(userProfile?.total_price || 0)}</p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <StepBadge n={1} label="Category" active={step === 1} done={step > 1} />
        <div className="flex-1 h-px bg-gray-200" />
        <StepBadge n={2} label="View Vehicles" active={step === 2} done={false} />
        {step > 1 && (
          <button onClick={goBack} className="ml-4 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">1</span>
              <h2 className="text-xl font-black text-gray-900">Choose a Category to View Prices</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
              {CATEGORIES.map((cat, i) => {
                const t = CAT_THEME[cat.id] || CAT_THEME.lv;
                const vehicleCount = getPackagesByCategory(cat.id).length;
                return (
                  <motion.button key={cat.id} onClick={() => selectCategory(cat.id)}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`group relative text-left rounded-2xl border-2 ${t.border} bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden`}>
                    <div className={`h-1.5 w-full bg-gradient-to-r ${t.gradient}`} />
                    <div className="p-6">
                      <div className={`w-14 h-14 rounded-2xl ${t.light} flex items-center justify-center mb-4 text-3xl`}>{cat.icon}</div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">{cat.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{cat.description}</p>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className={`text-xs font-black uppercase tracking-wider ${t.text}`}>{vehicleCount} Vehicles</span>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <ChevronRight size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center gap-2 mb-5">
              <span className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.gradient} text-white text-xs font-black flex items-center justify-center`}>2</span>
              <h2 className="text-xl font-black text-gray-900">
                Vehicle Prices
                <span className={`ml-2 text-base font-semibold ${theme.text}`}>— {selectedCat?.name}</span>
              </h2>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Layers size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No vehicles available for this category.</p>
                <button onClick={goBack} className={`mt-2 text-sm font-bold ${theme.text} hover:underline`}>← Try another category</button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-3xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Vehicle</th>
                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Price</th>
                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVehicles.map((pkg, i) => {
                        const isEnrolled = userVehicles.includes(pkg.id);
                        return (
                          <motion.tr key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`hover:bg-gray-50/50 transition-colors ${isEnrolled ? 'bg-green-50/30' : ''}`}>
                            <td className="p-4"><p className="font-bold text-gray-900">{pkg.name}</p></td>
                            <td className="p-4 text-right"><p className="text-lg font-black text-gray-900">{formatPrice(pkg.price)}</p></td>
                            <td className="p-4 text-center">
                              {isEnrolled ? (
                                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 font-bold text-xs rounded-lg">✓ Selected</span>
                              ) : (
                                <span className="text-xs font-bold text-gray-400">—</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
