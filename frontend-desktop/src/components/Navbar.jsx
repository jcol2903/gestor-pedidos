import React from 'react';
import { useBusiness } from '../BusinessContext';
import { useTheme } from '../ThemeContext';
import { API_BASE_URL } from '../config';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob')) return url;
  return `${API_BASE_URL}${url}`;
};

export const Navbar = () => {
  const { activeBusiness, switchBusiness, BUSINESSES } = useBusiness();
  const { isDarkMode } = useTheme();

  // Estilos adaptables según el modo claro / oscuro
  const theme = {
    bg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#212529',
    subtext: isDarkMode ? '#aaaaaa' : '#555555',
    border: isDarkMode ? '#333333' : '#cccccc',
    inputBg: isDarkMode ? '#2d2d2d' : '#ffffff',
  };

  return (
    <header
      style={{
        ...styles.header,
        backgroundColor: theme.bg,
        borderBottom: `4px solid ${activeBusiness?.themeColor || '#007bff'}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={styles.brand}>
        <span style={styles.icon}>{activeBusiness?.icon}</span>
        <h2
          style={{
            margin: 0,
            color: theme.text,
            fontWeight: 'bold',
            fontSize: '1.5rem',
          }}
        >
          {activeBusiness?.name || 'Mi Negocio'}
        </h2>
      </div>

      <div style={styles.profileSelector}>
        <span style={{ ...styles.label, color: theme.subtext }}>Perfil Activo:</span>
        <select
          value={activeBusiness?.id}
          onChange={(e) => switchBusiness(Number(e.target.value))}
          style={{
            ...styles.select,
            backgroundColor: theme.inputBg,
            color: theme.text,
            borderColor: theme.border,
          }}
        >
          {(BUSINESSES || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    transition: 'all 0.3s ease',
  },
  btnToggleTheme: {
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    marginLeft: '0.5rem',
    transition: 'all 0.3s ease',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  icon: { fontSize: '1.8rem' },
  profileSelector: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  label: { fontWeight: '500' },
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
};