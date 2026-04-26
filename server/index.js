const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper to get current date string YYYY-MM-DD
const getDateStr = () => new Date().toISOString().split('T')[0];

// --- Hygiene Tasks ---
app.get('/api/hygiene', (req, res) => {
  const rows = db.prepare('SELECT * FROM hygiene_tasks WHERE date = ? ORDER BY task_name').all(req.query.date || getDateStr());
  res.json(rows);
});
app.post('/api/hygiene', (req, res) => {
  const { date, task_name } = req.body;
  db.prepare('INSERT INTO hygiene_tasks (date, task_name) VALUES (?, ?)').run(date || getDateStr(), task_name);
  res.json({ success: true });
});
app.put('/api/hygiene/:id', (req, res) => {
  const { completed } = req.body;
  db.prepare('UPDATE hygiene_tasks SET completed = ? WHERE id = ?').run(completed, req.params.id);
  res.json({ success: true });
});

// --- Medications (Vitamins/OTC) ---
app.get('/api/medications', (req, res) => {
  const rows = db.prepare('SELECT * FROM medications WHERE date = ? ORDER BY type').all(req.query.date || getDateStr());
  res.json(rows);
});
app.post('/api/medications', upload.single('image'), (req, res) => {
  const { name, type, date } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare('INSERT INTO medications (date, name, type, image_path) VALUES (?, ?, ?, ?)').run(date || getDateStr(), name, type, imagePath);
  res.json({ success: true });
});
app.put('/api/medications/:id', (req, res) => {
  const { completed } = req.body;
  db.prepare('UPDATE medications SET completed = ? WHERE id = ?').run(completed, req.params.id);
  res.json({ success: true });
});

// --- Prescriptions ---
app.get('/api/prescriptions', (req, res) => {
  const rows = db.prepare('SELECT * FROM prescriptions WHERE date = ? ORDER BY time_slot').all(req.query.date || getDateStr());
  res.json(rows);
});
app.post('/api/prescriptions', upload.single('image'), (req, res) => {
  const { name, time_slot, date } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare('INSERT INTO prescriptions (date, name, time_slot, image_path) VALUES (?, ?, ?, ?)').run(date || getDateStr(), name, time_slot, imagePath);
  res.json({ success: true });
});
app.put('/api/prescriptions/:id', (req, res) => {
  const { completed } = req.body;
  db.prepare('UPDATE prescriptions SET completed = ? WHERE id = ?').run(completed, req.params.id);
  res.json({ success: true });
});

// --- Custom Times ---
app.get('/api/custom-times', (req, res) => {
  const rows = db.prepare('SELECT * FROM custom_times WHERE date = ?').all(req.query.date || getDateStr());
  res.json(rows);
});
app.post('/api/custom-times', (req, res) => {
  const { date, time } = req.body;
  db.prepare('INSERT INTO custom_times (date, time) VALUES (?, ?)').run(date || getDateStr(), time);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
