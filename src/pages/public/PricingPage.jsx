import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, Car, Truck } from 'lucide-react';
import { CATEGORIES, getPackagesByCategory, formatPrice } from '../../data/packages';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('lv');

  const packages = getPackagesByCategory(activeTab);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold mb-4">Transparent Pricing</span>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Vehicle Training Prices</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Pick the vehicles you want to learn. Select multiple and we'll calculate your total automatically.</p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                  ${activeTab === cat.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {cat.id === 'lv' ? <Car size={18} /> : <Truck size={18} />}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-5 text-xs font-black text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="p-5 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg, i) => (
                <motion.tr key={pkg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-5">
                    <p className="font-black text-gray-900 text-lg">{pkg.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Check size={14} className="text-green-500" />
                      <span className="text-sm font-semibold text-gray-600">Full Training Included</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <p className="text-2xl font-black text-gray-900">{formatPrice(pkg.price)}</p>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4 shadow-sm">
            <Star size={20} className="text-green-500" />
            <p className="text-green-800 font-bold text-sm">
              All packages include our <strong className="text-green-900">98% Pass Rate Guarantee</strong> — or free repeat lessons until you pass.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Get Your Licence?</h2>
          <p className="text-blue-100 mb-8 font-medium">Join today and start your journey towards becoming a confident driver.</p>
          <Link to="/register" className="inline-block px-8 py-4 rounded-xl bg-white text-blue-700 font-black hover:bg-gray-50 transition-colors shadow-lg hover:-translate-y-1 transform">
            Register Now — It's Free
          </Link>
        </div>
      </section>
    </div>
  );
}
