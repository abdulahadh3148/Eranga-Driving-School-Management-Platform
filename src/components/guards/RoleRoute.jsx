import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, role }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Wait if global loading is true, OR if the user is authenticated but their profile hasn't been fetched yet
  if (loading || (currentUser && !userProfile)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
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
