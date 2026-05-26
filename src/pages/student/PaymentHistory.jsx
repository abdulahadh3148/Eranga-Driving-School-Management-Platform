import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export default function PaymentHistory() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'payments'), where('studentId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 text-sm mt-1">View your past transactions and receipts.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Paid</p>
          <p className="text-2xl font-black text-green-600">Rs. {totalPaid.toLocaleString()}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="text-gray-200 mx-auto mb-4" />
            <p>No payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">Date</th>
                  <th className="px-6 py-4 border-b border-gray-100">Amount</th>
                  <th className="px-6 py-4 border-b border-gray-100">Method</th>
                  <th className="px-6 py-4 border-b border-gray-100">Reference</th>
                  <th className="px-6 py-4 border-b border-gray-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">Rs. {Number(payment.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">{payment.reference || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${getStatusStyle(payment.status)}`}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
