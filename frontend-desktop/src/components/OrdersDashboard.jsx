import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useBusiness } from '../BusinessContext';
import { useTheme } from '../ThemeContext';
import { OrdersCalendar } from './OrdersCalendar';
import { API_BASE_URL } from '../config';
import { badge } from './ColoresEstados';
import { getWhatsAppUrl, sendCreationMessage, sendReadyMessage } from './Helpers';

const formatToDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper universal para imágenes (Cloudinary http, archivo local blob o backend antiguo)
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob')) return url;
  return `${API_BASE_URL}${url}`;
};

export const OrdersDashboard = ({ user }) => {
  const { activeBusiness } = useBusiness();
  const { isDarkMode } = useTheme();

  // Paleta dinámica basada en el estado de isDarkMode
  const theme = {
    bg: isDarkMode ? '#121212' : '#f8f9fa',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#333333',
    subtext: isDarkMode ? '#aaaaaa' : '#666666',
    inputBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    border: isDarkMode ? '#333333' : '#cccccc',
    priceBg: isDarkMode ? '#282828' : '#f1f3f5'
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'calendar'

  // Estados de Filtros
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', total: '', deposit: '', delivery_date: '',
    status: 'Pendiente', order_type: 'Mini Torta', flavor: '', filling: '',
    topper_text: '', height_cm: '', delivery_type: 'Recogida', address: '',
    neighborhood: '', notes: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchOrders = () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/orders/${activeBusiness.id}`)
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
        customer_name: order.customer_name || '',
        phone: order.phone || '',
        total: order.total || '',
        deposit: order.deposit || 0,
        delivery_date: formatToDatetimeLocal(order.delivery_date),
        status: order.status || 'Pendiente',
        order_type: order.order_type || 'Mini Torta',
        flavor: order.flavor || '',
        filling: order.filling || '',
        topper_text: order.topper_text || '',
        height_cm: order.height_cm || '',
        delivery_type: order.delivery_type || 'Recogida',
        address: order.address || '',
        neighborhood: order.neighborhood || '',
        notes: order.notes || ''
      });
      setImagePreview(order.image_url || null);
    } else {
      setEditingOrder(null);
      setFormData({
        customer_name: '', phone: '', total: '', deposit: '', delivery_date: '',
        status: 'Pendiente', order_type: 'Mini Torta', flavor: '', filling: '',
        topper_text: '', height_cm: '', delivery_type: 'Recogida', address: '',
        neighborhood: '', notes: ''
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingOrder ? `${API_BASE_URL}/api/orders/${editingOrder.id}` : `${API_BASE_URL}/api/orders`;
    const method = editingOrder ? 'PUT' : 'POST';

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append('business_id', activeBusiness.id);

    if (selectedImage) {
      data.append('image', selectedImage);
    } else if (editingOrder && editingOrder.image_url) {
      data.append('existing_image_url', editingOrder.image_url);
    }

    fetch(url, { method, body: data })
      .then((res) => res.json())
      .then(() => {
        setShowModal(false);
        fetchOrders();
        Swal.fire({
          icon: 'success',
          title: editingOrder ? 'Pedido Actualizado' : 'Pedido Creado',
          text: 'Los cambios se guardaron correctamente.',
          timer: 1800,
          showConfirmButton: false
        });
      })
      .catch(() => Swal.fire('Error', 'No se pudo guardar el pedido.', 'error'));
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar pedido?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${API_BASE_URL}/api/orders/${id}`, { method: 'DELETE' })
          .then(() => {
            fetchOrders();
            Swal.fire('Eliminado', 'El pedido fue removido.', 'success');
          });
      }
    });
  };

  const getDeliveryAlert = (dateStr, status) => {
    if (!dateStr || status === 'Entregado' || status === 'Cancelado') return null;
    const now = new Date();
    const delivery = new Date(dateStr);
    const diffDays = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: '⚠️ Vencido', bg: '#f8d7da', color: '#721c24' };
    if (diffDays === 0) return { text: '🚨 ¡Entrega HOY!', bg: '#f8d7da', color: '#721c24' };
    if (diffDays <= 5) return { text: `⏳ Faltan ${diffDays} días`, bg: '#fff3cd', color: '#856404' };
    return null;
  };

  const openWhatsApp = (order) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const balance = Number(order.total || 0) - Number(order.deposit || 0);
    const message = `Hola ${order.customer_name}, te saludamos de *${activeBusiness?.name || 'nuestro negocio'}*.
Tu pedido *#${order.consecutive || order.id}* está en estado: *${order.status}*.
*Total:* $${Number(order.total).toLocaleString()} | *Saldo Pendiente:* $${balance.toLocaleString()}.`;

    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    const matchesDate = !filterDate || (o.delivery_date && o.delivery_date.startsWith(filterDate));
    return matchesStatus && matchesDate;
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: theme.bg, minHeight: '100vh', color: theme.text, transition: 'all 0.3s ease' }}>
      {/* Encabezado con Interruptor de Modo Oscuro y Vistas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3>Pedidos de {activeBusiness?.name || 'Cargando...'}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => setViewMode('cards')} 
            style={viewMode === 'cards' ? styles.btnPrimary : styles.btnSecondary}
          >
            📋 Tarjetas
          </button>
          <button 
            onClick={() => setViewMode('calendar')} 
            style={viewMode === 'calendar' ? styles.btnPrimary : styles.btnSecondary}
          >
            📅 Calendario
          </button>
          {user?.role === 'gestion' && (
            <button onClick={() => handleOpenModal()} style={{ ...styles.btnPrimary, backgroundColor: '#0d6efd' }}>
              + Nuevo Pedido
            </button>
          )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <OrdersCalendar API_BASE_URL={API_BASE_URL} isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Barra de Filtros */}
          <div style={{ ...styles.filterBar, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label>
              <strong>Estado:</strong>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...styles.select, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Listo para entregar">Listo para entregar</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </label>

            <label style={{ marginLeft: '1rem' }}>
              <strong>Fecha Entrega:</strong>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ ...styles.inputFilter, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, colorScheme: isDarkMode ? 'dark' : 'light' }} />
            </label>

            {(filterStatus !== 'Todos' || filterDate !== '') && (
              <button onClick={() => { setFilterStatus('Todos'); setFilterDate(''); }} style={styles.btnClear}>Limpiar</button>
            )}
          </div>

          {loading ? (
            <p>Cargando pedidos...</p>
          ) : filteredOrders.length === 0 ? (
            <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, color: theme.subtext }}>No se encontraron pedidos.</div>
          ) : (
            <div style={styles.grid}>
              {filteredOrders.map((o) => {
                const balance = Number(o.total || 0) - Number(o.deposit || 0);
                const alert = getDeliveryAlert(o.delivery_date, o.status);

                return (
                  <div key={o.id} style={{ ...styles.card, backgroundColor: theme.cardBg, borderTop: `4px solid ${activeBusiness?.themeColor || '#007bff'}`, boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.08)' }}>
                    {alert && (
                      <div style={{ backgroundColor: alert.bg, color: alert.color, padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
                        {alert.text}
                      </div>
                    )}

                    {o.image_url && (
                      <img src={getImageSrc(o.image_url)} alt="Referencia" style={styles.cardImage} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: '0.5rem 0', color: theme.text }}>Pedido #{o.consecutive || o.id}</h4>
                      <span style={badge(o.status)}>{o.status}</span>
                    </div>

                    <p style={{ color: theme.text }}><strong>Cliente:</strong> {o.customer_name}</p>
                    <p style={{ color: theme.text }}><strong>Contacto:</strong> {o.phone || 'N/A'}</p>
                    
                    {activeBusiness?.id === 1 ? (
                      <>
                        <p style={{ color: theme.text }}><strong>Tipo:</strong> {o.order_type || 'Mini Torta'}</p>
                        {(o.flavor || o.filling) && (
                          <p style={{ fontSize: '0.85rem', color: theme.subtext }}>
                            🍰 {o.flavor || 'Sabor no especificado'} | {o.filling || 'Sin relleno'}
                          </p>
                        )}
                      </>
                    ) : (
                      o.height_cm && <p style={{ color: theme.text }}><strong>Altura:</strong> {o.height_cm} cm</p>
                    )}

                    <p style={{ color: theme.text }}><strong>Modalidad:</strong> {o.delivery_type} {o.delivery_type === 'Domicilio' && o.neighborhood ? `(${o.neighborhood})` : ''}</p>
                    <p style={{ color: theme.text }}><strong>Entrega:</strong> {o.delivery_date ? new Date(o.delivery_date).toLocaleString() : 'N/A'}</p>

                    <div style={{ ...styles.priceContainer, backgroundColor: theme.priceBg }}>
                      <p style={{ margin: 0, color: theme.text }}><strong>Total:</strong> ${Number(o.total).toLocaleString()}</p>
                      <p style={{ margin: 0, color: '#17a2b8' }}><strong>Abono:</strong> ${Number(o.deposit || 0).toLocaleString()}</p>
                      <p style={{ margin: 0, color: balance > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                        {balance > 0 ? `Pendiente: $${balance.toLocaleString()}` : '✅ Pagado'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.8rem' }}>
                      <button 
                        onClick={() => sendCreationMessage(o, activeBusiness)} 
                        style={{ ...styles.btnWhatsApp, backgroundColor: '#25D366' }}
                        title="Enviar confirmación de pedido creado"
                      >
                        📲 Confirmación
                      </button>
                      <button 
                        onClick={() => sendReadyMessage(o)} 
                        style={{ ...styles.btnWhatsApp, backgroundColor: '#128C7E' }}
                        title="Avisar que el pedido está listo para entregar"
                      >
                        📦 Listo/Entrega
                      </button>
                      <button onClick={() => handleOpenModal(o)} style={styles.btnSecondary}>✏️</button>
                      <button onClick={() => handleDelete(o.id)} style={styles.btnDelete}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Completo Adaptable */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.cardBg, color: theme.text, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{editingOrder ? `Modificar Pedido #${editingOrder.consecutive || editingOrder.id}` : 'Nuevo Pedido'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '1rem' }}>
              
              <label>Cliente:</label>
              <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />

              <label>Contacto (Teléfono, Instagram, Correo):</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />

              {activeBusiness?.id === 1 ? (
                <>
                  <label>Tipo de Pedido:</label>
                  <select value={formData.order_type} onChange={(e) => setFormData({ ...formData, order_type: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                    <option value="Mini Torta">Mini Torta</option>
                    <option value="Cajita Regalo">Cajita Regalo</option>
                    <option value="Kit Para Decorar">Kit Para Decorar</option>
                  </select>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Sabor bizcocho" value={formData.flavor} onChange={(e) => setFormData({ ...formData, flavor: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                    <input type="text" placeholder="Relleno" value={formData.filling} onChange={(e) => setFormData({ ...formData, filling: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                  </div>
                  <input type="text" placeholder="Texto o temática para el Topper" value={formData.topper_text} onChange={(e) => setFormData({ ...formData, topper_text: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </>
              ) : (
                <>
                  <label>Altura del Amigurumi (cm):</label>
                  <input type="number" value={formData.height_cm} onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })} placeholder="Ej. 20" style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </>
              )}

              <label>Modalidad de Entrega:</label>
              <select value={formData.delivery_type} onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="Recogida">Recogida en punto</option>
                <option value="Domicilio">Domicilio</option>
              </select>

              {formData.delivery_type === 'Domicilio' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="Dirección completa" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                  <input type="text" placeholder="Barrio" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Total ($):</label>
                  <input type="number" value={formData.total} onChange={(e) => setFormData({ ...formData, total: e.target.value })} required style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Abono ($):</label>
                  <input type="number" value={formData.deposit} onChange={(e) => setFormData({ ...formData, deposit: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </div>
              </div>

              <label>Fecha y Hora de Entrega:</label>
              <input type="datetime-local" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} required style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, colorScheme: isDarkMode ? 'dark' : 'light' }} />

              <label>Estado:</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Listo para entregar">Listo para entregar</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              <label>Notas Internas / Alérgenos:</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />

              <label>Foto de Referencia:</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              {imagePreview && (
                <img src={getImageSrc(imagePreview)} alt="Previsualización" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px', marginTop: '0.5rem' }} />
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Guardar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterBar: { display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', alignItems: 'center', border: '1px solid transparent' },
  select: { padding: '0.4rem', borderRadius: '4px', marginLeft: '0.5rem' },
  inputFilter: { padding: '0.4rem', borderRadius: '4px', marginLeft: '0.5rem' },
  btnClear: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' },
  card: { padding: '1.2rem', borderRadius: '8px', transition: 'all 0.3s ease' },
  cardImage: { width: '100%', height: '240px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.8rem' },
  priceContainer: { margin: '0.8rem 0', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' },
  emptyState: { padding: '2rem', borderRadius: '8px', textAlign: 'center' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' },
  btnWhatsApp: { backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnDelete: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '5px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { padding: '2rem', borderRadius: '8px', width: '440px' },
  //badge: (status) => ({ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: status === 'Entregado' ? '#e6f4ea' : status === 'Cancelado' ? '#fce8e6' : '#e8f0fe', color: status === 'Entregado' ? '#137333' : status === 'Cancelado' ? '#c5221f' : '#1a73e8' })
};