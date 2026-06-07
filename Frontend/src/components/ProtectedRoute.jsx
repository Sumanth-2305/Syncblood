import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LOGIN_ROUTES = {
  admin: '/admin/login',
  hospital: '/hospital/login',
  donor: '/donor/login',
};

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== role) {
    return <Navigate to={LOGIN_ROUTES[role] || '/'} state={{ from: location }} replace />;
  }

  return children;
}
