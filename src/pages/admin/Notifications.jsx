import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Send, Users } from 'lucide-react';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all_students');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    
    try {
      const { sendNotification } = await import('../../utils/notifications');
      let queryRef = collection(db, 'users');
      const usersSnap = await getDocs(queryRef);
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const targetUsers = users.filter(u => {
        if (target === 'all_students') return u.role === 'student';
        if (target === 'all_instructors') return u.role === 'instructor';
        return true; 
      });

      const promises = targetUsers.map(user => 
        sendNotification({
          userId: user.id,
          title,
          message,
          type: 'alert'
        })
      );

      await Promise.all(promises);
      
      setTitle('');
      setMessage('');
      alert(`Notification sent to ${targetUsers.length} users!`);
    } catch (err) {
      console.error(err);
      alert('Failed to send notifications.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Send Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Broadcast messages to students or instructors.</p>
      </motion.div>

      <motion.form onSubmit={handleSend} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Target Audience</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'all_students', label: 'All Students' },
              { id: 'all_instructors', label: 'All Instructors' },
              { id: 'everyone', label: 'Everyone' }
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setTarget(t.id)}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                  ${target === t.id ? 'bg-primary/5 border-primary text-primary shadow-sm ring-1 ring-orange-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Users size={20} />
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Message Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. System Maintenance, Holiday Notice"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-all" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Message Content</label>
          <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-all resize-none" />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {loading ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
          </button>
        </div>

      </motion.form>
    </div>
  );
}
