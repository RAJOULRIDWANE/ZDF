import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle-btn ${className}`}
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--steel)';
                e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--white)';
            }}
        >
            {isDarkMode ? (
                <i className="fa-solid fa-sun"></i> // Sun icon for switching to Light mode
            ) : (
                <i className="fa-solid fa-moon"></i> // Moon icon for switching to Dark mode
            )}
        </button>
    );
};

export default ThemeToggle;
