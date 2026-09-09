const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Crear carpeta 'uploads' si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Servir la carpeta de imágenes estáticas para que el frontend las muestre
app.use('/uploads', express.static(uploadsDir));

// Configuración de Multer para almacenar imágenes con su extensión
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Conexión a Base de Datos
const dbPath = path.resolve(__dirname, 'kirala_gestor.db');
console.log('Conectando a la base de datos en:', dbPath); // Esto te mostrará la ruta exacta en consola

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al conectar a SQLite:', err.message);
  else console.log('Conectado a la base de datos SQLite.');
});

// Inicialización de la Tabla y Migración de Nuevas Columnas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      consecutive INTEGER,
      customer_name TEXT,
      phone TEXT,
      total REAL,
      deposit REAL DEFAULT 0,
      delivery_date TEXT,
      status TEXT,
      order_type TEXT,
      flavor TEXT,
      filling TEXT,
      topper_text TEXT,
      height_cm REAL,
      delivery_type TEXT,
      address TEXT,
      neighborhood TEXT,
      notes TEXT,
      image_url TEXT
    )
  `);

  // Asegurar la existencia de nuevas columnas si la tabla ya existía
  const columns = [
    'consecutive INTEGER',
    'deposit REAL DEFAULT 0',
    'order_type TEXT',
    'flavor TEXT',
    'filling TEXT',
    'topper_text TEXT',
    'height_cm REAL',
    'delivery_type TEXT',
    'address TEXT',
    'neighborhood TEXT',
    'notes TEXT',
    'image_url TEXT'
  ];

  columns.forEach((col) => {
    db.run(`ALTER TABLE orders ADD COLUMN ${col}`, () => {});
  });
});

// POST: Autenticación de usuarios
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validación básica de credenciales
  if (username === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      user: {
        username: 'admin',
        role: 'admin',
        name: 'Administrador'
      }
    });
  } else if (username === 'gestion' && password === 'gestion123') {
    return res.json({
      success: true,
      user: {
        username: 'gestion',
        role: 'gestion',
        name: 'Usuario Gestión'
      }
    });
  }

  // Si las credenciales no coinciden
  return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// GET: Obtener pedidos por Negocio
app.get('/api/orders/:business_id', (req, res) => {
  const { business_id } = req.params;
  db.all(
    'SELECT * FROM orders WHERE business_id = ? ORDER BY delivery_date ASC',
    [business_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST: Crear un nuevo pedido (Soporta imagen adjunta)
app.post('/api/orders', upload.single('image'), (req, res) => {
  const {
    business_id, customer_name, phone, total, deposit, delivery_date, status,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes
  } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const maxQuery = `SELECT MAX(consecutive) as max_consecutive FROM orders WHERE business_id = ?`;

  db.get(maxQuery, [business_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const nextConsecutive = (row && row.max_consecutive ? row.max_consecutive : 0) + 1;

    const insertQuery = `
      INSERT INTO orders (
        business_id, consecutive, customer_name, phone, total, deposit, delivery_date, status,
        order_type, flavor, filling, topper_text, height_cm, delivery_type, address, neighborhood, notes, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      insertQuery,
      [
        business_id, nextConsecutive, customer_name, phone, total, deposit || 0, delivery_date, status || 'Pendiente',
        order_type || null, flavor || null, filling || null, topper_text || null, height_cm || null,
        delivery_type || 'Recogida', address || null, neighborhood || null, notes || null, imageUrl
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, consecutive: nextConsecutive, message: 'Pedido registrado con éxito' });
      }
    );
  });
});

// PUT: Modificar pedido existente
app.put('/api/orders/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const {
    customer_name, phone, total, deposit, delivery_date, status,
    order_type, flavor, filling, topper_text, height_cm, delivery_type,
    address, neighborhood, notes, existing_image_url
  } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing_image_url || null;

  const updateQuery = `
    UPDATE orders SET 
      customer_name = ?, phone = ?, total = ?, deposit = ?, delivery_date = ?, status = ?,
      order_type = ?, flavor = ?, filling = ?, topper_text = ?, height_cm = ?, delivery_type = ?,
      address = ?, neighborhood = ?, notes = ?, image_url = ?
    WHERE id = ?
  `;

  db.run(
    updateQuery,
    [
      customer_name, phone, total, deposit || 0, delivery_date, status,
      order_type || null, flavor || null, filling || null, topper_text || null, height_cm || null,
      delivery_type || 'Recogida', address || null, neighborhood || null, notes || null, imageUrl, id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Pedido actualizado correctamente' });
    }
  );
});

// DELETE: Eliminar pedido
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pedido eliminado correctamente' });
  });
});

// Ruta temporal para ver TODO el contenido de la tabla orders
app.get('/api/debug-orders', (req, res) => {
  db.all('SELECT id, business_id, customer_name FROM orders', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en http://0.0.0.0:${PORT}`);
});