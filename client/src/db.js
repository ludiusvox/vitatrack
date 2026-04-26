const DB_KEY = 'health_tracker_v1';

export const getDB = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : { hygiene: [], medications: [], prescriptions: [], logs: [] };
  } catch (e) {
    console.error('Failed to load local DB:', e);
    return { hygiene: [], medications: [], prescriptions: [], logs: [] };
  }
};

export const saveDB = (data) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local DB:', e);
  }
};

// Logs
export const getLogsByDate = (date) => {
  const db = getDB();
  return (db.logs || []).filter(l => l.date === date);
};

export const saveLog = (date, type, itemId, completed) => {
  const db = getDB();
  if (!db.logs) db.logs = [];
  const idx = db.logs.findIndex(l => l.date === date && l.type === type && l.itemId === itemId);
  if (idx >= 0) {
    db.logs[idx].completed = completed;
  } else {
    db.logs.push({ date, type, itemId, completed });
  }
  saveDB(db);
};

// Hygiene Tasks (Hygiene is slightly different as it has defaults)
export const getHygieneByDate = (date) => {
  const db = getDB();
  const logs = getLogsByDate(date).filter(l => l.type === 'hygiene');
  // Combine stored hygiene items with logs
  const allHygiene = [...(db.hygiene || [])];
  return allHygiene.map(h => ({
    ...h,
    completed: logs.find(l => l.itemId === h.task_name)?.completed || false
  }));
};

export const saveHygieneTask = (task) => {
  const db = getDB();
  if (!db.hygiene) db.hygiene = [];
  const idx = db.hygiene.findIndex(t => t.task_name === task.task_name);
  if (idx < 0) {
    db.hygiene.push({ task_name: task.task_name });
    saveDB(db);
  }
  saveLog(task.date, 'hygiene', task.task_name, task.completed);
};

export const deleteHygieneTask = (taskName) => {
  const db = getDB();
  db.hygiene = (db.hygiene || []).filter(t => t.task_name !== taskName);
  db.logs = (db.logs || []).filter(l => !(l.type === 'hygiene' && l.itemId === taskName));
  saveDB(db);
};

// Medications
export const getAllMeds = () => getDB().medications || [];
export const getMedsByDate = (date) => {
  const db = getDB();
  const logs = getLogsByDate(date).filter(l => l.type === 'medication');
  return (db.medications || []).map(m => ({
    ...m,
    completed: logs.find(l => l.itemId === m.id)?.completed || false
  }));
};

export const saveMed = (med, date) => {
  const db = getDB();
  const idx = db.medications.findIndex(m => m.id === med.id);
  if (idx >= 0) {
    db.medications[idx] = { ...db.medications[idx], ...med };
  } else {
    db.medications.push(med);
  }
  saveDB(db);
  if (date) {
    saveLog(date, 'medication', med.id, med.completed);
  }
};

export const deleteMed = (id) => {
  const db = getDB();
  db.medications = (db.medications || []).filter(m => m.id !== id);
  db.logs = (db.logs || []).filter(l => !(l.type === 'medication' && l.itemId === id));
  saveDB(db);
};

// Prescriptions
export const getPrescriptionsByDate = (date) => {
  const db = getDB();
  const logs = getLogsByDate(date).filter(l => l.type === 'prescription');
  return (db.prescriptions || []).map(p => ({
    ...p,
    completed: logs.find(l => l.itemId === p.id)?.completed || false
  }));
};

export const savePrescription = (rx, date) => {
  const db = getDB();
  const idx = db.prescriptions.findIndex(p => p.id === rx.id);
  if (idx >= 0) {
    db.prescriptions[idx] = { ...db.prescriptions[idx], ...rx };
  } else {
    db.prescriptions.push(rx);
  }
  saveDB(db);
  if (date) {
    saveLog(date, 'prescription', rx.id, rx.completed);
  }
};

export const deletePrescription = (id) => {
  const db = getDB();
  db.prescriptions = (db.prescriptions || []).filter(p => p.id !== id);
  db.logs = (db.logs || []).filter(l => !(l.type === 'prescription' && l.itemId === id));
  saveDB(db);
};

// Helper to convert file to base64 string for local storage
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
