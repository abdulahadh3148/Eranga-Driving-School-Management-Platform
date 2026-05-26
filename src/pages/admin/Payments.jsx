import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc, getDocs, where } from 'firebase/firestore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [cashStudentId, setCashStudentId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashSubmitting, setCashSubmitting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();

    const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogCashPayment = async (e) => {
    e.preventDefault();
    if (!cashStudentId || !cashAmount) return;
    setCashSubmitting(true);
    try {
      const student = students.find(s => s.id === cashStudentId);
      const payAmt = Number(cashAmount);
      
      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        studentName: student.name,
        amount: payAmt,
        method: 'cash',
        status: 'paid',
        date: new Date().toISOString()
      });

      const studentRef = doc(db, 'users', student.id);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const currentFees = studentSnap.data().outstandingFees || 0;
        const newFees = Math.max(0, currentFees - payAmt);
        await updateDoc(studentRef, { outstandingFees: newFees });
      }

      setCashStudentId('');
      setCashAmount('');
      alert("Manual cash payment logged successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to log cash payment");
    } finally {
      setCashSubmitting(false);
    }
  };

  const handleVerify = async (id, payment) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status: 'paid' });
      if (payment && payment.studentId && payment.amount) {
        const studentRef = doc(db, 'users', payment.studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const currentFees = studentSnap.data().outstandingFees || 0;
          const newFees = Math.max(0, currentFees - Number(payment.amount));
          await updateDoc(studentRef, { outstandingFees: newFees });
        }

        // Create verification notification
        await addDoc(collection(db, 'notifications'), {
          userId: payment.studentId,
          studentId: payment.studentId,
          title: 'Payment Verified',
          message: `Your payment of Rs. ${Number(payment.amount).toLocaleString()} has been verified and approved.`,
          body: `Your payment of Rs. ${Number(payment.amount).toLocaleString()} has been verified and approved.`,
          type: 'payment',
          icon: '💳',
          isRead: false,
          unread: true,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id, payment) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status: 'failed' });
      if (payment && payment.studentId) {
        // Create rejection notification
        await addDoc(collection(db, 'notifications'), {
          userId: payment.studentId,
          studentId: payment.studentId,
          title: 'Payment Failed',
          message: `Your payment of Rs. ${Number(payment.amount).toLocaleString()} failed verification. Please review or re-submit.`,
          body: `Your payment of Rs. ${Number(payment.amount).toLocaleString()} failed verification. Please review or re-submit.`,
          type: 'alert',
          icon: '⚠️',
          isRead: false,
          unread: true,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Review and verify student payments.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Log Physical Cash Payment</h2>
        <form onSubmit={handleLogCashPayment} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Student</label>
            <select value={cashStudentId} onChange={(e) => setCashStudentId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" required>
              <option value="">-- Choose a student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (Rs.)</label>
            <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" placeholder="0" required />
          </div>
          <button type="submit" disabled={cashSubmitting} className="px-6 py-2 bg-primary/90 hover:bg-primary text-white font-bold rounded-xl text-sm transition-colors h-[38px]">
            {cashSubmitting ? 'Logging...' : 'Log Payment'}
          </button>
        </form>
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
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method & Ref</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{p.studentName || 'Unknown'}</td>
                    <td className="px-6 py-4 font-black text-gray-900">Rs. {Number(p.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 capitalize">{p.method.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 font-mono">{p.reference || 'N/A'}</div>
                      {p.receiptUrl && (
                        <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold mt-1 inline-block hover:underline">
                          View Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {p.status === 'pending' ? (
                        <>
                          <button onClick={() => handleVerify(p.id, p)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Verify">
                            <CheckCircle size={18}/>
                          </button>
                           <button onClick={() => handleReject(p.id, p)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Reject">
                            <XCircle size={18}/>
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
