const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { fileURLToPath } = require('url');

// Handle __dirname in ES Modules or CommonJS safely
const dbPath = path.join(process.cwd(), 'health_tracker.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDB();
  }
});

function initDB() {
  // Use serialize to ensure tables are created in order
  db.serialize(() => {
    // Enable WAL mode for performance
    db.run('PRAGMA journal_mode = WAL');

    db.run(`
      CREATE TABLE IF NOT EXISTS hygiene_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        task_name TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('multivitamin', 'otc')),
        image_path TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        image_path TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS custom_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL
      )
    `);
  });
}

module.exports = db;