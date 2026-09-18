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
  const { activeBusiness, businesses, setActiveBusiness } = useBusiness();
  const { isDarkMode } = useTheme();

  const theme = {
    bg: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#333333',
    border: isDarkMode ? '#333333' : '#e5e7eb',
    selectBg: isDarkMode ? '#2d2d2d' : '#f8f9fa'
  };

  return (
    <div
      style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        backgroundColor: theme.bg,
        color: theme.text,
        borderBottom: `3px solid ${activeBusiness?.themeColor || '#007bff'}`,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Sección Izquierda: Logo + Nombre del Negocio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        {activeBusiness?.logo_url ? (
          <img
            src={getImageSrc(activeBusiness.logo_url)}
            alt={activeBusiness.name}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${activeBusiness?.themeColor || '#007bff'}`
            }}
          />
        ) : (
          <div
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              backgroundColor: activeBusiness?.themeColor || '#007bff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {activeBusiness?.name ? activeBusiness.name.charAt(0) : '🏢'}
          </div>
        )}
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: theme.text }}>
          {activeBusiness?.name || 'Cargando...'}
        </h3>
      </div>

      {/* Sección Derecha: Selector de Perfil Activo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#aaa' : '#666' }}>
          Perfil Activo:
        </span>
        <select
          value={activeBusiness?.id || ''}
          onChange={(e) => {
            const selected = businesses.find((b) => b.id === Number(e.target.value));
            if (selected) setActiveBusiness(selected);
          }}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            backgroundColor: theme.selectBg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}
        >
          {(businesses || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};