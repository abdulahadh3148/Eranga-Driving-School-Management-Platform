import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Bell, Info, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const markAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking': return <Calendar size={20} className="text-blue-500" />;
      case 'payment': return <CheckCircle size={20} className="text-green-500" />;
      case 'alert': return <AlertTriangle size={20} className="text-red-500" />;
      default: return <Info size={20} className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Notifications 
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Updates about your bookings, payments, and account.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-primary hover:text-primary transition-colors">
            Mark all as read
          </button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="text-gray-200 mx-auto mb-4" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => markAsRead(n.id, n.isRead)}
                className={`p-5 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50/50 ${!n.isRead ? 'bg-primary/5/30' : 'bg-white'}`}>
                <div className="shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!n.isRead ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-sm ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{new Date(n.date).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm ${!n.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{n.message}</p>
                </div>
                {!n.isRead && (
                  <div className="shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/50 shadow-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
