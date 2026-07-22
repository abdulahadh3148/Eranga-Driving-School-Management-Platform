import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, getDocs, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Package, Plus, Edit, Trash, X } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', duration: '', vehicleType: '', features: '', isActive: true });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'packages'));
    const unsubscribe = onSnapshot(q, async (snap) => {
      let fetchedPackages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Auto-seed packages if empty for the first time
      if (fetchedPackages.length === 0) {
        const defaultPackages = [
          { name: 'Standard Auto', price: 15000, duration: '1 Month', vehicleType: 'Auto', isActive: true, features: ['10 Practical Sessions', 'Theory Classes'] },
          { name: 'Standard Manual', price: 12000, duration: '1 Month', vehicleType: 'Manual', isActive: true, features: ['10 Practical Sessions', 'Theory Classes'] },
          { name: 'Heavy Vehicle pro', price: 25000, duration: '2 Months', vehicleType: 'Heavy', isActive: true, features: ['15 Practical Sessions', 'Heavy Vehicle License Exam Prep'] }
        ];
        
        for (const pkg of defaultPackages) {
          const newId = await generateCustomId('PKG');
          await setDoc(doc(db, 'packages', newId), { ...pkg, id: newId });
        }
      } else {
        setPackages(fetchedPackages);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({ name: '', price: '', duration: '', vehicleType: '', features: '', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (p) => {
    setIsEditing(true);
    setEditId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      duration: p.duration,
      vehicleType: p.vehicleType,
      features: p.features ? p.features.join(', ') : '',
      isActive: p.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        await deleteDoc(doc(db, 'packages', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = form.features
        ? form.features.split(',').map(f => f.trim()).filter(Boolean)
        : [];
        
      const payload = {
        name: form.name,
        price: Number(form.price),
        duration: form.duration,
        vehicleType: form.vehicleType,
        isActive: form.isActive,
        features: featuresArray
      };

      if (isEditing) {
        await updateDoc(doc(db, 'packages', editId), payload);
      } else {
        const newId = await generateCustomId('PKG');
        await setDoc(doc(db, 'packages', newId), { ...payload, id: newId });
      }
      
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Packages</h1>
          <p className="text-gray-500 text-sm mt-1">Manage courses available for students.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors">
          <Plus size={18} /> Add Package
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
                  <th className="px-6 py-4">Package Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                      <Package size={16} className="text-primary" /> {p.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.vehicleType}</td>
                    <td className="px-6 py-4 text-gray-600">{p.duration}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">Rs. {Number(p.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No packages found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Package' : 'Add Package'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-sm mb-1">Package Name</label><input required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm mb-1">Vehicle Type</label><input required value={form.vehicleType} onChange={e=>setForm({...form, vehicleType:e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm mb-1">Duration</label><input required value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} placeholder="e.g. 6 Weeks" className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm mb-1">Price (Rs.)</label><input required type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm mb-1">Features (comma-separated)</label><input required value={form.features} onChange={e=>setForm({...form, features:e.target.value})} placeholder="e.g. Theory Classes, 18 Lessons, Exam Prep" className="w-full px-3 py-2 border rounded-xl" /></div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})} className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Set as Active</span>
                </label>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-primary/50 text-white font-bold hover:bg-orange-600 mt-2">
                {isEditing ? 'Save Changes' : 'Save Package'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
