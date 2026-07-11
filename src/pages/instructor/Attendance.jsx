import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, CheckCircle, Clock, XCircle, Save } from 'lucide-react';
import { generateCustomId } from '../../utils/idGenerator';

export default function InstructorAttendance() {
  const { userProfile } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!userProfile?.id) return;
      try {
        const q = query(collection(db, 'batches'), where('instructorId', '==', userProfile.id));
        const snap = await getDocs(q);
        setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching batches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [userProfile]);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!selectedBatch) {
        setStudents([]);
        setAttendance({});
        return;
      }

      setLoading(true);
      try {
        const batch = batches.find(b => b.id === selectedBatch);
        if (batch && batch.studentIds && batch.studentIds.length > 0) {
          // Fetch student details
          const stPromises = batch.studentIds.map(id => getDocs(query(collection(db, 'users'), where('__name__', '==', id))));
          const stSnaps = await Promise.all(stPromises);
          const stData = stSnaps.map(snap => snap.docs[0]).filter(Boolean).map(d => ({ id: d.id, ...d.data() }));
          setStudents(stData);

          // Fetch existing attendance for this batch & date
          const attQ = query(
            collection(db, 'attendance'), 
            where('batch_id', '==', selectedBatch),
            where('date', '==', date)
          );
          const attSnap = await getDocs(attQ);
          const existingAtt = {};
          
          // Default all to present if no existing record
          stData.forEach(s => {
            existingAtt[s.id] = 'present';
          });

          attSnap.forEach(d => {
            const data = d.data();
            existingAtt[data.student_id] = data.status;
          });

          setAttendance(existingAtt);
        } else {
          setStudents([]);
          setAttendance({});
        }
      } catch (err) {
        console.error("Error fetching batch students", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [selectedBatch, date, batches]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const promises = students.map(async (student) => {
        // Create deterministic ID based on batch, date, student to easily update
        const recordId = `${selectedBatch}_${date}_${student.id}`;
        return setDoc(doc(db, 'attendance', recordId), {
          student_id: student.id,
          student_name: student.name,
          batch_id: selectedBatch,
          instructor_id: userProfile.id,
          date: date,
          status: attendance[student.id] || 'present',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-20 px-4 md:px-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Record daily attendance for your assigned batches.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Batch</label>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm">
            <option value="">-- Choose Batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.vehicleType})</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm" />
        </div>
      </motion.div>

      {selectedBatch && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-primary"/> Students ({students.length})
            </h2>
          </div>

          {loading ? (
             <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No students found in this batch.</div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4 text-center">Present</th>
                      <th className="px-6 py-4 text-center">Late</th>
                      <th className="px-6 py-4 text-center">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(student => {
                      const stat = attendance[student.id] || 'present';
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.id}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="radio" name={`att_${student.id}`} checked={stat === 'present'} onChange={() => handleStatusChange(student.id, 'present')} className="w-5 h-5 text-green-500 cursor-pointer" />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="radio" name={`att_${student.id}`} checked={stat === 'late'} onChange={() => handleStatusChange(student.id, 'late')} className="w-5 h-5 text-yellow-500 cursor-pointer" />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="radio" name={`att_${student.id}`} checked={stat === 'absent'} onChange={() => handleStatusChange(student.id, 'absent')} className="w-5 h-5 text-red-500 cursor-pointer" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Attendance</>}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
