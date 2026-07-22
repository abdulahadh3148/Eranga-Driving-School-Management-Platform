import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle, CheckCircle2, Shield, X, ChevronDown, Car, ChevronLeft
} from 'lucide-react';
import { getPackageById, getCategoryById } from '../../data/packages';

// ── Theme ────────────────────────────────────────────────────────────────────
const CAT_THEME = {
  lv: { gradient: 'from-blue-500 to-blue-700', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  hv: { gradient: 'from-violet-500 to-violet-700', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
};

// ── Full Terms Text ──────────────────────────────────────────────────────────
const TERMS_TEXT = `DRIVING SCHOOL TRAINING TERMS & CONDITIONS
Eranga Driving School · Sri Lanka · Valid from 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ENROLLMENT & ELIGIBILITY
   • Students must be 18 years or older for car/van/heavy vehicle training.
   • Students 16+ may enrol in motorbike and three-wheeler training with guardian written consent.
   • Enrollment is confirmed only upon payment of the full package fee or approved instalment plan.
   • A valid National Identity Card (NIC) or passport must be provided at enrollment.

2. PACKAGE SELECTION & VEHICLE
   • Each student may hold only ONE active training package at any time.
   • The vehicle combinations selected during enrollment are fixed for the duration of the package.
   • To change training type, the current package must be completed or formally terminated.
   • Package fees are non-refundable once the first session has been conducted.

3. ATTENDANCE & PUNCTUALITY
   • Students must attend all scheduled sessions on time.
   • Lateness of more than 15 minutes will result in the session being recorded as a half-session.
   • Two or more unexcused absences may result in rescheduling fees of Rs. 500 per session.
   • Sessions cancelled less than 24 hours in advance are counted as used against the package.

4. CONDUCT & SAFETY
   • Students must follow all instructor instructions at all times during training.
   • Driving under the influence of alcohol, drugs, or any intoxicant is STRICTLY PROHIBITED.
   • Reckless or dangerous driving during training will result in immediate session termination.
   • Deliberate damage to school vehicles is the student's full financial responsibility.
   • Mobile phone use while behind the wheel is prohibited.

5. SCHEDULING
   • Session scheduling is subject to instructor and vehicle availability.
   • The school reserves the right to assign or reassign instructors as needed.
   • Students may request a preferred instructor, but this is not guaranteed.

6. PAYMENT TERMS
   • Package fees must be settled in full before the first session.
   • Instalment plans (50% upfront, balance before 6th session) are available upon written request.
   • Outstanding fees may result in suspension of training sessions.

7. PACKAGE DURATION
   • Students must complete all sessions within the package duration period.
   • Extension requests must be submitted in writing at least 3 working days before expiry.
   • Extensions beyond 14 days are subject to an administration fee of Rs. 1,000.

8. LICENSE & DMT SUPPORT
   • The school provides guidance for DMT documentation, but does not guarantee exam pass results.
   • Trial test and theory sessions are advisory only and do not replace official DMT testing.
   • Students are responsible for booking and attending their own DMT road test appointments.

9. PRIVACY & DATA
   • Student personal data is collected solely for training administration purposes.
   • No personal data will be shared with any third party without explicit written consent.
   • CCTV footage from school premises may be retained for up to 30 days for safety purposes.

10. DISPUTES & GOVERNING LAW
    • Any disputes shall first be resolved through direct negotiation.
    • If unresolved, disputes shall be referred to mediation under Sri Lankan civil law.
    • These terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By clicking "I Have Read & I Agree", you confirm that you have read the full document, understood all terms, and voluntarily agree to comply with all conditions set out above.

Eranga Driving School Administration`;

export default function EnrollPackage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, setUserProfile } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Fetch package + category from local data ─────────────────────
  useEffect(() => {
    const p = getPackageById(id);
    if (p) {
      setPkg(p);
      setCategory(getCategoryById(p.category));
    }
    setLoading(false);
  }, [id]);

  const resolvedCatId = pkg?.category || 'lv';
  const theme = CAT_THEME[resolvedCatId] || CAT_THEME.lv;
  const hasActivePackage = !!userProfile?.packageId && userProfile.packageId !== id;

  // ── Scroll tracking for terms ──────────────────────────────────────────────
  const handleTermsScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setScrolledToBottom(true);
  };

  // ── Enroll ─────────────────────────────────────────────────────────────────
  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('You must accept the Training Terms & Conditions to proceed.'); return; }
    if (hasActivePackage) { setError('You already have an active package. Please complete it first.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30); // Default 30 days duration

      // Calculate 30% advance
      const advanceFee = Math.round(pkg.price * 0.3);

      const payload = {
        student_id: currentUser.uid,
        package_id: pkg.id,
        package_name: pkg.name,
        category_id: resolvedCatId,
        category_name: category?.name || '',
        included_vehicles: [pkg.name],
        total_classes: 20, // Default for now
        completed_classes: 0,
        skills: [], 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        enrolled_at: new Date().toISOString(),
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        price: pkg.price,
      };

      // Redirect to Checkout Page for the 30% advance
      navigate('/student/checkout', {
        state: {
          type: 'package',
          fee: advanceFee,
          title: `Enroll in ${pkg.name}`,
          payload: payload
        }
      });
      
    } catch (err) {
      console.error(err);
      setError('Failed to process enrollment. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!pkg) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Package not found.</p>
        <Link to="/student/packages" className="text-blue-600 hover:underline text-sm font-bold">← Browse Packages</Link>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl text-center border border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">You're Enrolled!</h2>
        <p className="text-gray-500 mb-1">Welcome to <strong>{pkg.name}</strong>.</p>
        <p className="text-sm text-gray-400 mb-6">
          {category?.name}
        </p>
        <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-3">Redirecting to your Training Plan…</p>
      </motion.div>
    );
  }

  // ── Main enrollment form ───────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back nav */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors font-bold">
        <ChevronLeft size={16} /> Back to Packages
      </button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-gray-900">Confirm Enrollment</h1>
        <p className="text-gray-500 text-sm mt-1">Review all details and accept the training terms before proceeding.</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {hasActivePackage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div className="text-sm">
            <p className="font-black">One Active Package Allowed</p>
            <p className="font-medium opacity-80">Complete or cancel your current package before enrolling in a new one.</p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Package banner */}
        <div className={`p-6 bg-gradient-to-r ${theme.gradient} text-white`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 text-xs font-bold mb-3">
            <span>{category?.name || resolvedCatId}</span>
            <span>›</span>
            <span>Combo Package</span>
          </div>
          <h2 className="text-2xl font-black">{pkg.name}</h2>
          <p className="text-4xl font-black mt-4">Rs. {Number(pkg.price).toLocaleString()}</p>
        </div>

        {/* Student details */}
        <div className="p-6 border-b border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Car size={11} /> Your Details
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-bold text-gray-900">{userProfile?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-bold text-gray-900">{userProfile?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">NIC</span><span className="font-bold text-gray-900">{userProfile?.nic || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Selected Option</span>
              <span className="font-bold text-gray-900 text-right">{pkg.name}</span>
            </div>
          </div>
        </div>

        {/* Agreement section */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Shield size={11} /> Training Agreement (Required)
          </p>

          {/* Open terms button */}
          <button type="button" onClick={() => setShowTerms(true)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all group
              ${agreed ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
            <Shield size={22} className={agreed ? 'text-green-500' : 'text-blue-500'} />
            <div className="text-left flex-1">
              <p className={`font-black text-sm ${agreed ? 'text-green-700' : 'text-gray-900'}`}>
                {agreed ? '✓ Terms & Conditions Accepted' : 'Read Training Terms & Conditions'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {agreed ? 'You have read and agreed to all training rules.' : 'Click to open — you must read fully before agreeing'}
              </p>
            </div>
            {!agreed && <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
          </button>

          {!agreed && (
            <p className="text-xs text-center text-gray-400">
              You must open the document, read it to the bottom, and click "I Agree" before enrolling.
            </p>
          )}

          {/* Submit */}
          <form onSubmit={handleEnroll} className="pt-2 space-y-3">
            <button type="submit"
              disabled={submitting || !agreed || hasActivePackage}
              className={`w-full py-4 rounded-xl font-black text-white text-sm transition-all
                bg-gradient-to-r ${theme.gradient} hover:opacity-90 shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}>
              {submitting ? 'Processing…' : `Pay 30% Advance (Rs. ${Number(Math.round(pkg.price * 0.3)).toLocaleString()})`}
            </button>
            <button type="button" onClick={() => navigate(-1)} disabled={submitting}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors">
              Cancel
            </button>
          </form>
        </div>
      </motion.div>

      {/* ── Terms Modal ── */}
      <AnimatePresence>
        {showTerms && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '88vh' }}>

              {/* Modal header */}
              <div className={`flex items-center justify-between p-5 bg-gradient-to-r ${theme.gradient}`}>
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-white" />
                  <div>
                    <h2 className="font-black text-white text-sm">Training Terms & Conditions</h2>
                    <p className="text-white/70 text-xs">Eranga Driving School · Sri Lanka</p>
                  </div>
                </div>
                <button onClick={() => setShowTerms(false)} className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable content */}
              <div onScroll={handleTermsScroll}
                className="flex-1 overflow-y-auto p-5 text-xs text-gray-600 leading-relaxed whitespace-pre-line font-mono bg-gray-50">
                {TERMS_TEXT}
              </div>

              {/* Scroll prompt */}
              {!scrolledToBottom && (
                <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                  <ChevronDown size={14} className="text-amber-500 animate-bounce flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-bold">Scroll to the bottom to enable "I Agree"</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                <button onClick={() => setShowTerms(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors">
                  Close
                </button>
                <button
                  disabled={!scrolledToBottom}
                  onClick={() => { setAgreed(true); setShowTerms(false); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm text-white transition-all
                    bg-gradient-to-r ${theme.gradient} hover:opacity-90
                    disabled:opacity-40 disabled:cursor-not-allowed`}>
                  ✓ I Have Read & I Agree
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
