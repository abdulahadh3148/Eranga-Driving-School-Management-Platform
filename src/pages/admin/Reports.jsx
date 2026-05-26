import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Download } from 'lucide-react';

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and view school performance metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors">
          <Download size={18} /> Export CSV
        </button>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
          <BarChart3 size={48} className="text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Revenue Chart (Placeholder)</h2>
          <p className="text-gray-500 text-sm">Visual charts will be implemented here using a library like Recharts or Chart.js.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
          <TrendingUp size={48} className="text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Enrollment Trends (Placeholder)</h2>
          <p className="text-gray-500 text-sm">Track new student registrations over the last 12 months.</p>
        </motion.div>
      </div>
    </div>
  );
}
