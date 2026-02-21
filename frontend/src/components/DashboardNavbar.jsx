import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './DashboardNavbar.css';

const DashboardNavbar = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-left">
        <span className="welcome-text">{t('dashboard.welcome_back')}</span>
        <h2 className="user-name">{user.name}</h2>
      </div>

      <div className="navbar-right">
        {/* Language Switcher */}
        <div className="language-switcher dashboard-switcher">
          <button
            className="language-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setIsLangDropdownOpen(!isLangDropdownOpen);
            }}
            onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
          >
            <span className="language-flag">{currentLanguage.flag}</span>
            <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
            <svg
              className={`language-arrow ${isLangDropdownOpen ? 'open' : ''}`}
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
            >
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {isLangDropdownOpen && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${currentLanguage.code === lang.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-label">{lang.label}</span>
                  {currentLanguage.code === lang.code && (
                    <svg className="language-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="profile-container" onClick={toggleDropdown}>
          <div className="avatar-circle">{initial}</div>
          <div className="profile-info">
            <span className="p-name">{user.name}</span>
            <span className="p-role">{t(`roles.${user.role.toLowerCase()}`)}</span>
          </div>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={() => navigate(`/${user.role.toLowerCase()}/profile`)} className="dropdown-item">
                <i className="fa-regular fa-user"></i> {t('dashboard.profile')}
              </button>
              <button onClick={handleLogout} className="dropdown-item logout">
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t('dashboard.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
