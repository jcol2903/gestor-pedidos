const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'secreto_local_kirala_2026';
const db = new sqlite3.Database('./kirala_gestor.db');

// Inicializar tablas y datos por defecto
db.serialize(async () => {
  // Tabla Usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Tabla Negocios
  db.run(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  // Tabla Pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT,
      delivery_date TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'Pendiente',
      FOREIGN KEY (business_id) REFERENCES businesses (id)
    )
  `);

  // Insertar negocios base si no existen
  db.get('SELECT COUNT(*) AS count FROM businesses', (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO businesses (id, name) VALUES (1, 'Kirala Tortas'), (2, 'Kirala Amigurumis')`);
    }
  });

  // Insertar usuarios iniciales
  db.get('SELECT COUNT(*) AS count FROM users', async (err, row) => {
    if (row && row.count === 0) {
      const passAdmin = await bcrypt.hash('admin123', 10);
      const passGestion = await bcrypt.hash('kirala2026', 10);

      db.run(`INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')`, [passAdmin]);
      db.run(`INSERT INTO users (username, password, role) VALUES ('gestion', ?, 'gestion')`, [passGestion]);
      console.log('Usuarios base creados: admin / gestion');
    }
  });

  db.run(`ALTER TABLE orders ADD COLUMN order_type TEXT`, (err) => {
    // Si la columna ya existe, SQLite simplemente ignorará este comando
  });

  db.run(`ALTER TABLE orders ADD COLUMN consecutive INTEGER`, (err) => {
    // Rellenar consecutivos para registros antiguos que estén en NULL
    db.all(`SELECT id, business_id FROM orders ORDER BY id ASC`, [], (err, rows) => {
      if (rows && rows.length > 0) {
        const counters = {};
        rows.forEach((row) => {
          counters[row.business_id] = (counters[row.business_id] || 0) + 1;
          db.run(`UPDATE orders SET consecutive = ? WHERE id = ? AND consecutive IS NULL`, [counters[row.business_id], row.id]);
        });
      }
    });
  });

  // 1. Agregar columna de abono 'deposit' si no existe
  db.run(`ALTER TABLE orders ADD COLUMN deposit REAL DEFAULT 0`);

  // 2. Modificar endpoint POST /api/orders
  app.post('/api/orders', (req, res) => {
    const { business_id, customer_name, phone, deposit, delivery_date, total, status, order_type } = req.body;

    const maxQuery = `SELECT MAX(consecutive) as max_consecutive FROM orders WHERE business_id = ?`;

    db.get(maxQuery, [business_id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const nextConsecutive = (row && row.max_consecutive ? row.max_consecutive : 0) + 1;

      const insertQuery = `
        INSERT INTO orders (business_id, consecutive, customer_name, phone, deposit, delivery_date, total, status, order_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        insertQuery,
        [business_id, nextConsecutive, customer_name, phone, deposit || 0, delivery_date, total, status || 'Pendiente', order_type || null],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: this.lastID, consecutive: nextConsecutive, message: 'Pedido registrado con éxito' });
        }
      );
    });
  });
});

// Endpoint de Inicio de Sesión
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  });
});

// --- CRUD DE PEDIDOS ---

// 1. OBTENER PEDIDOS POR NEGOCIO (Ruta que te faltaba)
app.get('/api/orders/:businessId', (req, res) => {
  const { businessId } = req.params;
  const query = 'SELECT * FROM orders WHERE business_id = ? ORDER BY id DESC';

  db.all(query, [businessId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. CREAR UN PEDIDO
app.post('/api/orders', (req, res) => {
  const { business_id, customer_name, phone, delivery_date, total, status, order_type } = req.body;

  // Obtener el consecutivo actual más alto para ESTE negocio específico
  const maxQuery = `SELECT MAX(consecutive) as max_consecutive FROM orders WHERE business_id = ?`;

  db.get(maxQuery, [business_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const nextConsecutive = (row && row.max_consecutive ? row.max_consecutive : 0) + 1;

    const insertQuery = `
      INSERT INTO orders (business_id, consecutive, customer_name, phone, delivery_date, total, status, order_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      insertQuery,
      [business_id, nextConsecutive, customer_name, phone, delivery_date, total, status || 'Pendiente', order_type || null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, consecutive: nextConsecutive, message: 'Pedido registrado con éxito' });
      }
    );
  });
});

// 3. EDITAR UN PEDIDO EXISTENTE
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { customer_name, phone, deposit, delivery_date, total, status, order_type } = req.body;

  const query = `
    UPDATE orders 
    SET customer_name = ?, phone = ?, deposit = ?, delivery_date = ?, total = ?, status = ?, order_type = ?
    WHERE id = ?
  `;

  db.run(query, [customer_name, phone, deposit || 0, delivery_date, total, status, order_type, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pedido actualizado correctamente' });
  });
});

// 4. ELIMINAR UN PEDIDO
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pedido eliminado' });
  });
});

// --- REPORTES PARA ADMINISTRADOR ---

app.get('/api/reports/summary', (req, res) => {
  const query = `
    SELECT 
      b.name as business_name,
      COUNT(o.id) as total_orders,
      SUM(CASE WHEN o.status != 'Cancelado' THEN o.total ELSE 0 END) as total_revenue,
      SUM(CASE WHEN o.status = 'Pendiente' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN o.status = 'Entregado' THEN 1 ELSE 0 END) as delivered_orders
    FROM businesses b
    LEFT JOIN orders o ON b.id = o.business_id
    GROUP BY b.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});