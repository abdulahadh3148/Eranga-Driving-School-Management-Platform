const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

const chatbotCode = `
// ═════════════════════════════════════════════════════════════════════════════
// FLOATING CHATBOT
// ═════════════════════════════════════════════════════════════════════════════
function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm the driving school assistant. How can I help?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    // Simple mock logic
    setTimeout(() => {
      const lower = newMsg.text.toLowerCase();
      let reply = "I'm not sure. Please contact our front desk at 011-123-4567.";
      if (lower.includes('permit') || lower.includes('medical')) reply = "You need a medical certificate to apply for your learner's permit.";
      if (lower.includes('fee') || lower.includes('cost') || lower.includes('pay')) reply = "You can view your outstanding fees and make a payment in the 'Make Payment' section.";
      if (lower.includes('book') || lower.includes('class') || lower.includes('lesson')) reply = "You can book theory or practical sessions in the 'Book Session' tab.";
      
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ width: 60, height: 60, borderRadius: 30, background: '#f59e0b', color: '#1c1917', border: 'none', cursor: 'pointer', fontSize: 24, boxShadow: '0 8px 32px rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          💬
        </button>
      ) : (
        <div style={{ width: 320, height: 440, background: '#110f0d', border: '1px solid #1e1a18', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ background: '#1a1614', padding: '16px 20px', borderBottom: '1px solid #1e1a18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: '#f59e0b', color: '#1c1917', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f0eb' }}>Assistant</div>
                <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b6460', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          
          {/* Messages */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ background: m.sender === 'user' ? '#f59e0b' : '#1a1614', color: m.sender === 'user' ? '#1c1917' : '#c9bfb5', padding: '10px 14px', borderRadius: 16, borderBottomRightRadius: m.sender === 'user' ? 4 : 16, borderBottomLeftRadius: m.sender === 'bot' ? 4 : 16, fontSize: 13, lineHeight: 1.4 }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid #1e1a18', display: 'flex', gap: 12 }}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: '#1a1614', border: '1px solid #2a2420', padding: '10px 16px', borderRadius: 20, color: '#f5f0eb', fontSize: 13, outline: 'none' }} />
            <button type="submit" style={{ background: '#f59e0b', color: '#1c1917', border: 'none', width: 40, height: 40, borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</button>
          </form>
        </div>
      )}
    </div>
  );
}
`;

// Append chatbot code to the end of the file
content += '\n' + chatbotCode;

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Appended FloatingChatbot successfully.');
