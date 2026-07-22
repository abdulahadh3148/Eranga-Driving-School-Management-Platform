import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Car, Plus, Edit, Trash, X, Search } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';

const initialFormState = {
  name: '',
  category: 'Light', // Light or Heavy
  price: '',
  session_count: ''
};

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'vehicles'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching vehicles:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setIsEditing(true);
    setEditId(vehicle.id);
    setForm({
      name: vehicle.name || '',
      category: vehicle.category || 'Light',
      price: vehicle.price || '',
      session_count: vehicle.session_count || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course/vehicle?")) return;
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.session_count) {
      alert("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        session_count: Number(form.session_count)
      };
      
      if (isEditing) {
        await updateDoc(doc(db, 'vehicles', editId), data);
      } else {
        const newId = await generateCustomId('VEH');
        await setDoc(doc(db, 'vehicles', newId), { ...data, id: newId });
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = vehicles.filter(v => (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle / Course Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage training courses and vehicles available for students.</p>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors">
          <Plus size={18} /> Add New
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Sessions</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{v.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Car size={16} />
                      </div>
                      {v.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{v.category}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{v.session_count} Classes</td>
                    <td className="px-6 py-4 font-bold text-green-600">Rs. {Number(v.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(v)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No matching records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors" placeholder="e.g. Basic Car Training" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors">
                    <option value="Light">Light Vehicle</option>
                    <option value="Heavy">Heavy Vehicle</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Session Count</label>
                    <input type="number" required min="1" value={form.session_count} onChange={e => setForm({...form, session_count: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors" placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (Rs.)</label>
                    <input type="number" required min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors" placeholder="e.g. 15000" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</> : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
