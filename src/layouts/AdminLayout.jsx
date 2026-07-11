import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, UserCheck, UserPlus,
  Users, Car, Package, CalendarDays, CreditCard,
  BarChart3, Bell, Settings, CalendarClock, CheckCircle
} from 'lucide-react';
import Sidebar from '../components/ui/Sidebar';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: GraduationCap, label: 'All Students', path: '/admin/students' },
  { icon: UserCheck, label: 'Pending Students', path: '/admin/pending-students' },
  { icon: UserPlus, label: 'Approved Students', path: '/admin/approved-students' },
  { icon: Users, label: 'Instructors', path: '/admin/instructors' },
  { icon: Users, label: 'Batches', path: '/admin/batches' },
  { icon: CheckCircle, label: 'Attendance', path: '/admin/attendance' },
  { icon: Car, label: 'Vehicles', path: '/admin/vehicles' },
  { icon: Package, label: 'Packages', path: '/admin/packages' },
  { icon: CalendarDays, label: 'Bookings', path: '/admin/bookings' },
  { icon: CalendarClock, label: 'Scheduling', path: '/admin/scheduling' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: BarChart3, label: 'Report', path: '/admin/reports' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout() {
  const { userProfile } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar items={adminNavItems} title="Admin Panel" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:justify-end">
          <div className="lg:hidden w-8" />
          <div className="flex items-center gap-6">
            <button 
              onClick={() => window.location.href = '/admin/notifications'}
              className="relative p-2 text-gray-400 hover:text-primary transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{userProfile?.name || 'Admin'}</p>
                <p className="text-xs text-primary font-medium">Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/50 flex items-center justify-center text-white font-bold text-sm">
                {userProfile?.name?.charAt(0) || 'A'}
              </div>
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
