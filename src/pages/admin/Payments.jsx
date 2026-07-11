import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { CheckCircle, XCircle, Search, User, FileText, Filter, Plus, ChevronRight, X, DollarSign, Wallet } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
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

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return payments.filter(p => p.studentId === selectedStudent.id);
  }, [selectedStudent, payments]);

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
      
      const newBalance = Math.max(0, (selectedStudent.outstandingFees || selectedStudent.total_price || 0) - amount);

      const payId = `PAY-${Date.now()}`;
      await setDoc(doc(db, 'payments', payId), {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        amount,
        method: newPayment.method,
        reference: newPayment.reference,
        payment_date: new Date().toISOString(),
        status: 'paid'
      });

      await updateDoc(doc(db, 'users', selectedStudent.id), {
        outstandingFees: newBalance
      });

      setShowLogPayment(false);
      setNewPayment({ amount: '', method: 'cash', reference: '' });
      setSelectedStudent(prev => ({...prev, outstandingFees: newBalance}));
    } catch (err) {
      console.error(err);
      alert('Failed to log payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
      
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
                className={`w-full text-left p-3 mb-2 rounded-xl border transition-colors flex items-center justify-between ${
                  selectedStudent?.id === s.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">ID: {s.id}</div>
                </div>
                {s.outstandingFees > 0 ? (
                  <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg">Due: Rs.{s.outstandingFees}</span>
                ) : (
                  <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg">Settled</span>
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
                <p className="text-sm text-gray-500">{selectedStudent.enrolledPackage || 'No Package Selected'}</p>
              </div>
              <button onClick={() => setShowLogPayment(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-orange-600 transition-colors shadow-sm">
                <Plus size={18} /> Record Payment
              </button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4 border-b border-gray-100">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                 <p className="text-xs text-gray-500 font-bold uppercase">Total Course Fee</p>
                 <p className="text-xl font-black text-gray-900 mt-1">Rs. {selectedStudent.total_price || 0}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                 <p className="text-xs text-green-700 font-bold uppercase">Total Paid</p>
                 <p className="text-xl font-black text-green-700 mt-1">Rs. {(selectedStudent.total_price || 0) - (selectedStudent.outstandingFees || 0)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                 <p className="text-xs text-red-700 font-bold uppercase">Balance Due</p>
                 <p className="text-xl font-black text-red-700 mt-1">Rs. {selectedStudent.outstandingFees || 0}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-gray-900 mb-4">Payment History</h3>
              {studentPayments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Wallet size={32} className="mx-auto mb-3 opacity-20" />
                  <p>No payments recorded for this student.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentPayments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Rs. {p.amount}</p>
                          <p className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString()} &bull; {p.method}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase">Paid</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <User size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">No Student Selected</p>
            <p className="text-sm mt-1">Select a student from the list to view and manage payments.</p>
          </div>
        )}
      </div>

      {/* Log Payment Modal */}
      <AnimatePresence>
        {showLogPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
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
