import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="spinner" style={{ borderColor: 'var(--teal-100)', borderTopColor: 'var(--teal-500)', width: 28, height: 28 }} />
    </div>
  );
}

/** Only for signed-in users; otherwise redirect to /login and come back afterwards. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Only for signed-out users (login, register, forgot password). */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
