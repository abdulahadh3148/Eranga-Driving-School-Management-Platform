import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import RoleRoute from './components/guards/RoleRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
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
import PendingApprovalPage from './pages/auth/PendingApprovalPage';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import BookingPage from './pages/student/BookingPage';
import ViewPackages from './pages/student/ViewPackages';
import EnrollPackage from './pages/student/EnrollPackage';
import SelectedPackage from './pages/student/SelectedPackage';
import CheckoutPage from './pages/student/CheckoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AllStudents from './pages/admin/AllStudents';
import ApprovedStudents from './pages/admin/ApprovedStudents';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import PastStudents from './pages/admin/PastStudents';
import StudentReport from './pages/admin/StudentReport';
import AdminInstructors from './pages/admin/Instructors';
import AdminVehicles from './pages/admin/Vehicles';
import AdminPackages from './pages/admin/Packages';
import AdminBookings from './pages/admin/Bookings';
import SchedulePage from './pages/admin/SchedulePage';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings from './pages/admin/Settings';
import ManageHomePage from './pages/admin/ManageHomePage';
import TrialExams from './pages/admin/TrialExams';
import DatabaseCleaner from './pages/admin/DatabaseCleaner';
import StudentProfile from './pages/admin/StudentProfile';
import StudentProgress from './pages/admin/StudentProgress';
import FixData from './pages/FixData';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorSchedule from './pages/instructor/MySchedule';
import InstructorStudents from './pages/instructor/MyStudents';
import InstructorAvailability from './pages/instructor/Availability';
import StudentDetails from './pages/instructor/StudentDetails';

// Seeder
import { seedDatabaseIfNeeded } from './firebase/dbSeeder';

export default function App() {
  useEffect(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_SEED === 'true') {
      seedDatabaseIfNeeded();
    }
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

        {/* Pending Approval Route */}
        <Route path="/pending-approval" element={<PrivateRoute><PendingApprovalPage /></PrivateRoute>} />

        {/* Student Routes */}
        <Route path="/student" element={<PrivateRoute><RoleRoute role="student"><Outlet /></RoleRoute></PrivateRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="available-classes" element={<StudentDashboard />} />
          <Route path="book" element={<BookingPage />} />
          <Route path="packages" element={<ViewPackages />} />
          <Route path="enroll/:id" element={<EnrollPackage />} />
          <Route path="package" element={<SelectedPackage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="*" element={<StudentDashboard />} />
        </Route>

        <Route path="/fix-data" element={<FixData />} />

        {/* Admin Routes */}
        <Route element={<PrivateRoute><RoleRoute role="admin"><AdminLayout /></RoleRoute></PrivateRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AllStudents />} />
          <Route path="/admin/students/:id" element={<StudentProfile />} />
          <Route path="/admin/students/:studentId/progress" element={<StudentProgress />} />
          <Route path="/admin/past-students" element={<PastStudents />} />
          <Route path="/admin/student-report/:id" element={<StudentReport />} />
          <Route path="/admin/approvals" element={<ApprovalsPage />} />
          <Route path="/admin/approved-students" element={<ApprovedStudents />} />
          <Route path="/admin/instructors" element={<AdminInstructors />} />
          <Route path="/admin/vehicles" element={<AdminVehicles />} />
          <Route path="/admin/packages" element={<AdminPackages />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/scheduling" element={<SchedulePage />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/homepage" element={<ManageHomePage />} />
          <Route path="/admin/trial-exams" element={<TrialExams />} />
          <Route path="/admin/db-tools" element={<DatabaseCleaner />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={<PrivateRoute><RoleRoute role="instructor"><InstructorLayout /></RoleRoute></PrivateRoute>}>
          <Route index element={<InstructorDashboard />} />
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="schedule" element={<InstructorSchedule />} />
          <Route path="students" element={<InstructorStudents />} />
          <Route path="students/:id" element={<StudentDetails />} />
          <Route path="availability" element={<InstructorAvailability />} />
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
