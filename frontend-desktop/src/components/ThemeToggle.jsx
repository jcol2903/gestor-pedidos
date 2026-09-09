import React from 'react';
import { useTheme } from '../ThemeContext';

export const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <style>{`
        .theme-toggle-btn {
          --toggle-width: 52px;
          --toggle-height: 28px;
          width: var(--toggle-width);
          height: var(--toggle-height);
          display: flex;
          align-items: center;
          border-radius: 999px;
          background-color: ${isDarkMode ? '#ffffff' : '#DFDEDE'};
          cursor: pointer;
          transition: background-color 0.4s ease;
          position: relative;
          border: none;
          outline: none;
          padding: 0;
        }

        .theme-toggle-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: ${isDarkMode ? '#2A2A2C' : '#ffffff'};
          transform: ${isDarkMode ? 'translateX(26px)' : 'translateX(3px)'};
          position: relative;
          overflow: hidden;
          transition: transform 0.4s ease, background-color 0.4s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .theme-toggle-icon {
          position: absolute;
          transition: transform 0.4s ease;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-toggle-sun {
          transform: ${isDarkMode ? 'translateY(120%)' : 'translateY(0)'};
        }

        .theme-toggle-moon {
          transform: ${isDarkMode ? 'translateY(0)' : 'translateY(-120%)'};
        }
      `}</style>

      <button
        className="theme-toggle-btn"
        onClick={toggleDarkMode}
        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        type="button"
      >
        <div className="theme-toggle-circle">
          {/* Sol */}
          <span className="theme-toggle-icon theme-toggle-sun">☀️</span>
          {/* Luna */}
          <span className="theme-toggle-icon theme-toggle-moon">🌙</span>
        </div>
      </button>
    </>
  );
};