import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentPage() {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const outstanding = userProfile?.outstandingFees || 0;

  const [amount, setAmount] = useState(outstanding > 0 ? outstanding : '');
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (method === 'Bank Transfer' && !reference) {
      setError('Please enter the bank transfer reference number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment record
      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid,
        studentName: userProfile?.name || 'Unknown',
        amount: Number(amount),
        method,
        reference: reference || 'N/A',
        status: method === 'Card (Demo)' ? 'paid' : 'pending',
        date: new Date().toISOString(),
        packageId: userProfile?.packageId || 'N/A'
      });

      // Update outstanding fees if paid instantly via demo card
      if (method === 'Card (Demo)') {
        const userRef = doc(db, 'users', currentUser.uid);
        const newOutstanding = Math.max(0, outstanding - Number(amount));
        await updateDoc(userRef, { outstandingFees: newOutstanding });
        setUserProfile({ ...userProfile, outstandingFees: newOutstanding });
      }

      setSuccess(true);
      setTimeout(() => navigate('/student/payment-history'), 2000);
    } catch (err) {
      console.error(err);
      setError('Payment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
        <p className="text-gray-500 mb-6">
          {method === 'Card (Demo)' 
            ? 'Your payment was successful and your balance has been updated.' 
            : 'Your payment details have been submitted and are pending admin verification.'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Make a Payment</h1>
        <p className="text-gray-500 text-sm mt-1">Pay your outstanding course fees.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-primary/5 border border-orange-200 rounded-2xl p-6 text-center">
        <p className="text-primary font-semibold mb-1">Total Outstanding Balance</p>
        <p className="text-4xl font-black text-gray-900">Rs. {outstanding.toLocaleString()}</p>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Payment Amount (Rs.)</label>
          <input type="number" required min="100" max={outstanding > 0 ? outstanding : 100000} value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full text-2xl font-bold px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-all" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Select Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'Bank Transfer', icon: Landmark },
              { id: 'Cash', icon: Wallet },
              { id: 'Card (Demo)', icon: CreditCard }
            ].map(({ id, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setMethod(id)}
                className={`py-4 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all
                  ${method === id ? 'bg-primary/5 border-primary text-primary shadow-sm ring-1 ring-orange-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Icon size={24} />
                <span className="text-xs font-semibold">{id}</span>
              </button>
            ))}
          </div>
        </div>

        {method === 'Bank Transfer' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900 mb-2">Our Bank Details:</p>
              <p>Bank: <span className="font-medium">Commercial Bank</span></p>
              <p>Branch: <span className="font-medium">Kurunegala</span></p>
              <p>Acc Name: <span className="font-medium">Eranga Driving School</span></p>
              <p>Acc No: <span className="font-medium text-gray-900 text-base">8100 2345 6789</span></p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Reference / Receipt Number</label>
              <input type="text" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TRF-123456"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-all" />
            </div>
          </motion.div>
        )}

        {method === 'Card (Demo)' && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p>This is a demo mode. Submitting this will instantly mark the payment as <strong>Paid</strong> and update your outstanding balance without processing real money.</p>
          </div>
        )}

        {method === 'Cash' && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200 flex gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p>You have selected Cash. Please submit this form and hand over the cash to the administration office. Your payment will be marked as pending until verified.</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
            {loading ? 'Processing...' : `Submit Payment of Rs. ${Number(amount || 0).toLocaleString()}`}
          </button>
        </div>

      </motion.form>
    </div>
  );
}
