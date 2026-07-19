import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="brand">
        ComplaintDesk
      </Link>
      {user && (
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          {user.role === 'user' && <Link to="/complaints/new">New Complaint</Link>}
          {user.role === 'admin' && <Link to="/admin/users">Users</Link>}
          <span className="nav-user">
            {user.name} <span className={`role-tag role-${user.role}`}>{user.role}</span>
          </span>
          <button type="button" className="btn-link" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
