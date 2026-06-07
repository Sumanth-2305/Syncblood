import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Droplets size={24} />
        <span>SyncBlood</span>
      </Link>
      {user && (
        <div className="navbar-right">
          <span className="navbar-role">{user.role}</span>
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
