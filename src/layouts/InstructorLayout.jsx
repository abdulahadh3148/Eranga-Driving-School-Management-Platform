import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  PlayCircle,
  Users,
  Clock,
  LogOut,
  Bell,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/ui/NotificationBell';
import '../pages/instructor/instructor.css';

export default function InstructorLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/instructor/dashboard' },
    { icon: Calendar, label: 'Schedule', path: '/instructor/schedule' },
    { icon: Users, label: 'Students', path: '/instructor/students' },
    { icon: Clock, label: 'Availability', path: '/instructor/availability' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-on-background border-b border-outline-variant dark:border-outline fixed top-0 left-0 w-full z-40">
        <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 w-full max-w-[1200px] mx-auto">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed cursor-pointer">menu</span>
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">Instructor Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={currentUser?.uid} />
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-primary">
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'I'}
            </div>
            <button onClick={handleLogout} title="Log Out" className="p-1 text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 pb-24 px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto min-h-screen">
        <Outlet />
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest dark:bg-on-background border-t border-outline-variant dark:border-outline flex justify-around items-center px-4 pb-2 pt-2 h-20">
        {menuItems.map((item) => {
          const isActive = item.label === 'Dashboard'
            ? location.pathname === '/instructor' || location.pathname.startsWith('/instructor/dashboard')
            : location.pathname.startsWith(item.path);

          // Map Lucide icons to Material Symbols for the new layout
          let iconName = 'circle';
          if (item.label === 'Dashboard') iconName = 'calendar_today';
          if (item.label === 'Schedule') iconName = 'event';
          if (item.label === 'Active') iconName = 'play_circle';
          if (item.label === 'Students') iconName = 'groups';
          if (item.label === 'Hours') iconName = 'schedule';

          if (isActive) {
            return (
              <Link key={item.label} to={item.path} className="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1 transition-transform scale-95 active:scale-90">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            );
          } else {
            return (
              <Link key={item.label} to={item.path} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-tertiary-container p-2 hover:bg-surface-container-high dark:hover:bg-tertiary-container transition-all">
                <span className="material-symbols-outlined">{iconName}</span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            );
          }
        })}
      </nav>
    </div>
  );
}
