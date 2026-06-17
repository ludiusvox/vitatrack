import { get, set } from 'idb-keyval';

const DB_KEY = 'health_tracker_v2';

// Helper to safely initialize and return DB state
export const getDB = async () => {
  try {
    const data = await get(DB_KEY);
    // Ensure all expected keys exist with safe defaults
    return { 
      hygiene: Array.isArray(data?.hygiene) ? data.hygiene : [],
      medications: Array.isArray(data?.medications) ? data.medications : [],
      prescriptions: Array.isArray(data?.prescriptions) ? data.prescriptions : [],
      logs: Array.isArray(data?.logs) ? data.logs : [],
      bedroom: Array.isArray(data?.bedroom) ? data.bedroom : [],
      autoHabits: Array.isArray(data?.autoHabits) ? data.autoHabits : [],
      laundryData: typeof data?.laundryData === 'object' && data.laundryData !== null ? data.laundryData : {},
      chores: Array.isArray(data?.chores) ? data.chores : []
    };
  } catch (e) {
    console.error('Failed to load IndexedDB:', e);
    return { hygiene: [], medications: [], prescriptions: [], logs: [], bedroom: [], autoHabits: [], laundryData: {}, chores: [] };
  }
};

export const saveDB = async (data) => {
  try {
    await set(DB_KEY, data);
  } catch (e) {
    console.error('Failed to save IndexedDB:', e);
    throw e; // Propagate error so components can handle it if needed
  }
};

// Logs
export const getLogsByDate = async (date) => {
  const db = await getDB();
  return (db.logs || []).filter(l => l.date === date);
};

export const saveLog = async (date, type, itemId, completed) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.logs)) db.logs = [];
    const idx = db.logs.findIndex(l => l.date === date && l.type === type && String(l.itemId) === String(itemId));
    if (idx >= 0) {
      db.logs[idx].completed = completed;
    } else {
      db.logs.push({ date, type, itemId: String(itemId), completed });
    }
    await saveDB(db);
  } catch (e) {
    console.error('Failed to save log:', e);
  }
};

// Hygiene Tasks
export const getHygieneByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'hygiene');
  return (db.hygiene || []).map(h => ({
    ...h,
    completed: logs.find(l => String(l.itemId) === String(h.task_name))?.completed || false
  }));
};

export const saveHygieneTask = async (task) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.hygiene)) db.hygiene = [];
    const idx = db.hygiene.findIndex(t => t.task_name === task.task_name);
    if (idx < 0) {
      db.hygiene.push({ task_name: task.task_name });
      await saveDB(db);
    }
    await saveLog(task.date, 'hygiene', task.task_name, task.completed);
  } catch (e) {
    console.error('Failed to save hygiene task:', e);
  }
};

export const deleteHygieneTask = async (taskName) => {
  try {
    const db = await getDB();
    db.hygiene = (db.hygiene || []).filter(t => t.task_name !== taskName);
    db.logs = (db.logs || []).filter(l => !(l.type === 'hygiene' && String(l.itemId) === String(taskName)));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete hygiene task:', e);
  }
};

// Medications
export const getMedsByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'medication');
  return (db.medications || []).map(m => ({
    ...m,
    completed: logs.find(l => String(l.itemId) === String(m.id))?.completed || false
  }));
};

export const saveMed = async (med, date) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.medications)) db.medications = [];
    const idx = db.medications.findIndex(m => String(m.id) === String(med.id));
    if (idx >= 0) {
      db.medications[idx] = { ...db.medications[idx], ...med };
    } else {
      db.medications.push({ id: String(Date.now()), ...med });
    }
    await saveDB(db);
    if (date) {
      await saveLog(date, 'medication', med.id, med.completed);
    }
  } catch (e) {
    console.error('Failed to save medication:', e);
  }
};

export const deleteMed = async (id) => {
  try {
    const db = await getDB();
    db.medications = (db.medications || []).filter(m => String(m.id) !== String(id));
    db.logs = (db.logs || []).filter(l => !(l.type === 'medication' && String(l.itemId) === String(id)));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete medication:', e);
  }
};

// Prescriptions (Enhanced with photo & daily completion tracking)
export const getPrescriptionsByDate = async () => {
  const db = await getDB();
  return db.prescriptions || [];
};

