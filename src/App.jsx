import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import RoleRoute from './components/guards/RoleRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import InstructorLayout from './layouts/InstructorLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import CoursesPage from './pages/public/CoursesPage';
import PricingPage from './pages/public/PricingPage';
import ServicesPage from './pages/public/ServicesPage';
import InstructorsPage from './pages/public/InstructorsPage';
import VehiclesPage from './pages/public/VehiclesPage';
import TestimonialsPage from './pages/public/TestimonialsPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';


// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AllStudents from './pages/admin/AllStudents';
import PendingStudents from './pages/admin/PendingStudents';
import ApprovedStudents from './pages/admin/ApprovedStudents';
import AdminInstructors from './pages/admin/Instructors';
import AdminVehicles from './pages/admin/Vehicles';
import AdminPackages from './pages/admin/Packages';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings from './pages/admin/Settings';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorSchedule from './pages/instructor/MySchedule';
import InstructorStudents from './pages/instructor/MyStudents';
import InstructorAvailability from './pages/instructor/Availability';
import SessionDetails from './pages/instructor/SessionDetails';
import MarkComplete from './pages/instructor/MarkComplete';
import ActiveSession from './pages/instructor/ActiveSession';

// Seeder
import { seedDatabaseIfNeeded } from './firebase/dbSeeder';

export default function App() {
  useEffect(() => {
    seedDatabaseIfNeeded();
  }, []);

  return (
    <Router>
      <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<PrivateRoute><RoleRoute role="student" /><Outlet /></PrivateRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="*" element={<StudentDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute><RoleRoute role="admin" /><AdminLayout /></PrivateRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AllStudents />} />
            <Route path="/admin/pending-students" element={<PendingStudents />} />
            <Route path="/admin/approved-students" element={<ApprovedStudents />} />
            <Route path="/admin/instructors" element={<AdminInstructors />} />
            <Route path="/admin/vehicles" element={<AdminVehicles />} />
            <Route path="/admin/packages" element={<AdminPackages />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Instructor Routes */}
          <Route element={<PrivateRoute><RoleRoute role="instructor" /><InstructorLayout /></PrivateRoute>}>
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/schedule" element={<InstructorSchedule />} />
            <Route path="/instructor/students" element={<InstructorStudents />} />
            <Route path="/instructor/availability" element={<InstructorAvailability />} />
            <Route path="/instructor/sessions" element={<SessionDetails />} />
            <Route path="/instructor/mark-complete" element={<MarkComplete />} />
            <Route path="/instructor/active-session" element={<ActiveSession />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1><p className="text-gray-500 mb-6">Page not found.</p><a href="/" className="px-6 py-2.5 bg-primary/50 text-white font-bold rounded-xl hover:bg-orange-600">Go Home</a></div></div>} />
        </Routes>
      </Router>
  );
}
