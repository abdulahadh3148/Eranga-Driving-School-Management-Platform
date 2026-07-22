import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const SKILLS_LIST = [
  'Steering',
  'Reverse Parking',
  'Traffic Signs',
  'Clutch Control',
  'Parallel Parking',
  'Road Courtesy'
];

export default function BookedSlots() {
  const { currentUser, userProfile } = useAuth();
  const instructorId = userProfile?.id || userProfile?.uid || currentUser?.uid;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [completingSlot, setCompletingSlot] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!instructorId) return;

    // Query sessions where status is "scheduled" or "pending" and instructor is current instructor
    // Firestore 'in' query allows up to 10 values
    const q = query(
      collection(db, 'sessions'),
      where('status', 'in', ['scheduled', 'pending']),
      where('instructorId', '==', instructorId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by Start Time
      data.sort((a, b) => {
        const timeA = a.startTime || '';
        const timeB = b.startTime || '';
        return timeA.localeCompare(timeB);
      });

      setSlots(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading booked slots:", err);
      setError("Failed to load booked classes.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (slot) => {
    setCompletingSlot(slot);
    setSelectedSkills([]);
  };

  const handleToggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmitComplete = async (e) => {
    e.preventDefault();
    if (!completingSlot) return;

    setSubmitting(true);
    try {
      const slotRef = doc(db, 'sessions', completingSlot.id);
      await updateDoc(slotRef, {
        status: 'completed',
        completedSkills: selectedSkills,
        completedAt: new Date().toISOString()
      });

      alert("🎉 Class marked as completed successfully!");
      setCompletingSlot(null);
    } catch (err) {
      console.error("Error updating slot status:", err);
      alert("Failed to update class. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (slot, newStatus) => {
    try {
      const slotRef = doc(db, 'sessions', slot.id);
      await updateDoc(slotRef, { status: newStatus });
      
      const { sendNotification } = await import('../../utils/notifications');
      await sendNotification({
        userId: slot.studentId,
        title: `Session ${newStatus === 'scheduled' ? 'Accepted' : 'Rejected'}`,
        message: `Your driving session on ${slot.date} has been ${newStatus === 'scheduled' ? 'accepted' : 'rejected'} by your instructor.`,
        type: newStatus === 'scheduled' ? 'success' : 'warning',
        link: '/student'
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-blue-600 text-2xl">event_upcoming</span>
        <div>
          <h2 className="font-black text-gray-900 text-lg">My Booked Driving Slots ({userProfile?.name?.split(' ')[0] || 'Instructor'})</h2>
          <p className="text-gray-500 text-xs mt-0.5">Assigned hourly driving classes booked by students</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="py-4 text-center text-red-500 text-sm font-semibold">{error}</div>
      ) : slots.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No booked classes found for you.
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time Range</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Vehicle Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{slot.date}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {slot.timeSlot || slot.time || `${slot.startTime || ''} - ${slot.endTime || ''}`}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-bold">
                    {slot.student_name || slot.studentName || 'Student'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase border border-blue-100">
                      {slot.vehicleType || slot.vehicle_type || slot.vehicle || 'Any'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase ${
                      slot.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {slot.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {slot.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(slot, 'scheduled')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(slot, 'cancelled')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenModal(slot)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                        Complete Class
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Completion Modal */}
      {completingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setCompletingSlot(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-600">task_alt</span>
              Complete Driving Class
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Select the practical skills practiced by <strong>{completingSlot.student_name || completingSlot.studentName || 'Student'}</strong> during this session.
            </p>

            <form onSubmit={handleSubmitComplete} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {SKILLS_LIST.map((skill) => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <label 
                      key={skill} 
                      className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-green-500 bg-green-50/50 font-bold text-green-800' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSkill(skill)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-xs">{skill}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCompletingSlot(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
