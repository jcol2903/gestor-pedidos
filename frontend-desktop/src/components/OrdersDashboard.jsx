import React, { useEffect, useState } from 'react';
import { useBusiness } from '../BusinessContext';

export const OrdersDashboard = ({ user }) => {
  const { activeBusiness } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    total: '',
    deposit: '',
    delivery_date: '',
    status: 'Pendiente',
    order_type: 'Mini Torta'
  });

  // Reemplaza por la IP de tu servidor si accedes por Wi-Fi
  const SERVER_URL = 'http://localhost:3000';
  //const SERVER_URL = 'http://192.168.1.254:3000';

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${SERVER_URL}/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [activeBusiness]);

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer_name: order.customer_name,
        phone: order.phone || '',
        total: order.total || '',
        deposit: order.deposit || 0,
        delivery_date: order.delivery_date || '',
        status: order.status,
        order_type: order.order_type || 'Mini Torta'
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customer_name: '',
        phone: '',
        total: '',
        deposit: '',
        delivery_date: '',
        status: 'Pendiente',
        order_type: 'Mini Torta'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingOrder ? `${SERVER_URL}/api/orders/${editingOrder.id}` : `${SERVER_URL}/api/orders`;
    const method = editingOrder ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, business_id: activeBusiness.id })
    }).then(() => {
      setShowModal(false);
      fetchOrders();
    });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    const matchesDate = !filterDate || (o.delivery_date && o.delivery_date.startsWith(filterDate));
    return matchesStatus && matchesDate;
  });

  // Cálculo de saldo restante
  const pendingBalance = Math.max(0, Number(formData.total || 0) - Number(formData.deposit || 0));

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Pedidos de {activeBusiness.name}</h3>
        {user?.role === 'gestion' && (
          <button onClick={() => handleOpenModal()} style={styles.btnPrimary}>+ Nuevo Pedido</button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div style={styles.filterBar}>
        <label>
          <strong>Filtrar por Estado:</strong>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.select}>
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Listo para entregar">Listo para entregar</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </label>

        <label style={{ marginLeft: '1rem' }}>
          <strong>Filtrar por Fecha Entrega:</strong>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.inputFilter} />
        </label>

        {(filterStatus !== 'Todos' || filterDate !== '') && (
          <button onClick={() => { setFilterStatus('Todos'); setFilterDate(''); }} style={styles.btnClear}>Limpiar Filtros</button>
        )}
      </div>

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.emptyState}>No se encontraron pedidos.</div>
      ) : (
        <div style={styles.grid}>
          {filteredOrders.map((o) => {
            const balance = Number(o.total || 0) - Number(o.deposit || 0);
            return (
              <div key={o.id} style={{ ...styles.card, borderTop: `4px solid ${activeBusiness.themeColor || '#007bff'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>Pedido #{o.consecutive || o.id}</h4>
                  <span style={styles.badge(o.status)}>{o.status}</span>
                </div>
                <p><strong>Cliente:</strong> {o.customer_name}</p>
                {activeBusiness.id === 1 && <p><strong>Tipo:</strong> {o.order_type || 'No especificado'}</p>}
                <p><strong>Contacto:</strong> {o.phone || 'Sin contacto'}</p>
                <p><strong>Entrega:</strong> {o.delivery_date ? new Date(o.delivery_date).toLocaleString() : 'N/A'}</p>
                
                <div style={styles.priceContainer}>
                  <p style={{ margin: 0 }}><strong>Total:</strong> ${Number(o.total).toLocaleString()}</p>
                  <p style={{ margin: 0, color: '#17a2b8' }}><strong>Abono:</strong> ${Number(o.deposit || 0).toLocaleString()}</p>
                  <p style={{ margin: 0, color: balance > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {balance > 0 ? `Resta: $${balance.toLocaleString()}` : '✅ Pagado Total'}
                  </p>
                </div>

                <button onClick={() => handleOpenModal(o)} style={styles.btnSecondary}>Modificar</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{editingOrder ? `Modificar Pedido #${editingOrder.consecutive || editingOrder.id}` : 'Nuevo Pedido'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              <label>Cliente:</label>
              <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required style={styles.input} />

              {activeBusiness.id === 1 && (
                <>
                  <label>Tipo de Pedido:</label>
                  <select value={formData.order_type} onChange={(e) => setFormData({ ...formData, order_type: e.target.value })} style={styles.input}>
                    <option value="Mini Torta">Mini Torta</option>
                    <option value="Cajita Regalo">Cajita Regalo</option>
                    <option value="Kit Para Decorar">Kit Para Decorar</option>
                  </select>
                </>
              )}

              <label>Contacto (Teléfono, Instagram, Correo):</label>
              <input 
                type="text" 
                placeholder="Ej. 3001234567, @usuario_ig, correo@ejemplo.com"
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                style={styles.input} 
              />
              
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Valor Total ($):</label>
                  <input type="number" value={formData.total} onChange={(e) => setFormData({ ...formData, total: e.target.value })} required style={styles.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Abono ($):</label>
                  <input type="number" value={formData.deposit} onChange={(e) => setFormData({ ...formData, deposit: e.target.value })} placeholder="0" style={styles.input} />
                </div>
              </div>

              {/* Indicador de saldo que resta por pagar */}
              <div style={styles.balanceInfo}>
                <span>Saldo Pendiente:</span>
                <strong>${pendingBalance.toLocaleString()}</strong>
              </div>

              <label>Fecha de Entrega:</label>
              <input type="datetime-local" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} required style={styles.input} />
              
              <label>Estado:</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={styles.input}>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Listo para entregar">Listo para entregar</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterBar: { display: 'flex', gap: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', alignItems: 'center' },
  select: { padding: '0.4rem', borderRadius: '4px', marginLeft: '0.5rem' },
  inputFilter: { padding: '0.4rem', borderRadius: '4px', marginLeft: '0.5rem' },
  btnClear: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
  priceContainer: { margin: '0.8rem 0', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem' },
  balanceInfo: { backgroundColor: '#e9ecef', padding: '0.5rem 0.8rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' },
  emptyState: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', color: '#666' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '420px' },
  badge: (status) => ({ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: status === 'Entregado' ? '#e6f4ea' : status === 'Cancelado' ? '#fce8e6' : '#e8f0fe', color: status === 'Entregado' ? '#137333' : status === 'Cancelado' ? '#c5221f' : '#1a73e8' })
};