export const savePrescription = async (rx) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.prescriptions)) db.prescriptions = [];
    
    // Ensure daily completion array exists for new items
    if (!Array.isArray(rx.completedDates)) rx.completedDates = [];
    
    const idx = db.prescriptions.findIndex(p => String(p.id) === String(rx.id));
    if (idx >= 0) {
      db.prescriptions[idx] = { ...db.prescriptions[idx], ...rx };
    } else {
      db.prescriptions.push({ id: String(Date.now()), completedDates: [], ...rx });
    }
    await saveDB(db);
  } catch (e) {
    console.error('Failed to save prescription:', e);
  }
};

export const deletePrescription = async (id) => {
  try {
    const db = await getDB();
    db.prescriptions = (db.prescriptions || []).filter(p => String(p.id) !== String(id));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete prescription:', e);
  }
};

// Bedroom Tasks (Recurring Daily Habits)
const TIME_SLOTS = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

export const getBedroomTasksByDate = async (date) => {
  const db = await getDB();
  const logs = (db.logs || []).filter(l => l.date === date && l.type === 'bedroom');

  return TIME_SLOTS.map(slot => ({
    timeSlot: slot,
    items: (db.bedroom || [])
      .filter(t => t.timeSlot === slot)
      .map(t => ({
        id: String(t.id),
        text: t.name || '',
        completed: logs.find(l => String(l.itemId) === String(t.id))?.completed || false
      }))
  }));
};

export const saveBedroomTask = async (task) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.bedroom)) db.bedroom = [];
    
    if (task.id) {
      const idx = db.bedroom.findIndex(t => String(t.id) === String(task.id));
      if (idx >= 0) {
        // If we are just toggling completion for a specific date
        if (task.date && task.completed !== undefined) {
           await saveLog(task.date, 'bedroom', task.id, task.completed);
           return;
        }
        // Otherwise update the habit definition
        db.bedroom[idx] = { ...db.bedroom[idx], name: task.text || db.bedroom[idx].name };
      }
    } else {
      // Create new recurring habit definition
      db.bedroom.push({ id: String(Date.now()), timeSlot: task.timeSlot, name: task.text || '', completed: false });
    }
    await saveDB(db);
  } catch (e) {
    console.error('Failed to save bedroom task:', e);
  }
};

export const deleteBedroomTask = async (id) => {
  try {
    const db = await getDB();
    db.bedroom = (db.bedroom || []).filter(t => String(t.id) !== String(id));
    // Also clean up all daily completion logs for this specific recurring habit
    db.logs = (db.logs || []).filter(l => !(l.type === 'bedroom' && String(l.itemId) === String(id)));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete bedroom task:', e);
  }
};

// Auto Habits (Weekly with 3-day expiration)
const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

export const getAutoHabits = async () => {
  try {
    const db = await getDB();
    const currentWeekStart = getWeekStart();
    let habits = Array.isArray(db.autoHabits) ? db.autoHabits : [];
    
    // Reset weekly progress if week changed
    const lastReset = db.laundryData?.lastReset;
    if (lastReset !== currentWeekStart) {
      habits = habits.map(h => ({ ...h, completed: false }));
      await saveDB({ 
        ...db, 
        autoHabits: habits, 
        laundryData: { ...db.laundryData, lastReset: currentWeekStart } 
      });
    }
    
    // Filter out expired habits (default 3 days from creation)
    const now = Date.now();
    const activeHabits = habits.filter(h => !h.expiresAt || h.expiresAt > now);
    
    return activeHabits;
  } catch (e) {
    console.error('Failed to get auto habits:', e);
    return [];
  }
};

export const saveAutoHabit = async (habit) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.autoHabits)) db.autoHabits = [];
    
    // Set expiration to 3 days from now if not set
    if (!habit.expiresAt) {
      habit.expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000);
    }

    const idx = db.autoHabits.findIndex(h => String(h.id) === String(habit.id));
    if (idx >= 0) {
      db.autoHabits[idx] = { ...db.autoHabits[idx], ...habit };
    } else {
      db.autoHabits.push({ id: String(Date.now()), name: habit.name, completed: false, expiresAt: habit.expiresAt });
    }
    await saveDB(db);
  } catch (e) {
    console.error('Failed to save auto habit:', e);
  }
};

