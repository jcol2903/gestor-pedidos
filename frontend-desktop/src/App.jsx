import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { Navbar } from './components/Navbar';
import { OrdersDashboard } from './components/OrdersDashboard';
import { AdminReports } from './components/AdminReports';
import { ThemeToggle } from './components/ThemeToggle'; // <--- Importante

function MainLayout({ user, currentTab, setCurrentTab, handleLogout }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
        color: isDarkMode ? '#e0e0e0' : '#333333',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Barra superior de sesión */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 2rem',
          background: isDarkMode ? '#1a1a1a' : '#212529',
          color: '#fff',
          borderBottom: isDarkMode ? '1px solid #333' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span>
            Usuario: <strong>{user.username}</strong> ({user.role})
          </span>
          
          {user.role === 'admin' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setCurrentTab('orders')}
                style={{
                  color: currentTab === 'orders' ? '#3b82f6' : '#9ca3af',
                  background: 'none',
                  border: 'none',
                  borderBottom: currentTab === 'orders' ? '2px solid #3b82f6' : '2px solid transparent',
                  padding: '0.2rem 0',
                  cursor: 'pointer',
                  fontWeight: currentTab === 'orders' ? 'bold' : 'normal',
                }}
              >
                Gestión de Pedidos
              </button>
              <button
                onClick={() => setCurrentTab('reports')}
                style={{
                  color: currentTab === 'reports' ? '#3b82f6' : '#9ca3af',
                  background: 'none',
                  border: 'none',
                  borderBottom: currentTab === 'reports' ? '2px solid #3b82f6' : '2px solid transparent',
                  padding: '0.2rem 0',
                  cursor: 'pointer',
                  fontWeight: currentTab === 'reports' ? 'bold' : 'normal',
                }}
              >
                Reportes Financieros
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Reemplazamos el botón anterior por nuestro interruptor animado */}
          <ThemeToggle />

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: '#ff6b6b',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <Navbar />

      {currentTab === 'reports' && user.role === 'admin' ? (
        <AdminReports />
      ) : (
        <OrdersDashboard user={user} />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('orders');

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
    <ThemeProvider>
      <BusinessProvider>
        <MainLayout
          user={user}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          handleLogout={handleLogout}
        />
      </BusinessProvider>
    </ThemeProvider>
  );
}