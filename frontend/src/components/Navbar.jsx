import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import MECHANIC from "/images/MECHANIC.png";
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Public navbar supports all 3 languages including Arabic
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleScrollToTracking = (e) => {
    e.preventDefault();
    const sectionId = "checkstatus-btn";
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link className="navbar-left" to="/">
          <div className="navbar-logo-mark">
            <img src={MECHANIC} alt="MecaPro logo" className="logo" />
          </div>
          <span className="navbar-logo-text">MecaPro</span>
        </Link>

        <nav className="navbar-links">
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/" end>
            {t('navbar.home')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/about">
            {t('navbar.about')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/contact">
            {t('navbar.contact')}
          </NavLink>
        </nav>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link className="btn-outline" to="/login">{t('navbar.login')}</Link>
          <Link className="btn-primary" to="/signup">{t('navbar.signup')}</Link>
          <ThemeToggle />

          <div className="language-switcher">
            <button
              className="language-trigger"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
            >
              <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
              <svg
                className={`language-arrow ${isLangDropdownOpen ? 'open' : ''}`}
                width="12" height="8" viewBox="0 0 12 8" fill="none"
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
                    onMouseDown={() => { changeLanguage(lang.code); setIsLangDropdownOpen(false); }}
                  >
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

        </div>
      </div>
    </header>
  );
}

export default Navbar;