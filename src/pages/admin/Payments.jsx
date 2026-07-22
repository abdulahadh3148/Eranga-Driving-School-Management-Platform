import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { CheckCircle, XCircle, Search, User, FileText, Filter, Plus, ChevronRight, X, DollarSign, Wallet, Check, AlertCircle, History, CreditCard } from 'lucide-react';
import { sendNotification } from '../../utils/notifications';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'history'

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showLogPayment, setShowLogPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    method: 'cash',
    reference: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'students'));
        const unsub = onSnapshot(q, (snap) => {
           setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
      } catch (err) { console.error(err); }
    };
    fetchStudents();

    const q = query(collection(db, 'payments'), orderBy('payment_date', 'desc'));
    const unsubPay = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubPay();
  }, []);

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'pending_approval');
  }, [payments]);

  const enrichedStudents = useMemo(() => {
    return students.map(s => {
      const studentPays = payments.filter(p => p.studentId === s.id && p.status === 'approved');
      const totalPaidAmount = studentPays.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalCourseFee = s.total_price || 0;
      const computedBalance = Math.max(0, totalCourseFee - totalPaidAmount);
      return { ...s, dynamicallyCalculatedOutstandingFees: computedBalance, totalPaidAmount };
    });
  }, [students, payments]);

  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrichedStudents, searchTerm]);

  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return payments.filter(p => p.studentId === selectedStudent.id && p.status !== 'pending_approval');
  }, [selectedStudent, payments]);

  // Handle Approving a pending payment
  const handleApprovePayment = async (payment) => {
    if (!window.confirm(`Approve Rs. ${payment.amount} payment for ${payment.studentName}?`)) return;

    try {
      // 1. Update Payment Status
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved' });

      // 2. Activate the linked document (Package or Lesson)
      if (payment.documentRefId) {
        if (payment.type === 'package') {
          await updateDoc(doc(db, 'student_packages', payment.documentRefId), { payment_status: 'paid' });
        } else if (payment.type === 'lesson') {
          await updateDoc(doc(db, 'bookings', payment.documentRefId), { status: 'pending' }); // pending instructor confirmation, but payment is cleared
        }
      }

      // 3. Deduct from Outstanding Fees and Recalculate Payment Status
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
        const currentOutstanding = student.outstandingFees !== undefined ? student.outstandingFees : (student.total_price || 0);
        const newBalance = Math.max(0, currentOutstanding - Number(payment.amount));
        const totalPaid = (student.total_price || 0) - newBalance;
        
        let newPaymentStatus = 'unpaid';
        if (newBalance <= 0) {
          newPaymentStatus = 'paid_in_full';
        } else if (totalPaid > 0) {
          newPaymentStatus = 'partial_paid';
        }

        await updateDoc(doc(db, 'students', payment.studentId), {
           outstandingFees: newBalance,
           paymentStatus: newPaymentStatus,
           lastPaymentDate: new Date().toISOString()
        });
      }

      // 4. Send notification to student
      await sendNotification({
        userId: payment.studentId,
        title: 'Payment Approved',
        message: `Your payment of Rs. ${payment.amount} has been approved.`,
        type: 'success',
        link: '/student/payment'
      });

    } catch (err) {
      console.error(err);
      alert('Failed to approve payment.');
    }
  };

  // Handle Rejecting a pending payment with Note
  const handleRejectPayment = async (payment) => {
    const rejectionNote = window.prompt("Enter rejection reason (e.g. Blurry receipt):", "Please check your upload");
    if (rejectionNote === null) return; // user cancelled prompt

    try {
      await updateDoc(doc(db, 'payments', payment.id), { 
        status: 'rejected',
        adminNotes: rejectionNote
      });
      
      if (payment.documentRefId) {
        if (payment.type === 'package') {
          await updateDoc(doc(db, 'student_packages', payment.documentRefId), { payment_status: 'failed' });
        } else if (payment.type === 'lesson') {
          await updateDoc(doc(db, 'bookings', payment.documentRefId), { status: 'cancelled' });
        }
      }

      // Send notification to student with reason
      await sendNotification({
        userId: payment.studentId,
        title: 'Payment Rejected',
        message: `Your payment of Rs. ${payment.amount} was rejected: ${rejectionNote}`,
        type: 'error',
        link: '/student/payment'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to reject payment.');
    }
  };


  const handleLogPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !newPayment.amount) return;

    setSubmitting(true);
    try {
      const amount = Number(newPayment.amount);
      if (amount <= 0) {
        alert("Payment amount must be greater than zero.");
        setSubmitting(false);
        return;
      }
      
      const currentOutstanding = selectedStudent.outstandingFees !== undefined ? selectedStudent.outstandingFees : (selectedStudent.total_price || 0);
      const newBalance = Math.max(0, currentOutstanding - amount);
      const totalPaid = (selectedStudent.total_price || 0) - newBalance;
      
      let newPaymentStatus = 'unpaid';
      if (newBalance <= 0) {
        newPaymentStatus = 'paid_in_full';
      } else if (totalPaid > 0) {
        newPaymentStatus = 'partial_paid';
      }

      const payId = `PAY-${Date.now()}`;
      await setDoc(doc(db, 'payments', payId), {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        amount,
        method: newPayment.method,
        reference_note: newPayment.reference,
        payment_date: new Date().toISOString(),
        status: 'approved',
        type: 'manual'
      });

      await updateDoc(doc(db, 'students', selectedStudent.id), {
        outstandingFees: newBalance,
        paymentStatus: newPaymentStatus,
        lastPaymentDate: new Date().toISOString()
      });

      // Send notification to student
      await sendNotification({
        userId: selectedStudent.id,
        title: 'Payment Recorded',
        message: `An offline payment of Rs. ${amount} was recorded on your account.`,
        type: 'info',
        link: '/student/payment'
      });

      setShowLogPayment(false);
      setNewPayment({ amount: '', method: 'cash', reference: '' });
      setSelectedStudent(prev => ({
        ...prev, 
        outstandingFees: newBalance, 
        dynamicallyCalculatedOutstandingFees: newBalance, 
        totalPaidAmount: (prev.totalPaidAmount || 0) + amount 
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to log payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      
      {/* Tabs */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
        >
          Pending Approvals 
          {pendingPayments.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingPayments.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
        >
          Payment History & Settlement
        </button>
      </div>

      {activeTab === 'approvals' ? (
        // --- Approvals Tab ---
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Digital Payments Awaiting Approval</h2>
            <p className="text-sm text-gray-500">Verify bank transfers and QR payments before unlocking services.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : pendingPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <CheckCircle size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold text-gray-500">All Caught Up</p>
                <p className="text-sm">No pending payments to approve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map(payment => (
                  <div key={payment.id} className="flex flex-col md:flex-row items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{payment.studentName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md uppercase">{payment.type}</span>
                          <span className="text-xs font-bold text-gray-500">{payment.method}</span>
                          <span className="text-xs text-gray-400">{new Date(payment.payment_date).toLocaleString()}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(payment.reference || payment.reference_note) && (
                            <div className="text-sm bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-100 inline-block font-mono">
                              Ref: {payment.reference || payment.reference_note}
                            </div>
                          )}
                          {payment.receiptUrl && (
                            <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-sm bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-100 inline-flex items-center gap-1 font-semibold hover:bg-blue-100 transition-colors">
                              <FileText size={14} /> View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">Amount Paid</p>
                        <p className="text-2xl font-black text-gray-900">Rs. {Number(payment.amount).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprovePayment(payment)} className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-colors" title="Approve">
                          <Check size={20} />
                        </button>
                        <button onClick={() => handleRejectPayment(payment)} className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-colors" title="Reject">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // --- History & Settlement Tab ---
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Left Sidebar: Students List */}
          <div className="w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Select Student</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                 <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : filteredStudents.length === 0 ? (
                 <div className="p-8 text-center text-gray-400 text-sm">No students found.</div>
              ) : (
                filteredStudents.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left p-3 mb-2 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                      selectedStudent?.id === s.id 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary shadow-sm transform scale-[1.02]' 
                        : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${
                        selectedStudent?.id === s.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-bold ${selectedStudent?.id === s.id ? 'text-primary' : 'text-gray-900'}`}>{s.name}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {s.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                    {s.dynamicallyCalculatedOutstandingFees > 0 ? (
                      <span className="text-red-600 font-bold text-[10px] uppercase tracking-wider bg-red-50 px-2 py-1 rounded-md border border-red-100 shadow-sm">
                        Due: Rs.{s.dynamicallyCalculatedOutstandingFees}
                      </span>
                    ) : (
                      <span className="text-green-600 font-bold text-[10px] uppercase tracking-wider bg-green-50 px-2 py-1 rounded-md border border-green-100 shadow-sm">
                        Settled
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Payment Details */}
          <div className="w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
            {selectedStudent ? (
              <>
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h1>
                    <p className="text-sm text-gray-500">{selectedStudent.packageName || selectedStudent.enrolledPackage || 'No Package Selected'}</p>
                  </div>
                  <button onClick={() => setShowLogPayment(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-orange-600 transition-colors shadow-sm">
                    <Plus size={18} /> Record Payment
                  </button>
                </div>

                <div className="p-6 grid grid-cols-3 gap-5 border-b border-gray-100 bg-white">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute -right-4 -top-4 w-16 h-16 bg-gray-200/50 rounded-full blur-xl group-hover:bg-gray-300/50 transition-colors"></div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Course Fee</p>
                     <p className="text-2xl font-black text-gray-900">Rs. {selectedStudent.total_price || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl p-5 border border-green-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-200/50 rounded-full blur-xl group-hover:bg-green-300/50 transition-colors"></div>
                     <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                     <p className="text-2xl font-black text-green-700">Rs. {selectedStudent.totalPaidAmount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-orange-50/30 rounded-2xl p-5 border border-red-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-200/50 rounded-full blur-xl group-hover:bg-red-300/50 transition-colors"></div>
                     <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-1">Balance Due</p>
                     <p className="text-2xl font-black text-red-700">Rs. {selectedStudent.dynamicallyCalculatedOutstandingFees}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <History size={18} className="text-gray-400" /> Transaction History
                  </h3>
                  {studentPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                        <Wallet size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No settled payments yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Record a payment to see it here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                      {studentPayments.map(p => (
                        <div key={p.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {p.status === 'approved' ? <DollarSign size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${p.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {p.status}
                              </span>
                              <span className="text-xs font-mono text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</span>
                            </div>
                            <p className="font-black text-gray-900 text-lg">Rs. {p.amount}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CreditCard size={12} /> {p.method} {p.reference_note ? `• Ref: ${p.reference_note}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 bg-gradient-to-b from-transparent to-gray-50/50">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                  <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center relative z-10">
                    <User size={40} className="text-gray-300" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">No Student Selected</p>
                <p className="text-sm mt-2 text-center max-w-sm">Select a student from the sidebar to view their payment history, balances, and record new transactions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      <AnimatePresence>
        {showLogPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Record Offline Payment</h2>
                <button onClick={() => setShowLogPayment(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleLogPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (Rs.)</label>
                  <input type="number" required min="1" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                  <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reference Note (Optional)</label>
                  <input type="text" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} 
                    placeholder="e.g. Receipt No, Cheque No"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
                </div>
                <button type="submit" disabled={submitting} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                  {submitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
