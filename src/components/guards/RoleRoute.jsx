import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, role }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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

  return children;
}
