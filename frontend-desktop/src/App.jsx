import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { Navbar } from './components/Navbar';
import { OrdersDashboard } from './components/OrdersDashboard';
import { AdminReports } from './components/AdminReports';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('orders'); // 'orders' o 'reports'

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <BusinessProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        {/* Barra superior de sesión */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 2rem', background: '#212529', color: '#fff' }}>
          <div>
            <span>Usuario: <strong>{user.username}</strong> ({user.role})</span>
            {user.role === 'admin' && (
              <span style={{ marginLeft: '1.5rem' }}>
                <button 
                  onClick={() => setCurrentTab('orders')} 
                  style={{ color: currentTab === 'orders' ? '#007bff' : '#fff', background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', fontWeight: currentTab === 'orders' ? 'bold' : 'normal' }}
                >
                  Gestión de Pedidos
                </button>
                <button 
                  onClick={() => setCurrentTab('reports')} 
                  style={{ color: currentTab === 'reports' ? '#007bff' : '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: currentTab === 'reports' ? 'bold' : 'normal' }}
                >
                  Reportes Financieros
                </button>
              </span>
            )}
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', color: '#ff6b6b', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
        </div>

        <Navbar />

        {/* Renderizado condicional con la prop user inyectada */}
        {currentTab === 'reports' && user.role === 'admin' ? (
          <AdminReports />
        ) : (
          <OrdersDashboard user={user} />
        )}
      </div>
    </BusinessProvider>
  );
}