import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../../firebase/config';
import { Plus, Edit, Trash, X, AlertCircle, CheckCircle, Check, Search, User, Shield, Briefcase, Clock } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';
import DatePicker from '../../components/ui/DatePicker';
import { TRAINING_LEVELS, VEHICLE_TYPES } from '../../utils/schedulingEngine';

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    id: '',
    name: '',
    nic: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    password: '',
    
    licenseNumber: '',
    licenseExpiry: '',
    experienceYears: '',
    
    vehicleTypes: [],
    trainingLevels: [],
    
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    maxStudentsPerBatch: 5,
    
    status: 'active',
  };
  
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'instructors'), where('role', '==', 'instructor'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const allInstructors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInstructors(allInstructors);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching instructors:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to toggle arrays (like vehicleTypes, workingDays)
  const toggleArrayItem = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  // Pre-submit validation
  const validateForm = async () => {
    if (!form.name || !form.nic || !form.phone || !form.email || !form.licenseNumber || !form.licenseExpiry) {
      return 'Please fill all required fields (Name, NIC, Phone, Email, License).';
    }
    
    if (new Date(form.licenseExpiry) <= new Date()) {
      return 'License expiry date must be in the future.';
    }

    if (form.vehicleTypes.length === 0) {
      return 'Please select at least one vehicle type.';
    }

    // Check NIC and Phone uniqueness (only if new or changed)
    try {
      const q = query(collection(db, 'instructors'), where('role', '==', 'instructor'));
      const snap = await getDocs(q);
      const existing = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const isNicUsed = existing.some(u => u.nic === form.nic && u.id !== form.id && u.status !== 'deleted');
      if (isNicUsed) return `NIC ${form.nic} is already registered to another instructor.`;
      
      const isPhoneUsed = existing.some(u => u.phone === form.phone && u.id !== form.id && u.status !== 'deleted');
      if (isPhoneUsed) return `Phone number ${form.phone} is already in use.`;
    } catch (err) {
      console.error('Validation query error:', err);
      // Fail open on read error but log it
    }

    return null; // Valid
  };

  const handleSaveInstructor = async (e) => {
    e.preventDefault();
    const errorMsg = await validateForm();
    if (errorMsg) {
      showToast(errorMsg, 'error');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        // Update existing
        const updateData = {
          name: form.name,
          nic: form.nic,
          dob: form.dob,
          gender: form.gender,
          phone: form.phone,
          address: form.address,
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry,
          experienceYears: Number(form.experienceYears) || 0,
          vehicleTypes: form.vehicleTypes,
          trainingLevels: form.trainingLevels,
          workingDays: form.workingDays,
          workingHours: { start: form.workingHoursStart, end: form.workingHoursEnd },
          maxStudentsPerBatch: Number(form.maxStudentsPerBatch) || null,
          status: form.status,
          updatedAt: new Date().toISOString()
        };
        // Sync to instructors collection
        await updateDoc(doc(db, 'instructors', form.id), updateData);
        showToast('Instructor profile updated successfully!');
      } else {
        // Create new
        if (!form.password || form.password.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          setSubmitting(false);
          return;
        }

        // --- TEMPORARY BYPASS FIREBASE AUTH ---
        // We bypass Firebase Auth to prevent CONFIGURATION_NOT_FOUND errors, 
        // as the rest of the app (like student registration and login) is also using mock auth.
        const mockUid = 'mock-uid-' + Date.now();
        const newCustomId = await generateCustomId('INS');

        const newData = {
          id: newCustomId,
          authUid: mockUid,
          mockPassword: form.password, // Save password so they can login via the bypass in LoginPage.jsx
          role: 'instructor',
          name: form.name,
          nic: form.nic,
          dob: form.dob,
          gender: form.gender,
          phone: form.phone,
          email: form.email,
          address: form.address,
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry,
          experienceYears: Number(form.experienceYears) || 0,
          vehicleTypes: form.vehicleTypes,
          trainingLevels: form.trainingLevels,
          workingDays: form.workingDays,
          workingHours: { start: form.workingHoursStart, end: form.workingHoursEnd },
          maxStudentsPerBatch: Number(form.maxStudentsPerBatch) || null,
          status: form.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // Sync to instructors collection
        await setDoc(doc(db, 'instructors', newCustomId), newData);
        showToast('Instructor created successfully!');
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        showToast('This email address is already in use.', 'error');
      } else {
        showToast('Error saving instructor. ' + err.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (instructor) => {
    // Map existing structure (including legacy fallback) to form state
    setIsEditing(true);
    setForm({
      id: instructor.id,
      name: instructor.name || '',
      nic: instructor.nic || '',
      dob: instructor.dob || '',
      gender: instructor.gender || 'Male',
      phone: instructor.phone || '',
      email: instructor.email || '',
      address: instructor.address || '',
      password: '', // Hidden in edit
      
      licenseNumber: instructor.licenseNumber || '',
      licenseExpiry: instructor.licenseExpiry || '',
      experienceYears: instructor.experienceYears || '',
      
      vehicleTypes: instructor.vehicleTypes || (instructor.vehiclePreference ? [instructor.vehiclePreference] : []),
      trainingLevels: instructor.trainingLevels || [],
      
      workingDays: instructor.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHoursStart: instructor.workingHours?.start || '08:00',
      workingHoursEnd: instructor.workingHours?.end || '17:00',
      maxStudentsPerBatch: instructor.maxStudentsPerBatch || 5,
      
      status: instructor.status === 'approved' ? 'active' : (instructor.status || 'active'),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this instructor? This action cannot be fully undone.")) {
      try {
        // Check if instructor has active students assigned
        const stuQ = query(collection(db, 'students'), where('assignedInstructorId', '==', id));
        const stuSnap = await getDocs(stuQ);
        if (!stuSnap.empty) {
          showToast(`Cannot delete: This instructor is assigned to ${stuSnap.size} student(s). Reassign them first.`, 'error');
          return;
        }

        // Check if instructor has upcoming sessions
        const sessQ = query(collection(db, 'sessions'), where('instructorId', '==', id));
        const sessSnap = await getDocs(sessQ);
        const hasUpcoming = sessSnap.docs.some(d => d.data().status !== 'completed' && d.data().status !== 'cancelled');
        if (hasUpcoming) {
          showToast('Cannot delete: This instructor has upcoming scheduled sessions. Reassign or cancel them first.', 'error');
          return;
        }

        await deleteDoc(doc(db, 'instructors', id));
        showToast('Instructor deleted successfully.');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete instructor.', 'error');
      }
    }
  };

  const toggleStatus = async (instructor) => {
    const newStatus = (instructor.status === 'active' || instructor.status === 'approved') ? 'inactive' : 'active';
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'instructors', instructor.id), updateData);
      showToast(`Instructor marked as ${newStatus}.`);
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const openNewModal = () => {
    setIsEditing(false);
    setForm(initialFormState);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Instructors</h1>
          <p className="text-gray-500 text-sm mt-1">Add and configure driving school instructors.</p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/50 text-white font-semibold hover:bg-orange-600 transition-colors shadow-sm">
          <Plus size={18} /> Add Instructor
        </button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Vehicles</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors.map(inst => {
                  const isActive = inst.status === 'active' || inst.status === 'approved';
                  return (
                    <tr key={inst.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{inst.name}</div>
                        <div className="text-xs text-primary font-mono font-bold mt-0.5">{inst.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{inst.phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{inst.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {(inst.vehicleTypes && inst.vehicleTypes.length > 0) ? (
                            inst.vehicleTypes.map(vt => (
                              <span key={vt} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">{vt}</span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">{inst.vehiclePreference || 'Any'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium text-sm">
                        {inst.experienceYears ? `${inst.experienceYears} Years` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(inst)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEdit(inst)} className="p-2 text-gray-400 hover:text-primary transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(inst.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"><Trash size={16} /></button>
                      </td>
                    </tr>
                  )
                })}
                {instructors.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No active instructors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Comprehensive Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Instructor Profile' : 'Add New Instructor'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="instructor-form" onSubmit={handleSaveInstructor} className="space-y-8">
                  
                  {/* Personal Details */}
                  <section>
                    <div className="flex items-center gap-2 text-primary font-bold mb-4 border-b pb-2">
                      <User size={18} /> <h3>Personal Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">NIC Number *</label>
                        <input required value={form.nic} onChange={e => setForm({...form, nic: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                        <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email (Login) *</label>
                        <input required type="email" disabled={isEditing} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${isEditing ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-primary/20 focus:border-primary'}`} />
                      </div>
                      {!isEditing && (
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password *</label>
                          <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                      )}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                        <DatePicker value={form.dob} onChange={val => setForm({...form, dob: val})} placeholder="YYYY-MM-DD" minYear={1950} maxYear={2010} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                        <textarea rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                    </div>
                  </section>

                  {/* Professional Details */}
                  <section>
                    <div className="flex items-center gap-2 text-primary font-bold mb-4 border-b pb-2">
                      <Shield size={18} /> <h3>Professional Qualifications</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">License Number *</label>
                        <input required value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">License Expiry *</label>
                        <DatePicker value={form.licenseExpiry} onChange={val => setForm({...form, licenseExpiry: val})} placeholder="YYYY-MM-DD" minYear={2020} maxYear={2040} />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Experience (Years)</label>
                        <input type="number" min="0" value={form.experienceYears} onChange={e => setForm({...form, experienceYears: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      
                      {/* Qualifications arrays */}
                      <div className="col-span-2 mt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Qualified Vehicle Types *</label>
                        <div className="flex flex-wrap gap-2">
                          {VEHICLE_TYPES.map(vt => (
                            <button type="button" key={vt} onClick={() => toggleArrayItem('vehicleTypes', vt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.vehicleTypes.includes(vt) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'}`}>
                              {vt}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="col-span-2 mt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Allowed Training Levels</label>
                        <div className="flex flex-wrap gap-2">
                          {TRAINING_LEVELS.map(tl => (
                            <button type="button" key={tl.id} onClick={() => toggleArrayItem('trainingLevels', tl.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.trainingLevels.includes(tl.id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
                              {tl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Work Details */}
                  <section>
                    <div className="flex items-center gap-2 text-primary font-bold mb-4 border-b pb-2">
                      <Clock size={18} /> <h3>Working Hours & Rules</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Working Days</label>
                        <div className="flex flex-wrap gap-2">
                          {WORKING_DAYS.map(day => (
                            <button type="button" key={day} onClick={() => toggleArrayItem('workingDays', day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.workingDays.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                              {day.slice(0,3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Shift Start</label>
                        <input type="time" value={form.workingHoursStart} onChange={e => setForm({...form, workingHoursStart: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Shift End</label>
                        <input type="time" value={form.workingHoursEnd} onChange={e => setForm({...form, workingHoursEnd: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Max Students per Batch</label>
                        <input type="number" min="1" max="20" value={form.maxStudentsPerBatch} onChange={e => setForm({...form, maxStudentsPerBatch: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1 flex items-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.status === 'active'} onChange={e => setForm({...form, status: e.target.checked ? 'active' : 'inactive'})} className="w-4 h-4 text-primary rounded focus:ring-primary" />
                          <span className="text-sm font-bold text-gray-700">Account is Active</span>
                        </label>
                      </div>
                    </div>
                  </section>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" form="instructor-form" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Check size={18} />}
                  {isEditing ? 'Save Changes' : 'Create Instructor'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold text-sm z-[60] ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
