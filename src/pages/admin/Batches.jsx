import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, doc, setDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { Users, Truck, Car, Calendar, Plus, X, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    vehicleType: 'Manual',
    instructorId: '',
    studentIds: [],
    startDate: '',
    time: '09:00',
    sessionsCount: 5
  });

  const VEHICLE_TYPES = ['Manual', 'Auto', 'Heavy'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const studQ = query(collection(db, 'users'), where('role', '==', 'student'));
        const studSnap = await getDocs(studQ);
        const allStudents = studSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Only students with approved medical and permit
        const eligible = allStudents.filter(s => s.medical_status === 'approved' && s.permit_status === 'approved');
        setStudents(eligible);

        const instQ = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const instSnap = await getDocs(instQ);
        setInstructors(instSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();

    const batchQ = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(batchQ, (snap) => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const availableInstructors = useMemo(() => {
    return instructors.filter(inst => {
      const types = inst.vehicleTypes || [];
      return types.includes(form.vehicleType) || types.includes('All');
    });
  }, [instructors, form.vehicleType]);

  const toggleStudent = (id) => {
    setForm(prev => {
      const arr = prev.studentIds;
      if (arr.includes(id)) return { ...prev, studentIds: arr.filter(sid => sid !== id) };
      return { ...prev, studentIds: [...arr, id] };
    });
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!form.name || !form.instructorId || form.studentIds.length === 0 || !form.startDate) {
      alert("Please fill all required fields and select at least one student.");
      return;
    }

    setSubmitting(true);
    try {
      const batchId = await generateCustomId('BAT');
      const instructor = instructors.find(i => i.id === form.instructorId);
      
      const newBatch = {
        name: form.name,
        vehicleType: form.vehicleType,
        instructorId: form.instructorId,
        instructorName: instructor?.name || 'Unknown',
        studentIds: form.studentIds,
        startDate: form.startDate,
        time: form.time,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'batches', batchId), newBatch);

      // Auto-schedule sessions
      const start = new Date(form.startDate);
      let daysAdded = 0;
      let currentDate = new Date(start);

      const schedulePromises = [];
      
      while(daysAdded < form.sessionsCount) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          form.studentIds.forEach(studentId => {
            const student = students.find(s => s.id === studentId);
            const schId = `SCH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            schedulePromises.push(
              setDoc(doc(db, 'student_schedules', schId), {
                batchId: batchId,
                date: dateStr,
                time: form.time,
                instructorId: form.instructorId,
                instructorName: instructor?.name || 'Unknown',
                studentId: studentId,
                studentName: student?.name || 'Unknown Student',
                status: 'scheduled',
                type: 'practical',
                vehicle: form.vehicleType
              })
            );
          });
          daysAdded++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      await Promise.all(schedulePromises);

      setShowModal(false);
      setForm({ name: '', vehicleType: 'Manual', instructorId: '', studentIds: [], startDate: '', time: '09:00', sessionsCount: 5 });
      alert("Batch created and schedule generated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error creating batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-500 text-sm mt-1">Group students and auto-generate training schedules.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors">
          <Plus size={18} /> Create Batch
        </button>
      </motion.div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Users size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No batches created yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, i) => (
            <motion.div key={batch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{batch.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{batch.id}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">
                  {batch.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Car size={16} className="text-gray-400" />
                  <span className="font-medium">Vehicle: {batch.vehicleType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-medium">Instructor: {batch.instructorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="font-medium">Starts: {batch.startDate} @ {batch.time}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Enrolled Students ({batch.studentIds?.length || 0})</p>
                <div className="flex flex-wrap gap-1">
                  {batch.studentIds?.slice(0, 3).map(sid => {
                    const stu = students.find(s => s.id === sid);
                    return <span key={sid} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{stu?.name || sid}</span>
                  })}
                  {(batch.studentIds?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">+{batch.studentIds.length - 3} more</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">
              
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Create New Batch</h2>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateBatch} className="space-y-6">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Batch Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. November Intake - Morning" className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Type *</label>
                      <select value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value, instructorId: ''})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Assign Instructor *</label>
                      <select required value={form.instructorId} onChange={e => setForm({...form, instructorId: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="">Select Instructor...</option>
                        {availableInstructors.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name} ({inst.vehicleTypes?.join(', ')})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Start Date *</label>
                      <input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:border-primary" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Time *</label>
                      <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:border-primary" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sessions *</label>
                      <input type="number" min="1" max="20" required value={form.sessionsCount} onChange={e => setForm({...form, sessionsCount: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Select Students ({form.studentIds.length} selected)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Showing only students with approved Medical and L-Permit.</p>
                    
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {students.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">No eligible students found.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {students.map(student => {
                            const isSelected = form.studentIds.includes(student.id);
                            return (
                              <li key={student.id} 
                                onClick={() => toggleStudent(student.id)}
                                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                  {isSelected && <CheckCircle size={14} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{student.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{student.id} &middot; {student.phone}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                      {submitting ? 'Creating...' : 'Create Batch & Schedule'}
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
