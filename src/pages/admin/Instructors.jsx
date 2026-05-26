import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../../firebase/config';
import { Plus, Edit, Trash, X } from 'lucide-react';

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Instructor Form
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehiclePreference: '' });

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
      const snap = await getDocs(q);
      setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstructors(); }, []);

  const handleAddInstructor = async (e) => {
    e.preventDefault();
    try {
      // Create a temporary Firebase app to avoid signing out the current admin
      const tempApp = initializeApp(firebaseConfig, 'tempApp');
      const tempAuth = getAuth(tempApp);
      
      const userCred = await createUserWithEmailAndPassword(tempAuth, form.email, form.password);
      
      // Add profile
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        vehiclePreference: form.vehiclePreference,
        role: 'instructor',
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      // Sign out from temp auth and delete temp app
      await signOut(tempAuth);
      await tempApp.delete();

      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', vehiclePreference: '' });
      fetchInstructors();
      alert('Instructor added successfully!');
    } catch (err) {
      console.error(err);
      alert('Error adding instructor. ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Instructors</h1>
          <p className="text-gray-500 text-sm mt-1">View and add driving instructors.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors">
          <Plus size={18} /> Add Instructor
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
                  <th className="px-6 py-4">Instructor Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors.map(inst => (
                  <tr key={inst.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{inst.name}</td>
                    <td className="px-6 py-4 text-gray-600">{inst.email}</td>
                    <td className="px-6 py-4 text-gray-600">{inst.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700">
                        {inst.vehiclePreference || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))}
                {instructors.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No instructors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Instructor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add New Instructor</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddInstructor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input value={form.vehiclePreference} onChange={e => setForm({...form, vehiclePreference: e.target.value})} placeholder="e.g. Car (Manual), Heavy Vehicle" className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-primary/50 text-white font-bold hover:bg-orange-600">Save Instructor</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
