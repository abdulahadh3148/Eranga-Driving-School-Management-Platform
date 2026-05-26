import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  PlayCircle,
  Users,
  Clock,
  LogOut,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/instructor/instructor.css';

export default function InstructorLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/instructor' },
    { icon: Calendar, label: 'Schedule', path: '/instructor/schedule' },
    { icon: PlayCircle, label: 'Active', path: '/instructor/active-session', isPlay: true },
    { icon: Users, label: 'Students', path: '/instructor/students' },
    { icon: Clock, label: 'Hours', path: '/instructor/availability' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="instructor-portal">
      {/* Top bar */}
      <header className="ins-topbar">
        <div className="ins-topbar-left">
          <span className="ins-greeting">
            {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'Instructor'}
          </span>
          <span className="ins-greeting-sub">Eranga Driving School</span>
        </div>
        <div className="ins-topbar-right">
          <button className="ins-notification-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="ins-notification-badge" />
          </button>
          <div className="ins-avatar" title={userProfile?.name || 'Instructor'}>
            {userProfile?.name?.charAt(0).toUpperCase() || 'I'}
          </div>
          <button 
            onClick={handleLogout} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#556078',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              marginLeft: 4,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff5252'}
            onMouseLeave={e => e.currentTarget.style.color = '#556078'}
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ins-main">
        <div className="ins-page-enter">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="ins-bottom-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`ins-nav-item ${isActive ? 'active' : ''} ${item.isPlay ? 'has-session' : ''}`}
            >
              <div className="ins-nav-icon-wrap">
                <item.icon />
              </div>
              <span className="ins-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
