import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, UserCheck, UserPlus,
  Users, Car, Package, CalendarDays, CreditCard, Home,
  BarChart3, Bell, Settings, CalendarClock, CheckCircle, FileText, ShieldAlert, ClipboardList, Database
} from 'lucide-react';
import Sidebar from '../components/ui/Sidebar';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/ui/NotificationBell';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ShieldAlert, label: 'Approvals', path: '/admin/approvals' },
  { 
    icon: GraduationCap, label: 'Students', 
    children: [
      { icon: GraduationCap, label: 'All Students', path: '/admin/students' },
      { icon: UserPlus, label: 'Approved Students', path: '/admin/approved-students' },
      { icon: CheckCircle, label: 'Past Students', path: '/admin/past-students' },
    ]
  },
  { 
    icon: CalendarClock, label: 'Schedule', 
    children: [
      { icon: CalendarClock, label: 'Master Schedule', path: '/admin/scheduling' },
      { icon: CalendarDays, label: 'Bookings', path: '/admin/bookings' },
      { icon: CalendarDays, label: 'Trial Exams', path: '/admin/trial-exams' },
    ]
  },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { 
    icon: ClipboardList, label: 'Management', 
    children: [
      { icon: Users, label: 'Instructors', path: '/admin/instructors' },
      { icon: Car, label: 'Vehicles', path: '/admin/vehicles' },
      { icon: Package, label: 'Packages', path: '/admin/packages' },
      { icon: Home, label: 'Home Page', path: '/admin/homepage' },
    ]
  },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
  { icon: Database, label: 'DB Tools', path: '/admin/db-tools' },
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
            <NotificationBell userId="admin" />
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
