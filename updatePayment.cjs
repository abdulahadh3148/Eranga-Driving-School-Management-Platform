const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

// Add imports
if (!content.includes('firebase/storage')) {
  content = content.replace(
    /from "firebase\/firestore";/,
    `from "firebase/firestore";\nimport { storage } from "../firebase/config";\nimport { ref, uploadBytes, getDownloadURL } from "firebase/storage";`
  );
}

const paymentCode = `function MakePaymentPage({ payments, user, currentUser, userProfile, setUserProfile, goTo }) {
  const [tab, setTab] = useState('new');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [refNumber, setRefNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) return setError('Invalid amount');
    if (method === 'bank' && !refNumber) return setError('Reference number is required for bank transfer');
    if (method === 'bank' && !receiptFile) return setError('Receipt photo is required for bank transfer');
    
    setLoading(true); setError(''); setSuccess('');
    try {
      let receiptUrl = '';
      if (method === 'bank' && receiptFile) {
        const fileRef = ref(storage, \`receipts/\${currentUser.uid}_\${Date.now()}_\${receiptFile.name}\`);
        await uploadBytes(fileRef, receiptFile);
        receiptUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid, 
        studentName: user.name, 
        amount: payAmt, 
        method,
        refNumber: method === 'bank' ? refNumber : '',
        receiptUrl,
        status: 'pending', 
        date: new Date().toISOString()
      });
      
      setSuccess('Payment submitted successfully! Waiting for admin approval.');
      setTimeout(() => { 
        setSuccess(''); setAmount(''); setRefNumber(''); setReceiptFile(null); setTab('history'); 
      }, 3000);
    } catch (err) { console.error(err); setError('Payment failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader title="Payments & Billing" sub="Make a payment or view your transaction history" />
      
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
              <label style={css.formLabel}>Payment Method</label>
              <select style={css.formInput} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="bank">Online Bank Transfer</option>
                <option value="cash">Cash at Office</option>
              </select>
            </div>
            <div>
              <label style={css.formLabel}>Amount (LKR)</label>
              <input type="number" style={css.formInput} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            
            {method === 'bank' && (
              <>
                <div>
                  <label style={css.formLabel}>Reference Number</label>
                  <input type="text" style={css.formInput} value={refNumber} onChange={e => setRefNumber(e.target.value)} placeholder="Enter bank reference number" required />
                </div>
                <div>
                  <label style={css.formLabel}>Upload Receipt Photo</label>
                  <input type="file" accept="image/*" style={{...css.formInput, padding: '8px', background: 'transparent', border: '1px dashed #2a2420'}} onChange={e => setReceiptFile(e.target.files[0])} required />
                </div>
              </>
            )}

            {method === 'cash' && (
              <div style={{ fontSize: 13, color: '#8a7f74', background: '#1a1614', padding: 16, borderLeft: '3px solid #f59e0b' }}>
                You can pay cash directly at our office. Please submit this request so we know you plan to pay in person. Your balance will update after the admin confirms receipt.
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 8 }} className="accent-btn">
              {loading ? 'Processing...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b6460', border: '1px dashed #1e1a18', borderRadius: 16 }}>No payments found.</div>
          ) : payments.map(p => (
            <div key={p.id} style={{ ...css.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderLeft: p.status === 'pending' ? '3px solid #f59e0b' : '3px solid #10b981' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f0eb' }}>{p.method.toUpperCase()} Payment</div>
                <div style={{ fontSize: 11, color: '#8a7f74', marginTop: 4 }}>{fmtDate(p.date).day} {fmtDate(p.date).month} {p.refNumber ? \`• Ref: \${p.refNumber}\` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: p.status === 'pending' ? '#f59e0b' : '#10b981' }}>+ {fmtLKR(p.amount)}</div>
                <div style={{ fontSize: 10, color: '#6b6460', marginTop: 4, textTransform: 'uppercase', fontWeight: 800 }}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;

content = content.replace(/function MakePaymentPage\([\s\S]*?\}\n(?=\n\/\/ ═════════════════════════════════════════════════════════════════════════════\n\/\/ PROGRESS PAGE)/, paymentCode + '\n');

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Successfully updated StudentDashboard.jsx');
