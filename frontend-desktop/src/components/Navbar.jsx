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
  const { activeBusiness, switchBusiness, businesses, loading } = useBusiness();
  const { isDarkMode } = useTheme();

  const businessColor = activeBusiness?.theme_color || activeBusiness?.themeColor || '#007bff';

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
        borderBottom: `4px solid ${businessColor}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* LADO IZQUIERDO: Logo / Círculo e Imagen con Nombre */}
      <div style={styles.brand}>
        {activeBusiness?.logo_url ? (
          <img
            src={getImageSrc(activeBusiness.logo_url)}
            alt={activeBusiness.name}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${businessColor}`,
              flexShrink: 0
            }}
          />
        ) : (
          <div
            style={{
              ...styles.avatarPlaceholder,
              backgroundColor: businessColor,
            }}
          >
            {activeBusiness?.name ? activeBusiness.name.charAt(0) : '🏢'}
          </div>
        )}

        <h2
          style={{
            margin: 0,
            color: theme.text,
            fontWeight: 'bold',
            fontSize: '1.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          {activeBusiness?.name || (loading ? 'Cargando...' : 'Mi Negocio')}
        </h2>
      </div>

      {/* LADO DERECHO: Selector de Perfil con Perfil Activo */}
      <div style={styles.profileSelector}>
        <span style={{ ...styles.label, color: theme.subtext }}>Perfil Activo:</span>
        <select
          value={activeBusiness?.id || ''}
          onChange={(e) => switchBusiness(Number(e.target.value))}
          style={{
            ...styles.select,
            backgroundColor: theme.inputBg,
            color: theme.text,
            borderColor: theme.border,
          }}
        >
          {(businesses || []).map((b) => (
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
    justify: 'space-between',
    alignItems: 'center',
    padding: '0.8rem 2rem',
    gap: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  brand: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem',
    minWidth: 'fit-content'
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    flexShrink: 0
  },
  profileSelector: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.8rem',
    marginLeft: 'auto'
  },
  label: { 
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontSize: '0.95rem'
  },
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    outline: 'none',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
};