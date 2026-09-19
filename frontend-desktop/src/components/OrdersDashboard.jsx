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

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob')) return url;
  return `${API_BASE_URL}${url}`;
};

export const OrdersDashboard = ({ user }) => {
  const { activeBusiness } = useBusiness();
  const { isDarkMode } = useTheme();

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
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  // Estados de Filtros Renovados
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', total: '', deposit: '', delivery_date: '',
    status_id: 1, order_type: 'Mini Torta', flavor: '', filling: '',
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
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
      })
      .catch(() => {
      setOrders([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [activeBusiness]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/statuses`)
      .then((res) => res.json())
      .then((data) => setStatuses(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error cargando estados:', err);
        setStatuses([]);
      });
  }, []);

  const handleStatusChange = (statusName) => {
    if (selectedStatuses.includes(statusName)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== statusName));
    } else {
      setSelectedStatuses([...selectedStatuses, statusName]);
    }
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setStartDate('');
    setEndDate('');
  };

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer_name: order.customer_name || '',
        phone: order.phone || '',
        total: order.total || '',
        deposit: order.deposit || 0,
        delivery_date: formatToDatetimeLocal(order.delivery_date),
        status_id: order.status_id || 1,
        order_type: order.order_type || 'Mini Torta',
        flavor: order.flavor || '',
        filling: order.filling || '',
        topper_text: order.topper_text || '',
        height_cm: order.height_cm ? Math.round(Number(order.height_cm)).toString() : '15', // Convierte ej. 7.00 a "7"
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
        status_id: 1, order_type: 'Mini Torta', flavor: '', filling: '',
        topper_text: '', height_cm: '15', delivery_type: 'Recogida', address: '',
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
    // Normalizar ambas fechas a medianoche (00:00:00) para comparar solo días del calendario
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deliveryStart = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());
    // Diferencia exacta en días
    const diffTime = deliveryStart - todayStart;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: '⚠️ Vencido', bg: '#f8d7da', color: '#721c24' };
    if (diffDays === 0) return { text: '🚨 ¡Entrega HOY!', bg: '#f8d7da', color: '#721c24' };
    if (diffDays === 1) return { text: '⏳ Falta 1 día', bg: '#fff3cd', color: '#856404' };
    if (diffDays <= 5) return { text: `⏳ Faltan ${diffDays} días`, bg: '#fff3cd', color: '#856404' };
    return null;
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(o.status);
    if (!matchesStatus) return false;

    if (!o.delivery_date) return !startDate && !endDate;

    const orderDateStr = o.delivery_date.split('T')[0];
    const matchesStart = !startDate || orderDateStr >= startDate;
    const matchesEnd = !endDate || orderDateStr <= endDate;

    return matchesStart && matchesEnd;
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: theme.bg, minHeight: '100vh', color: theme.text, transition: 'all 0.3s ease' }}>
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
          {/* Opción 2: Barra Ultra Compacta */}
          <div style={{ ...styles.filterBarContainer, padding: '0.7rem 1.2rem', backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.85rem' }}>Estados:</strong>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(statuses || []).map((st) => {
                    const isChecked = selectedStatuses.includes(st.name);
                    return (
                      <label key={st.id} style={{ ...styles.checkboxInline, backgroundColor: isChecked ? '#0d6efd' : theme.inputBg, color: isChecked ? '#fff' : theme.text, borderColor: isChecked ? '#0d6efd' : theme.border }}>
                        <input type="checkbox" checked={isChecked} onChange={() => handleStatusChange(st.name)} style={{ display: 'none' }} />
                        {st.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>Entrega:</strong>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...styles.inputFilter, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, colorScheme: isDarkMode ? 'dark' : 'light' }} />
                <span>-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...styles.inputFilter, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, colorScheme: isDarkMode ? 'dark' : 'light' }} />
                
                {(selectedStatuses.length > 0 || startDate || endDate) && (
                  <button onClick={resetFilters} style={styles.btnClearCompact}>✕</button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <p>Cargando pedidos...</p>
          ) : filteredOrders.length === 0 ? (
            <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, color: theme.subtext }}>No se encontraron pedidos.</div>
          ) : (
            <div style={styles.grid}>
              {(filteredOrders || []).map((o) => {
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

                    <div style={styles.actionsWrapper}>
                      <div style={styles.managementRow}>
                        <button 
                          onClick={() => handleOpenModal(o)} 
                          style={styles.btnSecondaryFull}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(o.id)} 
                          style={styles.btnDeleteFull}
                          title="Eliminar pedido"
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={styles.whatsappRow}>
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
                          📦 Listo / Entrega
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

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
                  <select 
                    value={formData.height_cm} 
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })} 
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  >
                    <option value="7">7 cm</option>
                    <option value="15">15 cm</option>
                    <option value="20">20 cm</option>
                  </select>
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
              <select 
                value={formData.status_id} 
                onChange={(e) => setFormData({ ...formData, status_id: Number(e.target.value) })} 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              >
                {(statuses || []).map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
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
  filterBarContainer: { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.2rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid transparent' },
  filterSection: { display: 'flex', flexDirection: 'column' },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '0.85rem', userSelect: 'none', transition: 'all 0.2s ease' },
  inputFilter: { padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc', marginLeft: '0.4rem' },
  btnClear: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' },
  card: { padding: '1.2rem', borderRadius: '8px', transition: 'all 0.3s ease' },
  cardImage: { width: '100%', height: '240px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.8rem' },
  priceContainer: { margin: '0.8rem 0', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' },
  emptyState: { padding: '2rem', borderRadius: '8px', textAlign: 'center' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' },
  actionsWrapper: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem', width: '100%', boxSizing: 'border-box'},
  whatsappRow: { display: 'flex', gap: '0.4rem', width: '100%'},
  managementRow: { display: 'flex', gap: '0.4rem', width: '100%'},
  btnWhatsApp: { flex: 1, color: '#fff', border: 'none', padding: '0.45rem 0.2rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', textAlign: 'center', whiteSpace: 'nowrap'},
  btnSecondaryFull: { flex: 1, backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.45rem 0.2rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', textAlign: 'center'},
  btnDeleteFull: { flex: 1, backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.45rem 0.2rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', textAlign: 'center'},
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { padding: '2rem', borderRadius: '8px', width: '440px' },
  checkboxInline: { display: 'inline-flex', alignItems: 'center', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease'},
  btnClearCompact: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}
};