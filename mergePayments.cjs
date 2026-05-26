const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

const paymentHistoryMatch = content.match(/function PaymentHistoryPage\(\{ payments[^}]*\}\) \{[\s\S]*?\n\}/);
const makePaymentMatch = content.match(/function MakePaymentPage\(\{ user[^}]*\}\) \{[\s\S]*?\n\}/);

if (!paymentHistoryMatch || !makePaymentMatch) {
  console.log('Could not find PaymentHistoryPage or MakePaymentPage');
  process.exit(1);
}

const newMakePaymentPage = `function MakePaymentPage({ payments, user, currentUser, userProfile, setUserProfile, goTo }) {
  const [tab, setTab] = useState('new'); // 'new' or 'history'
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) return setError('Invalid amount');
    setLoading(true); setError(''); setSuccess('');
    try {
      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid, studentName: user.name, amount: payAmt, method,
        status: 'completed', date: new Date().toISOString()
      });
      const userRef = doc(db, 'users', currentUser.uid);
      const newOut = Math.max(0, (userProfile?.outstandingFees || 0) - payAmt);
      await updateDoc(userRef, { outstandingFees: newOut });
      setUserProfile({ ...userProfile, outstandingFees: newOut });
      setSuccess('Payment successful!');
      setTimeout(() => { setSuccess(''); setAmount(''); setTab('history'); }, 2000);
    } catch (err) { console.error(err); setError('Payment failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader title="Payments & Billing" sub="Make a payment or view your transaction history" />
      
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #1e1a18', paddingBottom: 12 }}>
        <button onClick={() => setTab('new')} style={{ ...css.ghostBtn, background: tab === 'new' ? '#1a1614' : 'transparent', color: tab === 'new' ? '#f59e0b' : '#8a7f74' }}>Make Payment</button>
        <button onClick={() => setTab('history')} style={{ ...css.ghostBtn, background: tab === 'history' ? '#1a1614' : 'transparent', color: tab === 'history' ? '#f59e0b' : '#8a7f74' }}>Payment History</button>
      </div>

      {tab === 'new' ? (
        <div style={css.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #1a1614' }}>
            <div>
              <div style={{ fontSize: 13, color: '#8a7f74', marginBottom: 4 }}>Outstanding Balance</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#f5f0eb' }}>{fmtLKR(user.outstandingFees)}</div>
            </div>
            <div style={{ ...css.avatar, width: 48, height: 48, background: '#c2410c' }}>💳</div>
          </div>
          {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
          {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
          <form onSubmit={handlePay} style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={css.formLabel}>Amount (LKR)</label>
              <input type="number" style={css.formInput} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label style={css.formLabel}>Payment Method</label>
              <select style={css.formInput} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="card">Credit / Debit Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash at Office</option>
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 8 }} className="accent-btn">
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b6460', border: '1px dashed #1e1a18', borderRadius: 16 }}>No payments found.</div>
          ) : payments.map(p => (
            <div key={p.id} style={{ ...css.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f0eb' }}>{p.method.toUpperCase()} Payment</div>
                <div style={{ fontSize: 11, color: '#8a7f74', marginTop: 4 }}>{fmtDate(p.date).day} {fmtDate(p.date).month} • Ref: {p.id.slice(0, 6)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>+ {fmtLKR(p.amount)}</div>
                <div style={{ fontSize: 10, color: '#6b6460', marginTop: 4, textTransform: 'uppercase', fontWeight: 800 }}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;

content = content.replace(makePaymentMatch[0], newMakePaymentPage);
content = content.replace(/\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n\/\/\s*PAYMENT HISTORY PAGE\r?\n\/\/\s*═════════════════════════════════════════════════════════════════════════════\r?\n/, '');
content = content.replace(paymentHistoryMatch[0], '');

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Merged MakePaymentPage successfully.');
