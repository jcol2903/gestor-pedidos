import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useBusiness } from '../BusinessContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const AdminReports = () => {
  const { activeBusiness } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, [activeBusiness]);

  if (loading) return <p style={{ padding: '2rem' }}>Cargando métricas...</p>;

  const totalMoney = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  // Agrupación por fechas
  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.delivery_date ? order.delivery_date.split('T')[0] : 'Sin Fecha';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Agrupación por tipo de producto (Exclusivo para Kirala Tortas / ID 1)
  const orderTypesCount = {
    'Mini Torta': 0,
    'Cajita Regalo': 0,
    'Kit Para Decorar': 0
  };

  orders.forEach((o) => {
    if (o.order_type && orderTypesCount[o.order_type] !== undefined) {
      orderTypesCount[o.order_type] += 1;
    }
  });

  const barChartData = {
    labels: Object.keys(ordersByDate),
    datasets: [{ label: `Pedidos`, data: Object.values(ordersByDate), backgroundColor: activeBusiness.themeColor || '#e83e8c' }]
  };

  const doughnutData = {
    labels: Object.keys(orderTypesCount),
    datasets: [{
      data: Object.values(orderTypesCount),
      backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe']
    }]
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{  
          color: '#212529', // <--- Cambiado para que resalte
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>📊 Reportes - {activeBusiness.name}</h2>
      
      <div style={styles.metricsContainer}>
        <div style={styles.metricCard}>
          <h4>Ingresos Totales</h4>
          <p style={{ fontSize: '2rem', color: '#28a745', fontWeight: 'bold' }}>${totalMoney.toLocaleString()}</p>
        </div>
        <div style={styles.metricCard}>
          <h4>Total Pedidos</h4>
          <p style={{ fontSize: '2rem', color: '#007bff', fontWeight: 'bold' }}>{orders.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ ...styles.chartBox, flex: 2 }}>
          <Bar data={barChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Pedidos por Fecha' } } }} />
        </div>

        {/* Solo renderiza la gráfica de tipo de pedido si es Kirala Tortas */}
        {activeBusiness.id === 1 && (
          <div style={{ ...styles.chartBox, flex: 1 }}>
            <h4 style={{ textAlign: 'center' }}>Distribución por Tipo de Pedido</h4>
            <Doughnut data={doughnutData} />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  metricsContainer: { display: 'flex', gap: '2rem', marginBottom: '2rem' },
  metricCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  chartBox: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
};