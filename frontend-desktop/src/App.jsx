import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { Navbar } from './components/Navbar';
import { OrdersDashboard } from './components/OrdersDashboard';
import { AdminReports } from './components/AdminReports';
import { BusinessManagement } from './components/BusinessManagement';
import { ThemeToggle } from './components/ThemeToggle';

function MainLayout({ user, currentTab, setCurrentTab, handleLogout }) {
  const { isDarkMode } = useTheme();
  const [adminTab, setAdminTab] = useState('businesses'); // 'businesses' | 'orders'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
        color: isDarkMode ? '#e0e0e0' : '#333333',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Contenido Principal con flex: 1 para empujar el footer hacia abajo */}
      <main style={{ flex: 1 }}>
        {/* Barra Superior de Usuario y Navegación Principal */}
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 2rem',
            background: isDarkMode ? '#1a1a1a' : '#212529',
            color: '#fff',
            borderBottom: isDarkMode ? '1px solid #333' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span>
              Usuario: <strong>{user.username}</strong>
            </span>
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {/* Subpestañas para Administrador cuando está en la vista de Pedidos */}
        {user?.role === 'admin' && currentTab === 'orders' && (
          <div style={{ padding: '1rem 2rem 0 2rem', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setAdminTab('businesses')} 
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                backgroundColor: adminTab === 'businesses' ? '#0d6efd' : (isDarkMode ? '#2d2d2d' : '#e9ecef'),
                color: adminTab === 'businesses' ? '#fff' : (isDarkMode ? '#aaa' : '#333')
              }}
            >
              🏢 Administración de Negocios
            </button>
            <button 
              onClick={() => setAdminTab('orders')} 
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                backgroundColor: adminTab === 'orders' ? '#0d6efd' : (isDarkMode ? '#2d2d2d' : '#e9ecef'),
                color: adminTab === 'orders' ? '#fff' : (isDarkMode ? '#aaa' : '#333')
              }}
            >
              📦 Pedidos por Negocio
            </button>
          </div>
        )}

        {/* Navbar de selección de negocio (Se oculta en la vista de gestión de negocios) */}
        {(currentTab === 'reports' || (user?.role === 'admin' && adminTab === 'orders') || user?.role !== 'admin') && (
          <Navbar />
        )}

        {/* Contenido Dinámico de la Vista */}
        {currentTab === 'reports' ? (
          <AdminReports user={user} />
        ) : user?.role === 'admin' ? (
          adminTab === 'businesses' ? <BusinessManagement /> : <OrdersDashboard user={user} />
        ) : (
          <OrdersDashboard user={user} />
        )}
      </main>

      {/* Pie de página dentro del contenedor flex principal */}
      <footer
        style={{
          padding: '1rem 2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          color: isDarkMode ? '#aaaaaa' : '#666666',
          borderTop: isDarkMode ? '1px solid #333333' : '1px solid #e5e7eb',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Sistema de Gestión de Pedidos. Todos los derechos reservados. Jortiz
        </p>
      </footer>
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