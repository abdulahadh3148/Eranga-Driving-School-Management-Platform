import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CreditCard, Banknote, QrCode, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  
  // Destructure checkout context passed from Booking or Enroll pages
  // e.g., { type: 'lesson' | 'package', fee: 1000, referenceId: '...', title: '...', payload: {} }
  const checkoutData = state || null;

  const [paymentMethod, setPaymentMethod] = useState('lankaqr');
  const [referenceNote, setReferenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // If someone directly navigated here without data, send them back
  if (!checkoutData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 mb-4">No active checkout session found.</p>
        <button onClick={() => navigate('/student')} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Go Home</button>
      </div>
    );
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'bank_transfer' && !referenceNote.trim()) {
      alert("Please enter a reference number for the bank transfer.");
      return;
    }

    setSubmitting(true);
    
    try {
      let documentRefId = null;

      // 1. Create the pending entity based on type
      if (checkoutData.type === 'package') {
        const docRef = await addDoc(collection(db, 'student_packages'), {
          ...checkoutData.payload,
          payment_status: 'pending_approval' // Needs admin approval to become active
        });
        documentRefId = docRef.id;
        
        // Add outstanding fee to user profile
        await updateDoc(doc(db, 'students', userProfile.id), {
           packageId: checkoutData.payload.package_id,
           packageName: checkoutData.payload.package_name,
           categoryId: checkoutData.payload.category_id,
           outstandingFees: (userProfile?.outstandingFees || 0) + checkoutData.payload.price
        });
      } 
      else if (checkoutData.type === 'lesson') {
        const docRef = await addDoc(collection(db, 'training_slots'), {
          ...checkoutData.payload,
          status: 'pending_payment_approval' // Needs admin approval to block calendar
        });
        documentRefId = docRef.id;
      }

      // 2. Create the pending payment record
      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid,
        studentName: userProfile?.name || 'Student',
        amount: checkoutData.fee,
        type: checkoutData.type, // 'package' or 'lesson'
        method: paymentMethod,
        reference_note: referenceNote,
        documentRefId: documentRefId, // Links back to the package or slot
        status: 'pending_approval',
        payment_date: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/student'), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to process checkout. Please try again.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
        <p className="text-gray-500 mb-6">Your payment details have been sent to the admin for verification. You will be notified once approved.</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Left: Payment Method Selection */}
      <div className="flex-1">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 font-bold mb-4 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

        <div className="space-y-4">
          {/* LANKAQR */}
          <div 
            onClick={() => setPaymentMethod('lankaqr')}
            className={`cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all
              ${paymentMethod === 'lankaqr' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${paymentMethod === 'lankaqr' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">LANKAQR</h3>
              <p className="text-sm text-gray-500">Scan and pay instantly using any local mobile banking app.</p>
            </div>
            {paymentMethod === 'lankaqr' && <CheckCircle2 className="ml-auto text-primary" size={24} />}
          </div>

          {/* Bank Transfer (CEFTS) */}
          <div 
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all
              ${paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${paymentMethod === 'bank_transfer' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Bank Transfer (CEFTS)</h3>
              <p className="text-sm text-gray-500">Directly transfer to our Bank of Ceylon account.</p>
            </div>
            {paymentMethod === 'bank_transfer' && <CheckCircle2 className="ml-auto text-primary" size={24} />}
          </div>

          {/* Cash */}
          <div 
            onClick={() => setPaymentMethod('cash')}
            className={`cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all
              ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${paymentMethod === 'cash' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Banknote size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Cash Payment</h3>
              <p className="text-sm text-gray-500">Pay physically at the driving school office.</p>
            </div>
            {paymentMethod === 'cash' && <CheckCircle2 className="ml-auto text-primary" size={24} />}
          </div>
        </div>

        {/* Payment Details based on selection */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={paymentMethod}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            {paymentMethod === 'lankaqr' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Scan to Pay</p>
                <div className="w-48 h-48 mx-auto bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-dashed border-gray-300">
                  <QrCode size={64} className="text-gray-300" />
                  {/* Dummy LANKAQR placeholder */}
                </div>
                <p className="text-sm text-gray-500">Scan this QR code using your banking app (BOC, ComBank, Peoples, etc). Enter the exact amount of <strong>Rs. {Number(checkoutData.fee).toLocaleString()}</strong>.</p>
                <div className="mt-4 text-left">
                   <label className="block text-xs font-bold text-gray-700 mb-1">Enter Transaction Reference / Auth Code</label>
                   <input type="text" value={referenceNote} onChange={e => setReferenceNote(e.target.value)} placeholder="e.g. 12345678" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
                </div>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2 border-gray-100">Bank Details</p>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span className="font-bold text-gray-900">Bank of Ceylon (BOC)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Branch</span><span className="font-bold text-gray-900">Colombo City Branch</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account Name</span><span className="font-bold text-gray-900">Eranga Driving School</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account Number</span><span className="font-bold text-primary text-lg tracking-wider">000 1234 5678</span></div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Enter Bank Reference Number <span className="text-red-500">*</span></label>
                   <input type="text" value={referenceNote} onChange={e => setReferenceNote(e.target.value)} required placeholder="e.g. FT2024..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start gap-4">
                <Shield className="text-orange-500 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-orange-900 mb-1 text-lg">Pay at Office</h4>
                  <p className="text-sm text-orange-800 leading-relaxed">By submitting this, your request will be recorded. Please visit our main office within 24 hours to pay the cash advance and confirm your booking. Your request will remain pending until payment is received.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right: Summary panel */}
      <div className="md:w-[350px]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-24 overflow-hidden">
          <div className="bg-gray-50 p-5 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Order Summary</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Item</p>
              <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{checkoutData.title}</p>
              {checkoutData.type === 'package' && (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">30% Advance Payment for Enrollment.</p>
              )}
              {checkoutData.type === 'lesson' && (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">Fixed advance fee to lock your session.</p>
              )}
            </div>
            
            <div className="pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-500">Total to Pay</span>
                <span className="text-2xl font-black text-primary">Rs. {Number(checkoutData.fee).toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={submitting || (paymentMethod === 'bank_transfer' && !referenceNote.trim())}
              className="w-full mt-4 py-3.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Submit Payment Request'}
            </button>
            <p className="text-xs text-center text-gray-400 font-medium">
              Payments are verified manually by admin within 2 hours.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
