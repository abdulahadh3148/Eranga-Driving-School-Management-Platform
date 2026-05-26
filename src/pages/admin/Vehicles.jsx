import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { Car, Plus, Edit, Trash, X } from 'lucide-react';

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Car', numberPlate: '', status: 'Available' });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'vehicles')));
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vehicles'), form);
      setShowModal(false);
      setForm({ name: '', type: 'Car', numberPlate: '', status: 'Available' });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'In Use': return 'bg-blue-100 text-blue-700';
      case 'Maintenance': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Fleet</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all training vehicles.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors">
          <Plus size={18} /> Add Vehicle
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Vehicle Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Number Plate</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                      <Car size={16} className="text-gray-400" /> {v.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{v.type}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{v.numberPlate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No vehicles found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add Vehicle</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-sm mb-1">Name / Model</label><input required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white">
                  <option>Car</option><option>Motorcycle</option><option>Three-Wheeler</option><option>Heavy Vehicle</option>
                </select>
              </div>
              <div><label className="block text-sm mb-1">Number Plate</label><input required value={form.numberPlate} onChange={e=>setForm({...form, numberPlate:e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm mb-1">Initial Status</label>
                <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white">
                  <option>Available</option><option>In Use</option><option>Maintenance</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-primary/50 text-white font-bold hover:bg-orange-600">Save Vehicle</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
