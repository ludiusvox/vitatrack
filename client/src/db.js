import { get, set, del } from 'idb-keyval';

const DB_KEY = 'health_tracker_v2';

// Helper to get DB from IndexedDB
export const getDB = async () => {
  try {
    const data = await get(DB_KEY);
    return data || { hygiene: [], medications: [], prescriptions: [], logs: [] };
  } catch (e) {
    console.error('Failed to load IndexedDB:', e);
    return { hygiene: [], medications: [], prescriptions: [], logs: [] };
  }
};

export const saveDB = async (data) => {
  try {
    await set(DB_KEY, data);
  } catch (e) {
    console.error('Failed to save IndexedDB:', e);
  }
};

// Logs
export const getLogsByDate = async (date) => {
  const db = await getDB();
  return (db.logs || []).filter(l => l.date === date);
};

export const saveLog = async (date, type, itemId, completed) => {
  const db = await getDB();
  if (!db.logs) db.logs = [];
  const idx = db.logs.findIndex(l => l.date === date && l.type === type && l.itemId === itemId);
  if (idx >= 0) {
    db.logs[idx].completed = completed;
  } else {
    db.logs.push({ date, type, itemId, completed });
  }
  await saveDB(db);
};

// Hygiene Tasks
export const getHygieneByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'hygiene');
  const allHygiene = [...(db.hygiene || [])];
  return allHygiene.map(h => ({
    ...h,
    completed: logs.find(l => l.itemId === h.task_name)?.completed || false
  }));
};

export const saveHygieneTask = async (task) => {
  const db = await getDB();
  if (!db.hygiene) db.hygiene = [];
  const idx = db.hygiene.findIndex(t => t.task_name === task.task_name);
  if (idx < 0) {
    db.hygiene.push({ task_name: task.task_name });
    await saveDB(db);
  }
  await saveLog(task.date, 'hygiene', task.task_name, task.completed);
};

export const deleteHygieneTask = async (taskName) => {
  const db = await getDB();
  db.hygiene = (db.hygiene || []).filter(t => t.task_name !== taskName);
  db.logs = (db.logs || []).filter(l => !(l.type === 'hygiene' && l.itemId === taskName));
  await saveDB(db);
};

// Medications
export const getMedsByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'medication');
  return (db.medications || []).map(m => ({
    ...m,
    completed: logs.find(l => l.itemId === m.id)?.completed || false
  }));
};

export const saveMed = async (med, date) => {
  const db = await getDB();
  if (!db.medications) db.medications = [];
  const idx = db.medications.findIndex(m => m.id === med.id);
  if (idx >= 0) {
    db.medications[idx] = { ...db.medications[idx], ...med };
  } else {
    db.medications.push(med);
  }
  await saveDB(db);
  if (date) {
    await saveLog(date, 'medication', med.id, med.completed);
  }
};

export const deleteMed = async (id) => {
  const db = await getDB();
  db.medications = (db.medications || []).filter(m => m.id !== id);
  db.logs = (db.logs || []).filter(l => !(l.type === 'medication' && l.itemId === id));
  await saveDB(db);
};

// Prescriptions
export const getPrescriptionsByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'prescription');
  return (db.prescriptions || []).map(p => ({
    ...p,
    completed: logs.find(l => l.itemId === p.id)?.completed || false
  }));
};

export const savePrescription = async (rx, date) => {
  const db = await getDB();
  if (!db.prescriptions) db.prescriptions = [];
  const idx = db.prescriptions.findIndex(p => p.id === rx.id);
  if (idx >= 0) {
    db.prescriptions[idx] = { ...db.prescriptions[idx], ...rx };
  } else {
    db.prescriptions.push(rx);
  }
  await saveDB(db);
  if (date) {
    await saveLog(date, 'prescription', rx.id, rx.completed);
  }
};

export const deletePrescription = async (id) => {
  const db = await getDB();
  db.prescriptions = (db.prescriptions || []).filter(p => p.id !== id);
  db.logs = (db.logs || []).filter(l => !(l.type === 'prescription' && l.itemId === id));
  await saveDB(db);
};
