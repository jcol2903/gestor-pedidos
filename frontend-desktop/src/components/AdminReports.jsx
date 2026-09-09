import React, { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const AdminReports = () => {
  const { activeBusiness } = useBusiness();
  const { isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paleta dinámica según el modo activo
  const theme = {
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#212529',
    subtext: isDarkMode ? '#aaaaaa' : '#555555',
    gridColor: isDarkMode ? '#333333' : '#e0e0e0',
    shadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener pedidos:', err);
        setLoading(false);
      });
  }, [activeBusiness]);

  if (loading) {
    return <p style={{ padding: '2rem', color: theme.text }}>Cargando métricas...</p>;
  }

  const totalMoney = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.delivery_date ? order.delivery_date.split('T')[0] : 'Sin Fecha';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const orderTypesCount = {
    'Mini Torta': 0,
    'Cajita Regalo': 0,
    'Kit Para Decorar': 0,
  };

  orders.forEach((o) => {
    if (o.order_type && orderTypesCount[o.order_type] !== undefined) {
      orderTypesCount[o.order_type] += 1;
    }
  });

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

  // Configuración dinámica de ejes y colores para Chart.js
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
      x: {
        ticks: { color: theme.subtext },
        grid: { color: theme.gridColor },
      },
      y: {
        ticks: { color: theme.subtext },
        grid: { color: theme.gridColor },
      },
    },
  };

  const doughnutData = {
    labels: Object.keys(orderTypesCount),
    datasets: [
      {
        data: Object.values(orderTypesCount),
        backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe'],
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

  return (
    <div style={{ padding: '2rem', color: theme.text, transition: 'all 0.3s ease' }}>
      <h2 style={{ color: theme.text, fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        📊 Reportes - {activeBusiness?.name || 'Mi Negocio'}
      </h2>

      <div style={styles.metricsContainer}>
        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
          <h4 style={{ color: theme.subtext, margin: 0 }}>Ingresos Totales</h4>
          <p style={{ fontSize: '2rem', color: '#28a745', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            ${totalMoney.toLocaleString()}
          </p>
        </div>
        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, boxShadow: theme.shadow }}>
          <h4 style={{ color: theme.subtext, margin: 0 }}>Total Pedidos</h4>
          <p style={{ fontSize: '2rem', color: '#007bff', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            {orders.length}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ ...styles.chartBox, backgroundColor: theme.cardBg, boxShadow: theme.shadow, flex: 2, minWidth: '300px' }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        {activeBusiness?.id === 1 && (
          <div style={{ ...styles.chartBox, backgroundColor: theme.cardBg, boxShadow: theme.shadow, flex: 1, minWidth: '280px' }}>
            <h4 style={{ textAlign: 'center', color: theme.text, marginBottom: '1rem' }}>
              Distribución por Tipo de Pedido
            </h4>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  metricsContainer: { display: 'flex', gap: '2rem', marginBottom: '2rem' },
  metricCard: { padding: '1.5rem', borderRadius: '8px', flex: 1, transition: 'all 0.3s ease' },
  chartBox: { padding: '1.5rem', borderRadius: '8px', transition: 'all 0.3s ease' },
};