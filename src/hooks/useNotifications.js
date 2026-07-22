import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Custom hook to manage notifications for a specific user or role.
 * @param {string} userId - The target userId or role string (e.g., 'admin', 'student-uid')
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory because Firestore requires index for complex sort
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
