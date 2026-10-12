import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">H</span>
          <span>HustleHub</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/gigs">Browse Gigs</NavLink>

          {user?.role === 'freelancer' && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/income">Income</NavLink>
            </>
          )}

          {(user?.role === 'client' || user?.role === 'freelancer') && (
            <NavLink to="/bookings">My Bookings</NavLink>
          )}

          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}

          {!user && (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Sign up
              </NavLink>
            </>
          )}

          {user && (
            <>
              <span className="user-chip">
                {user.name || user.email}
                {user.role && <span className="role">· {user.role}</span>}
              </span>
              <button onClick={handleLogout} className="btn-ghost">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}