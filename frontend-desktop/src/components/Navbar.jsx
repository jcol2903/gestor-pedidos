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
  // Cambiamos BUSINESSES por businesses dinámico
  const { activeBusiness, switchBusiness, businesses, loading } = useBusiness();
  const { isDarkMode } = useTheme();

  // Color distintivo del negocio (Soporta theme_color de la BD o themeColor de reserva)
  const businessColor = activeBusiness?.theme_color || activeBusiness?.themeColor || '#007bff';

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
        borderBottom: `4px solid ${businessColor}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={styles.brand}>
        {/* Renderizado de Logo si existe, o Inicial del nombre como respaldo */}
        {activeBusiness?.logo_url ? (
          <img
            src={getImageSrc(activeBusiness.logo_url)}
            alt={activeBusiness.name}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${businessColor}`,
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
            fontSize: '1.5rem',
          }}
        >
          {activeBusiness?.name || (loading ? 'Cargando...' : 'Sin Negocio')}
        </h2>
      </div>

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
    padding: '1rem 2rem',
    transition: 'all 0.3s ease',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  avatarPlaceholder: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
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