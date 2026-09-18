const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool, types } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

types.setTypeParser(1114, function(stringValue) {
  return stringValue; // Retorna la fecha exacta sin restar las 5 horas
});

// ================= MIDDLEWARES ================= //
app.use(cors());
app.use(express.json());

// ================= CONFIGURACIÓN CLOUDINARY ================= //
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gestor_pedidos_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const upload = multer({ storage });

// ================= CONEXIÓN A POSTGRESQL / SUPABASE ================= //
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error conectando a PostgreSQL/Supabase:', err.stack);
  }
  // Forzar zona horaria de Colombia en PostgreSQL
  client.query("SET timezone = 'America/Bogota';", (tzErr) => {
    if (tzErr) console.error('Error estableciendo timezone:', tzErr);
    else console.log('✅ Conectado exitosamente a la base de datos en Supabase (Zona Horaria: America/Bogota)');
    release();
  });
});

// ================= INICIALIZACIÓN DE TABLAS ================= //
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        business_id INT,
        consecutive INT,
        customer_name VARCHAR(150),
        phone VARCHAR(50),
        total NUMERIC(10, 2),
        deposit NUMERIC(10, 2) DEFAULT 0,
        delivery_date TIMESTAMP,
        status_id INT DEFAULT 1,
        order_type VARCHAR(50),
        flavor VARCHAR(100),
        filling VARCHAR(100),
        topper_text TEXT,
        height_cm NUMERIC(5, 2),
        delivery_type VARCHAR(50) DEFAULT 'Recogida',
        address TEXT,
        neighborhood VARCHAR(100),
        notes TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Estructura de tabla "orders" verificada en Supabase.');
  } catch (error) {
    console.error('❌ Error inicializando tabla en PostgreSQL:', error.message);
  }
};
initDB();

// ================= RUTAS / ENDPOINTS ================= //

// POST: Autenticación de usuarios
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      user: { username: 'admin', role: 'admin', name: 'Administrador' }
    });
  } else if (username === 'gestion' && password === 'gestion123') {
    return res.json({
      success: true,
      user: { username: 'gestion', role: 'gestion', name: 'Usuario Gestión' }
    });
  }

  return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// GET: Obtener lista de estados
app.get('/api/statuses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM order_statuses ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estados' });
  }
});

// GET: Obtener pedidos por Negocio con INNER JOIN de estados
app.get('/api/orders/:businessId', async (req, res) => {
  const { businessId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT o.*, s.name AS status 
       FROM orders o 
       JOIN order_statuses s ON o.status_id = s.id 
       WHERE o.business_id = $1 
       ORDER BY o.id DESC`,
      [businessId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear un nuevo pedido
app.post('/api/orders', upload.single('image'), async (req, res) => {
  const {
    business_id, customer_name, phone, total, deposit, delivery_date, status_id,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes
  } = req.body;

  const imageUrl = req.file ? req.file.path : null;

  try {
    const maxResult = await pool.query(
      'SELECT MAX(consecutive) as max_consecutive FROM orders WHERE business_id = $1',
      [business_id]
    );
    const nextConsecutive = (maxResult.rows[0].max_consecutive || 0) + 1;
    
    const finalStatusId = status_id ? Number(status_id) : 1;
    const finalHeight = height_cm ? Number(height_cm) : null;
    
    const insertQuery = `
      INSERT INTO orders (
        business_id, consecutive, customer_name, phone, total, deposit, delivery_date, status_id,
        order_type, flavor, filling, topper_text, height_cm, delivery_type, address, neighborhood, notes, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
    `;

    const values = [
      business_id, nextConsecutive, customer_name, phone, total || 0, deposit || 0,
      delivery_date || null, finalStatusId, order_type || null, flavor || null,
      filling || null, topper_text || null, finalHeight, delivery_type || 'Recogida',
      address || null, neighborhood || null, notes || null, imageUrl
    ];

    const newOrder = await pool.query(insertQuery, values);
    res.json({
      id: newOrder.rows[0].id,
      consecutive: nextConsecutive,
      message: 'Pedido registrado con éxito'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Modificar pedido existente
app.put('/api/orders/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const {
    customer_name, phone, total, deposit, delivery_date, status_id,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes, existing_image_url
  } = req.body;

  const imageUrl = req.file ? req.file.path : existing_image_url || null;
  const finalStatusId = status_id ? Number(status_id) : 1;
  const finalHeight = height_cm ? Number(height_cm) : null;

  const updateQuery = `
    UPDATE orders SET 
      customer_name = $1, phone = $2, total = $3, deposit = $4, delivery_date = $5, status_id = $6,
      order_type = $7, flavor = $8, filling = $9, topper_text = $10, height_cm = $11, delivery_type = $12,
      address = $13, neighborhood = $14, notes = $15, image_url = $16
    WHERE id = $17
  `;

  try {
    await pool.query(updateQuery, [
      customer_name, phone, total || 0, deposit || 0, delivery_date || null, finalStatusId,
      order_type || null, flavor || null, filling || null, topper_text || null, finalHeight,
      delivery_type || 'Recogida', address || null, neighborhood || null, notes || null, imageUrl, id
    ]);
    res.json({ message: 'Pedido actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Eliminar pedido
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Ruta de diagnóstico
app.get('/api/debug-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, business_id, customer_name FROM orders');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= RUTAS DE NEGOCIOS (BUSINESSES) ================= //

// GET: Obtener todos los negocios
app.get('/api/businesses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM businesses ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener negocios: ' + error.message });
  }
});

// POST: Crear un nuevo negocio (con subida opcional de logo a Cloudinary)
app.post('/api/businesses', upload.single('logo'), async (req, res) => {
  const { name, owner_name, phone, location, social_media, theme_color } = req.body;
  const logoUrl = req.file ? req.file.path : null;

  try {
    const query = `
      INSERT INTO businesses (name, owner_name, phone, location, social_media, logo_url, theme_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      name,
      owner_name || null,
      phone || null,
      location || null,
      social_media || null,
      logoUrl,
      theme_color || '#007bff'
    ];

    const { rows } = await pool.query(query, values);
    res.json({ message: 'Negocio creado con éxito', business: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el negocio: ' + error.message });
  }
});

// PUT: Actualizar un negocio existente
app.put('/api/businesses/:id', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  const { name, owner_name, phone, location, social_media, theme_color, existing_logo_url } = req.body;
  const logoUrl = req.file ? req.file.path : existing_logo_url || null;

  try {
    const query = `
      UPDATE businesses SET 
        name = $1, owner_name = $2, phone = $3, location = $4, 
        social_media = $5, logo_url = $6, theme_color = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      name,
      owner_name || null,
      phone || null,
      location || null,
      social_media || null,
      logoUrl,
      theme_color || '#007bff',
      id
    ];

    const { rows } = await pool.query(query, values);
    res.json({ message: 'Negocio actualizado correctamente', business: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el negocio: ' + error.message });
  }
});

// DELETE: Eliminar un negocio (Elimina sus pedidos en cascada)
app.delete('/api/businesses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
    res.json({ message: 'Negocio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el negocio: ' + error.message });
  }
});

// ================= INICIALIZACIÓN DEL SERVIDOR ================= //
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});