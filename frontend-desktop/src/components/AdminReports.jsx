import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useBusiness } from '../BusinessContext';
import { useTheme } from '../ThemeContext';
import { API_BASE_URL } from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const AdminReports = () => {
  const { activeBusiness } = useBusiness();
  const { isDarkMode } = useTheme();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros por fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Configuración de tema dinámico
  const theme = useMemo(() => ({
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#212529',
    subtext: isDarkMode ? '#aaaaaa' : '#555555',
    gridColor: isDarkMode ? '#333333' : '#e0e0e0',
    shadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
    inputBg: isDarkMode ? '#2d2d2d' : '#f8f9fa',
    inputBorder: isDarkMode ? '#444444' : '#ced4da',
  }), [isDarkMode]);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener pedidos:', err);
        setOrders([]);
        setLoading(false);
      });
  }, [activeBusiness]);

  // Filtrado por Rango de Fechas
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.delivery_date ? o.delivery_date.split('T')[0] : '';
      const matchesStart = !startDate || orderDate >= startDate;
      const matchesEnd = !endDate || orderDate <= endDate;
      return matchesStart && matchesEnd;
    });
  }, [orders, startDate, endDate]);

  // Evaluamos el tipo de negocio activo (id 1 = Tortas, id !== 1 = Amigurumis)
  const isTortas = activeBusiness?.id === 1;

  // Cálculos de métricas
  const { totalMoney, totalBalancePending, ordersByDate, categoryCounts } = useMemo(() => {
    let money = 0;
    let balancePending = 0;
    const dates = {};
    const categories = {};

    filteredOrders.forEach((o) => {
      if (o.status !== 'Cancelado') {
        money += Number(o.total || 0);
        const balance = Number(o.total || 0) - Number(o.deposit || 0);
        if (balance > 0) balancePending += balance;
      }

      // Conteo por fechas de entrega
      const date = o.delivery_date ? o.delivery_date.split('T')[0] : 'Sin Fecha';
      dates[date] = (dates[date] || 0) + 1;

      // Conteo dinámico: Tipo de Pedido (Tortas) o Altura (Amigurumis)
      if (isTortas) {
        const type = o.order_type || 'Mini Torta';
        categories[type] = (categories[type] || 0) + 1;
      } else {
        const height = o.height_cm ? Math.round(Number(o.height_cm)) : null;
        const key = height ? `${height} cm` : 'Sin Especificar';
        categories[key] = (categories[key] || 0) + 1;
      }
    });

    return {
      totalMoney: money,
      totalBalancePending: balancePending,
      ordersByDate: dates,
      categoryCounts: categories,
    };
  }, [filteredOrders, isTortas]);

  // Datos para gráfico de barras (Pedidos por fecha)
  const barChartData = {
    labels: Object.keys(ordersByDate),
    datasets: [
      {
        label: 'Pedidos',
        data: Object.values(ordersByDate),
        backgroundColor: activeBusiness?.themeColor || '#e83e8c',
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: theme.text } },
      title: {
        display: true,
        text: 'Pedidos por Fecha',
        color: theme.text,
        font: { size: 16 },
      },
    },
    scales: {
      x: { ticks: { color: theme.subtext }, grid: { color: theme.gridColor } },
      y: { ticks: { color: theme.subtext }, grid: { color: theme.gridColor } },
    },
  };

  // Datos para gráfico de dona (Dinámico según negocio)
  const doughnutData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0', '#9966ff'],
        borderColor: theme.cardBg,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: theme.text } },
    },
  };

  if (loading) {
    return <p style={{ padding: '2rem', color: theme.text }}>Cargando métricas...</p>;
  }

  return (
    <div style={{ padding: '2rem', color: theme.text, transition: 'all 0.3s ease' }}>
      <h2 style={{ color: theme.text, fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        📊 Reportes - {activeBusiness?.name || 'Mi Negocio'}
      </h2>

      {/* Controles de filtro por fecha */}
      <div style={{ ...styles.filterContainer, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
        <div style={styles.filterGroup}>
          <label style={{ color: theme.subtext, fontSize: '0.9rem' }}>Desde:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder, colorScheme: isDarkMode ? 'dark' : 'light' }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={{ color: theme.subtext, fontSize: '0.9rem' }}>Hasta:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder, colorScheme: isDarkMode ? 'dark' : 'light' }}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            style={styles.clearBtn}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas */}
      <div style={styles.metricsContainer}>
        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
          <h4 style={{ color: theme.subtext, margin: 0 }}>Ingresos Totales</h4>
          <p style={{ fontSize: '2rem', color: '#28a745', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            ${totalMoney.toLocaleString()}
          </p>
        </div>

        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
          <h4 style={{ color: theme.subtext, margin: 0 }}>Saldo Pendiente</h4>
          <p style={{ fontSize: '2rem', color: '#dc3545', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            ${totalBalancePending.toLocaleString()}
          </p>
        </div>

        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
          <h4 style={{ color: theme.subtext, margin: 0 }}>Total Pedidos</h4>
          <p style={{ fontSize: '2rem', color: '#007bff', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            {filteredOrders.length}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ ...styles.chartBox, backgroundColor: theme.cardBg, boxShadow: theme.shadow, flex: 2, minWidth: '300px' }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        {Object.keys(categoryCounts).length > 0 && (
          <div style={{ ...styles.chartBox, backgroundColor: theme.cardBg, boxShadow: theme.shadow, flex: 1, minWidth: '280px' }}>
            <h4 style={{ textAlign: 'center', color: theme.text, marginBottom: '1rem' }}>
              {isTortas ? 'Distribución por Tipo de Pedido' : 'Distribución por Altura de Amigurumi'}
            </h4>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  filterContainer: { display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  input: { padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid', outline: 'none' },
  clearBtn: { padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', backgroundColor: '#6c757d', color: '#fff', cursor: 'pointer', alignSelf: 'flex-end' },
  metricsContainer: { display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' },
  metricCard: { padding: '1.5rem', borderRadius: '8px', flex: 1, minWidth: '200px', transition: 'all 0.3s ease' },
  chartBox: { padding: '1.5rem', borderRadius: '8px', transition: 'all 0.3s ease' },
};