import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './DashboardNavbar.css';

const DashboardNavbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-left">
        <span className="welcome-text">Welcome Back</span>
        <h2 className="user-name">{user.name} !!</h2>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ThemeToggle />

        <div className="profile-container" onClick={toggleDropdown}>
          <div className="avatar-circle">{initial}</div>
          <div className="profile-info">
            <span className="p-name">{user.name}</span>
            <span className="p-role">{user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
          </div>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={() => navigate(`/${user.role.toLowerCase().replace(/_/g, '')}/profile`)} className="dropdown-item">
                <i className="fa-regular fa-user"></i> Profile
              </button>
              <button onClick={handleLogout} className="dropdown-item logout">
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;