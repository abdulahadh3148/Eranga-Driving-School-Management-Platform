import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { requestFCMPermission } from '../../utils/notifications';

const ICONS = {
  success: <CheckCircle className="text-green-500" size={18} />,
  warning: <AlertTriangle className="text-yellow-500" size={18} />,
  error: <XCircle className="text-red-500" size={18} />,
  info: <Info className="text-blue-500" size={18} />
};

export default function NotificationBell({ userId }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [permStatus, setPermStatus] = useState(Notification.permission);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n.id);
    setIsOpen(false);
    if (n.link) {
      window.location.href = n.link;
    }
  };

  const handleEnablePush = async () => {
    const token = await requestFCMPermission(userId, 'students');
    if (token) {
      setPermStatus('granted');
    } else {
      setPermStatus(Notification.permission);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col max-h-[400px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Enable Push Notifications Banner */}
          {permStatus !== 'granted' && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex flex-col gap-2 items-start">
              <p className="text-xs text-blue-800 font-medium">
                Never miss an update! Enable push notifications to get alerts instantly.
              </p>
              <button 
                onClick={handleEnablePush}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center">
                <Bell className="text-gray-200 mb-2" size={32} />
                <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                      n.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {ICONS[n.type] || ICONS.info}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-0.5 ${n.read ? 'text-gray-900 font-medium' : 'text-gray-900 font-bold'}`}>
                        {n.title}
                      </p>
                      <p className={`text-xs ${n.read ? 'text-gray-500' : 'text-gray-700 font-medium'} leading-snug`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
