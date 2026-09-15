const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log('✅ Conectado exitosamente a la base de datos en Supabase');
  release();
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
        status VARCHAR(50) DEFAULT 'Pendiente',
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

// GET: Obtener pedidos por Negocio
app.get('/api/orders/:business_id', async (req, res) => {
  const { business_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE business_id = $1 ORDER BY delivery_date ASC',
      [business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Crear un nuevo pedido (Imagen guardada en Cloudinary)
app.post('/api/orders', upload.single('image'), async (req, res) => {
  const {
    business_id, customer_name, phone, total, deposit, delivery_date, status,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes
  } = req.body;

  // Cloudinary retorna la URL HTTPS pública en req.file.path
  const imageUrl = req.file ? req.file.path : null;

  try {
    const maxResult = await pool.query(
      'SELECT MAX(consecutive) as max_consecutive FROM orders WHERE business_id = $1',
      [business_id]
    );
    const nextConsecutive = (maxResult.rows[0].max_consecutive || 0) + 1;

    const insertQuery = `
      INSERT INTO orders (
        business_id, consecutive, customer_name, phone, total, deposit, delivery_date, status,
        order_type, flavor, filling, topper_text, height_cm, delivery_type, address, neighborhood, notes, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
    `;

    const values = [
      business_id, nextConsecutive, customer_name, phone, total || 0, deposit || 0,
      delivery_date || null, status || 'Pendiente', order_type || null, flavor || null,
      filling || null, topper_text || null, height_cm || null, delivery_type || 'Recogida',
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
    customer_name, phone, total, deposit, delivery_date, status,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes, existing_image_url
  } = req.body;

  // Si se sube un nuevo archivo usa req.file.path, si no conserva la URL actual
  const imageUrl = req.file ? req.file.path : existing_image_url || null;

  const updateQuery = `
    UPDATE orders SET 
      customer_name = $1, phone = $2, total = $3, deposit = $4, delivery_date = $5, status = $6,
      order_type = $7, flavor = $8, filling = $9, topper_text = $10, height_cm = $11, delivery_type = $12,
      address = $13, neighborhood = $14, notes = $15, image_url = $16
    WHERE id = $17
  `;

  try {
    await pool.query(updateQuery, [
      customer_name, phone, total || 0, deposit || 0, delivery_date || null, status,
      order_type || null, flavor || null, filling || null, topper_text || null, height_cm || null,
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

// ================= INICIALIZACIÓN DEL SERVIDOR ================= //
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});