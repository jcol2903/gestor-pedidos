import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useTheme } from '../ThemeContext';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob')) return url;
  return `${API_BASE_URL}${url}`;
};

export const BusinessManagement = () => {
  const { isDarkMode } = useTheme();

  const theme = {
    bg: isDarkMode ? '#121212' : '#f8f9fa',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#333333',
    subtext: isDarkMode ? '#aaaaaa' : '#666666',
    inputBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    border: isDarkMode ? '#333333' : '#cccccc',
  };

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    phone: '',
    location: '',
    social_media: '',
    theme_color: '#007bff'
  });

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchBusinesses = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/businesses`)
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleOpenModal = (business = null) => {
    if (business) {
      setEditingBusiness(business);
      setFormData({
        name: business.name || '',
        owner_name: business.owner_name || '',
        phone: business.phone || '',
        location: business.location || '',
        social_media: business.social_media || '',
        theme_color: business.theme_color || '#007bff'
      });
      setLogoPreview(business.logo_url || null);
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        owner_name: '',
        phone: '',
        location: '',
        social_media: '',
        theme_color: '#007bff'
      });
      setLogoPreview(null);
    }
    setSelectedLogo(null);
    setShowModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingBusiness 
      ? `${API_BASE_URL}/api/businesses/${editingBusiness.id}` 
      : `${API_BASE_URL}/api/businesses`;
    const method = editingBusiness ? 'PUT' : 'POST';

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));

    if (selectedLogo) {
      data.append('logo', selectedLogo);
    } else if (editingBusiness && editingBusiness.logo_url) {
      data.append('existing_logo_url', editingBusiness.logo_url);
    }

    fetch(url, { method, body: data })
      .then((res) => res.json())
      .then(() => {
        setShowModal(false);
        fetchBusinesses();
        Swal.fire({
          icon: 'success',
          title: editingBusiness ? 'Negocio Actualizado' : 'Negocio Creado',
          text: 'Los cambios se guardaron correctamente.',
          timer: 1800,
          showConfirmButton: false
        });
      })
      .catch(() => Swal.fire('Error', 'No se pudo guardar el negocio.', 'error'));
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar negocio?',
      text: 'Se eliminarán también todos los pedidos asociados a este negocio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${API_BASE_URL}/api/businesses/${id}`, { method: 'DELETE' })
          .then(() => {
            fetchBusinesses();
            Swal.fire('Eliminado', 'El negocio fue removido.', 'success');
          });
      }
    });
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: theme.bg, minHeight: '100vh', color: theme.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>🏢 Gestión de Negocios</h2>
        <button onClick={() => handleOpenModal()} style={styles.btnPrimary}>
          + Nuevo Negocio
        </button>
      </div>

      {loading ? (
        <p>Cargando negocios...</p>
      ) : (
        <div style={styles.grid}>
          {businesses.map((b) => (
            <div 
              key={b.id} 
              style={{ 
                ...styles.card, 
                backgroundColor: theme.cardBg, 
                borderTop: `4px solid ${b.theme_color || '#007bff'}` 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {b.logo_url ? (
                  <img 
                    src={getImageSrc(b.logo_url)} 
                    alt={b.name} 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ ...styles.avatarPlaceholder, backgroundColor: b.theme_color || '#007bff' }}>
                    {b.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, color: theme.text }}>{b.name}</h3>
                  <small style={{ color: theme.subtext }}>ID: #{b.id}</small>
                </div>
              </div>

              <p><strong>👤 Dueño:</strong> {b.owner_name || 'N/A'}</p>
              <p><strong>📞 Contacto:</strong> {b.phone || 'N/A'}</p>
              <p><strong>📍 Ubicación:</strong> {b.location || 'N/A'}</p>
              <p><strong>📱 Redes:</strong> {b.social_media || 'N/A'}</p>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => handleOpenModal(b)} style={styles.btnSecondary}>✏️ Editar</button>
                <button onClick={() => handleDelete(b.id)} style={styles.btnDelete}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.cardBg, color: theme.text }}>
            <h3>{editingBusiness ? `Editar ${editingBusiness.name}` : 'Nuevo Negocio'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '1rem' }}>
              
              <label>Nombre del Negocio *:</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} 
              />

              <label>Nombre del Propietario:</label>
              <input 
                type="text" 
                value={formData.owner_name} 
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} 
              />

              <label>Celular / Teléfono de Contacto:</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} 
              />

              <label>Ubicación / Dirección:</label>
              <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} 
              />

              <label>Redes Sociales (ej. @negocio):</label>
              <input 
                type="text" 
                value={formData.social_media} 
                onChange={(e) => setFormData({ ...formData, social_media: e.target.value })} 
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} 
              />

              <label>Color Distintivo:</label>
              <input 
                type="color" 
                value={formData.theme_color} 
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })} 
                style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }} 
              />

              <label>Logo / Imagen del Negocio:</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              {logoPreview && (
                <img src={getImageSrc(logoPreview)} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem' }} />
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Guardar Negocio</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  card: { padding: '1.2rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  avatarPlaceholder: { width: '60px', height: '60px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { flex: 1, backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.45rem', borderRadius: '5px', cursor: 'pointer' },
  btnDelete: { flex: 1, backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.45rem', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { padding: '2rem', borderRadius: '8px', width: '440px', maxHeight: '90vh', overflowY: 'auto' }
};