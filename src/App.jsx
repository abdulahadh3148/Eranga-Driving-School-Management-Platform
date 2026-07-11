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
import BookingPage from './pages/student/BookingPage';
import ViewPackages from './pages/student/ViewPackages';
import EnrollPackage from './pages/student/EnrollPackage';
import SelectedPackage from './pages/student/SelectedPackage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AllStudents from './pages/admin/AllStudents';
import PendingStudents from './pages/admin/PendingStudents';
import ApprovedStudents from './pages/admin/ApprovedStudents';
import AdminInstructors from './pages/admin/Instructors';
import AdminVehicles from './pages/admin/Vehicles';
import AdminPackages from './pages/admin/Packages';
import AdminBookings from './pages/admin/Bookings';
import AdminScheduling from './pages/admin/Scheduling';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings from './pages/admin/Settings';
import AdminBatches from './pages/admin/Batches';
import AdminAttendance from './pages/admin/Attendance';
import StudentProfile from './pages/admin/StudentProfile';
import StudentProgress from './pages/admin/StudentProgress';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorSchedule from './pages/instructor/MySchedule';
import InstructorStudents from './pages/instructor/MyStudents';
import InstructorAvailability from './pages/instructor/Availability';
import SessionDetails from './pages/instructor/SessionDetails';
import MarkComplete from './pages/instructor/MarkComplete';
import MarkSession from './pages/instructor/MarkSession';
import InstructorAttendance from './pages/instructor/Attendance';
import StudentDetails from './pages/instructor/StudentDetails';

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
        <Route path="/student" element={<PrivateRoute><RoleRoute role="student"><Outlet /></RoleRoute></PrivateRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="book" element={<BookingPage />} />
          <Route path="packages" element={<ViewPackages />} />
          <Route path="enroll/:id" element={<EnrollPackage />} />
          <Route path="package" element={<SelectedPackage />} />
          <Route path="*" element={<StudentDashboard />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<PrivateRoute><RoleRoute role="admin"><AdminLayout /></RoleRoute></PrivateRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AllStudents />} />
          <Route path="/admin/students/:id" element={<StudentProfile />} />
          <Route path="/admin/students/:studentId/progress" element={<StudentProgress />} />
          <Route path="/admin/pending-students" element={<PendingStudents />} />
          <Route path="/admin/approved-students" element={<ApprovedStudents />} />
          <Route path="/admin/instructors" element={<AdminInstructors />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="scheduling" element={<AdminScheduling />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="attendance" element={<AdminAttendance />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={<PrivateRoute><RoleRoute role="instructor"><InstructorLayout /></RoleRoute></PrivateRoute>}>
          <Route index element={<InstructorDashboard />} />
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="schedule" element={<InstructorSchedule />} />
          <Route path="students" element={<InstructorStudents />} />
          <Route path="students/:id" element={<StudentDetails />} />
          <Route path="availability" element={<InstructorAvailability />} />
          <Route path="sessions" element={<SessionDetails />} />
          <Route path="mark-complete" element={<MarkComplete />} />
          <Route path="mark-session/:studentId" element={<MarkSession />} />
          <Route path="attendance" element={<InstructorAttendance />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>404</h1>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Page not found.</p>
              <a href="/" style={{ padding: '0.75rem 2rem', background: '#2563eb', color: '#fff', fontWeight: 700, borderRadius: '0.75rem', textDecoration: 'none' }}>Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
