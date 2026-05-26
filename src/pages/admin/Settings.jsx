import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure global application settings.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">School Details</h2>
          <div className="space-y-4">
            <div><label className="block text-sm text-gray-700 mb-1">School Name</label><input defaultValue="Eranga Driving School" className="w-full px-3 py-2 border rounded-xl" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">Contact Email</label><input defaultValue="info@erangadrivingschool.com" className="w-full px-3 py-2 border rounded-xl" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">Contact Phone</label><input defaultValue="+94 77 123 4567" className="w-full px-3 py-2 border rounded-xl" /></div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Application Features</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Allow new student registrations</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Enable automatic payment verification (Demo Mode)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-primary rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Maintenance Mode (Block student access)</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors">
            <Save size={18} /> Save Settings
          </button>
        </div>

      </motion.div>
    </div>
  );
}
