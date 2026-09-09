import React from 'react';
import { useBusiness } from '../BusinessContext';

export const Navbar = () => {
  const { activeBusiness, switchBusiness, BUSINESSES } = useBusiness();

  return (
    <header style={{ ...styles.header, borderBottom: `4px solid ${activeBusiness.themeColor}` }}>
      <div style={styles.brand}>
        <span style={styles.icon}>{activeBusiness.icon}</span>
        <h2 style={{ 
          margin: 0, 
          color: '#212529', // <--- Cambiado para que resalte
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>{activeBusiness.name}</h2>
      </div>

      <div style={styles.profileSelector}>
        <span style={styles.label}>Perfil Activo:</span>
        <select
          value={activeBusiness.id}
          onChange={(e) => switchBusiness(Number(e.target.value))}
          style={styles.select}
        >
          {BUSINESSES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.icon} {b.name}
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
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  icon: { fontSize: '1.8rem' },
  profileSelector: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  label: { fontWeight: '500', color: '#555' },
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    cursor: 'pointer',
    outline: 'none',
  },
};