export const deleteAutoHabit = async (id) => {
  try {
    const db = await getDB();
    db.autoHabits = (db.autoHabits || []).filter(h => String(h.id) !== String(id));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete auto habit:', e);
  }
};

// Laundry Countdown & Tasks
export const getLaundryData = async () => {
  try {
    const db = await getDB();
    const raw = db.laundryData || {};
    
    // Return a fresh copy of items to prevent React reference equality issues across unmount/remount cycles
    return { 
      count: typeof raw.count === 'number' ? raw.count : (typeof raw.count === 'string' ? parseInt(raw.count, 10) : 0), 
      targetCount: typeof raw.targetCount === 'number' ? raw.targetCount : 4, 
      lastUpdated: raw.lastUpdated || new Date().toISOString(), 
      items: Array.isArray(raw.items) ? [...raw.items] : [] 
    };
  } catch (e) {
    console.error('Failed to get laundry data:', e);
    return { count: 0, targetCount: 4, lastUpdated: new Date().toISOString(), items: [] };
  }
};

export const updateLaundryCount = async (count) => {
  try {
    if (typeof count !== 'number' || isNaN(count)) return;
    const db = await getDB();
    if (!db.laundryData) db.laundryData = {};
    db.laundryData.count = count;
    db.laundryData.lastUpdated = new Date().toISOString();
    await saveDB(db);
  } catch (e) {
    console.error('Failed to update laundry count:', e);
  }
};

export const addLaundryItem = async (text) => {
  try {
    const db = await getDB();
    if (!db.laundryData) db.laundryData = {};
    if (!Array.isArray(db.laundryData.items)) db.laundryData.items = [];
    const newItem = { id: String(Date.now()), text, completed: false };
    db.laundryData.items.push(newItem);
    await saveDB(db);
    return newItem;
  } catch (e) {
    console.error('Failed to add laundry item:', e);
    return null;
  }
};

export const toggleLaundryItem = async (id, completed) => {
  try {
    const db = await getDB();
    if (!db.laundryData) db.laundryData = {};
    if (!Array.isArray(db.laundryData.items)) db.laundryData.items = [];
    
    const item = db.laundryData.items.find(i => String(i.id) === String(id));
    if (item) {
      item.completed = completed;
      await saveDB(db);
    }
  } catch (e) {
    console.error('Failed to toggle laundry item:', e);
  }
};

export const deleteLaundryItem = async (id) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.laundryData?.items)) return;
    db.laundryData.items = db.laundryData.items.filter(i => String(i.id) !== String(id));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete laundry item:', e);
  }
};

// House Chores Checklist (Enhanced with Recurrence)
export const getChoresByDate = async (date) => {
  try {
    const db = await getDB();
    // Filter chores that are scheduled for this specific date
    return (db.chores || []).filter(c => c.nextDueDate === date).map(c => ({ ...c, completed: !!c.completed }));
  } catch (e) {
    console.error('Failed to get chores:', e);
    return [];
  }
};

export const saveChore = async (chore) => {
  try {
    const db = await getDB();
    if (!Array.isArray(db.chores)) db.chores = [];
    
    // Ensure recurrence fields exist
    if (!chore.recurrence) chore.recurrence = 'none';
    if (!chore.nextDueDate) chore.nextDueDate = chore.date;

    const idx = db.chores.findIndex(c => String(c.id) === String(chore.id));
    if (idx >= 0) {
      db.chores[idx] = { ...db.chores[idx], ...chore };
    } else {
      db.chores.push({ id: String(Date.now()), name: chore.name, recurrence: chore.recurrence, nextDueDate: chore.nextDueDate, completedDates: [] });
    }
    await saveDB(db);
  } catch (e) {
    console.error('Failed to save chore:', e);
  }
};

export const deleteChore = async (id) => {
  try {
    const db = await getDB();
    db.chores = (db.chores || []).filter(c => String(c.id) !== String(id));
    await saveDB(db);
  } catch (e) {
    console.error('Failed to delete chore:', e);
  }
};

// Helper to calculate next due date based on recurrence
export const getNextDueDate = (currentDateStr, recurrence) => {
  if (!recurrence || recurrence === 'none') return null;
  
  const d = new Date(currentDateStr + 'T12:00:00');
  if (recurrence === 'daily') d.setDate(d.getDate() + 1);
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
