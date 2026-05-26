import { Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, UserPen, Package, CalendarDays,
  BookOpen, CreditCard, History, TrendingUp, Bell
} from 'lucide-react';
import Sidebar from '../components/ui/Sidebar';
import { useAuth } from '../context/AuthContext';

const studentNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/student' },
  { icon: User,            label: 'My Profile',       path: '/student/profile' },
  { icon: UserPen,         label: 'Edit Profile',     path: '/student/edit-profile' },
  { icon: Package,         label: 'View Packages',    path: '/student/packages' },
  { icon: BookOpen,        label: 'Book Session',     path: '/student/book' },
  { icon: CalendarDays,    label: 'My Bookings',      path: '/student/bookings' },
  { icon: CreditCard,      label: 'Make Payment',     path: '/student/payment' },
  { icon: History,         label: 'Payment History',  path: '/student/payment-history' },
  { icon: TrendingUp,      label: 'Progress',         path: '/student/progress' },
  { icon: Bell,            label: 'Notifications',    path: '/student/notifications' },
];

export default function StudentLayout() {
  const { userProfile } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={studentNavItems} title="Student Portal" />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:justify-end">
          <div className="lg:hidden w-8" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{userProfile?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 capitalize">Student</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/50 flex items-center justify-center text-white font-bold text-sm">
              {userProfile?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
