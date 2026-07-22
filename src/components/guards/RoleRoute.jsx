import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, role }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Wait if global loading is true, OR if the user is authenticated but their profile hasn't been fetched yet
  if (loading || (currentUser && !userProfile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const allowed = Array.isArray(role)
    ? role.includes(userProfile?.role)
    : userProfile?.role === role;

  if (!allowed) {
    const redirectMap = { admin: '/admin', instructor: '/instructor', student: '/student' };
    return <Navigate to={redirectMap[userProfile?.role] || '/'} replace />;
  }

  // Prevent pending users from accessing active dashboard routes
  if (userProfile?.status === 'pending' && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}
