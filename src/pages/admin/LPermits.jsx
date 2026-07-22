import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { CheckCircle, XCircle, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { sendNotification } from '../../utils/notifications';

export default function LPermits() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState({ isOpen: false, studentId: '', currentNote: '' });
  const [viewedDocs, setViewedDocs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Keep only students who have interacted with the L permit upload (submitted, approved, rejected, pending, no)
      const permitStudents = allStudents.filter(s => s.l_permit_status && s.l_permit_status !== 'not_started');
      
      // Sort by latest submitted first
      permitStudents.sort((a, b) => {
        if (a.l_permit_status === 'submitted' && b.l_permit_status !== 'submitted') return -1;
        if (a.l_permit_status !== 'submitted' && b.l_permit_status === 'submitted') return 1;
        return 0;
      });

      setStudents(permitStudents);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching L Permits:", err);
      setLoading(false);
    });

    // Fetch instructors for auto-assignment
    const instQ = query(collection(db, 'instructors'), where('role', '==', 'instructor'));
    getDocs(instQ).then(snap => {
      setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(err => console.error("Error fetching instructors:", err));

    return () => unsubscribe();
  }, []);

  const handleAction = async (id, newStatus, currentPermitUrl) => {
    if (newStatus === 'approved') {
      if (!currentPermitUrl) {
        alert("Cannot approve: No document has been uploaded yet.");
        return;
      }
      if (!viewedDocs.has(id)) {
        alert("Please view the L-Permit document before approving.");
        return;
      }
      if (!window.confirm(`Are you sure you want to approve this L Permit?`)) return;
    } else {
      if (!window.confirm(`Are you sure you want to reject/delete this L Permit?`)) return;
    }
    
    try {
      const updateData = { 
        l_permit_status: newStatus,
        permit_status: newStatus // update both for backward compatibility
      };
      
      if (newStatus === 'rejected') {
        updateData.permit_url = null; // Clear URL if rejected/deleted
        updateData.l_permit_completed = false;
      }
      
      if (newStatus === 'approved') {
        updateData.l_permit_completed = true;
        updateData.permit_verified_by = currentUser?.uid || 'admin';
        updateData.permit_verified_date = new Date().toISOString();
        
        // Find if student already has an instructor (from the students array)
        const student = students.find(s => s.id === id);
        if (student && !student.assignedInstructorId) {
          const availableInstructors = instructors.filter(inst => inst.autoAssignEnabled !== false);
          if (availableInstructors.length > 0) {
            const randomInst = availableInstructors[Math.floor(Math.random() * availableInstructors.length)];
            updateData.assignedInstructorId = randomInst.id;
            updateData.assignedInstructorName = randomInst.name;
            updateData.practiceStatus = 'assigned';
            
            // Notify the instructor
            await sendNotification({
              userId: randomInst.id,
              title: 'New Student Assigned',
              message: `${student.name || 'A new student'} has been automatically assigned to you.`,
              type: 'info',
              link: '/instructor/students'
            });

            setTimeout(() => {
              alert(`L-Permit Approved! Auto-assigned to instructor: ${randomInst.name}.`);
            }, 500);
          }
        }
      }
      
      await updateDoc(doc(db, 'students', id), updateData);
      
      // Add a notification for the student
      await sendNotification({
        userId: id,
        title: newStatus === 'approved' ? 'L Permit Approved' : 'L Permit Rejected',
        message: newStatus === 'approved' 
          ? 'Your L Permit is approved. You can start training.' 
          : 'Your L Permit was rejected. Please review and re-upload.',
        type: newStatus === 'approved' ? 'success' : 'error',
        link: '/student'
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  const handleSaveNote = async () => {
    try {
      await updateDoc(doc(db, 'students', noteModal.studentId), { l_permit_notes: noteModal.currentNote });
      setNoteModal({ isOpen: false, studentId: '', currentNote: '' });
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Failed to save note.");
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.l_permit_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">L Permit Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve student Learner Permits.</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search by student name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending (Submitted)</option>
            <option value="pending">Needs Upload (Pending)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Package</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Document</th>
                <th className="px-4 py-4">Admin Notes</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    No L permits found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4">
                      <Link to={`/admin/students/${s.id}`} className="font-bold text-blue-600 hover:underline">{s.name || 'Unknown'}</Link>
                      <div className="text-xs text-gray-500">{s.id}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-700">
                      {s.enrolledPackage || 'No Package'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                        ${s.l_permit_status === 'approved' ? 'bg-green-100 text-green-700' : 
                          s.l_permit_status === 'submitted' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}`}>
                        {s.l_permit_status === 'submitted' ? 'Waiting Approval' : s.l_permit_status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {s.permit_url === 'pending-upload' || s.permit_url?.includes('placehold.co') ? (
                        <button 
                           onClick={() => { setViewedDocs(prev => new Set(prev).add(s.id)); alert("This is a Mock Upload (No real file was attached)."); }}
                           className="flex items-center gap-1 text-primary hover:text-orange-600 font-semibold text-xs bg-primary/10 px-3 py-1.5 rounded-lg w-max transition-colors">
                          <ExternalLink size={14} /> View File (Mock)
                        </button>
                      ) : s.permit_url ? (
                        <button 
                           onClick={() => {
                             setViewedDocs(prev => new Set(prev).add(s.id));
                             if (s.permit_url.startsWith('data:')) {
                               const win = window.open();
                               if (win) {
                                 win.document.write(`<html><body style="margin:0; display:flex; justify-content:center; align-items:center; background:#f0f0f0; min-height:100vh;"><img src="${s.permit_url}" style="max-width:100%; max-height:100vh; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></body></html>`);
                               } else {
                                 alert("Please allow popups to view the document.");
                               }
                             } else {
                               window.open(s.permit_url, '_blank');
                             }
                           }}
                           className="flex items-center gap-1 text-primary hover:text-orange-600 font-semibold text-xs bg-primary/10 px-3 py-1.5 rounded-lg w-max transition-colors">
                          <ExternalLink size={14} /> View File
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-4 max-w-[200px] truncate text-gray-600 text-xs">
                      {s.l_permit_notes || <span className="text-gray-400 italic">No notes</span>}
                    </td>
                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => setNoteModal({ isOpen: true, studentId: s.id, currentNote: s.l_permit_notes || '' })}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Add/Edit Notes"
                      >
                        <MessageSquare size={16} />
                      </button>
                      
                      {s.l_permit_status !== 'approved' && (
                        <button 
                          onClick={() => handleAction(s.id, 'approved', s.permit_url)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.permit_url && viewedDocs.has(s.id)
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-gray-400 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                          title={!s.permit_url ? 'No document to approve' : !viewedDocs.has(s.id) ? 'View document first' : 'Approve'}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      
                      {s.l_permit_status !== 'rejected' && (
                        <button 
                          onClick={() => handleAction(s.id, 'rejected', s.permit_url)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Reject / Delete"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Notes Modal */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Notes</h2>
            <p className="text-sm text-gray-500 mb-4">Add a note regarding this L Permit. This can be used to inform the student why it was rejected.</p>
            <textarea 
              value={noteModal.currentNote}
              onChange={(e) => setNoteModal(prev => ({ ...prev, currentNote: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4 resize-none"
              placeholder="e.g., Image is too blurry, please re-upload."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setNoteModal({ isOpen: false, studentId: '', currentNote: '' })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
