import { useState, useEffect } from 'react';
import { getPrescriptionsByDate, savePrescription, deletePrescription } from '../db';
import { Plus, Trash2, Calendar, Clock, CheckCircle, Circle, Camera as CameraIcon } from 'lucide-react';

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Custom'];

export default function Prescriptions({ date }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [newRx, setNewRx] = useState({ name: '', frequency: 'Daily', nextDate: date, reminderEnabled: true });
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    loadPrescriptions();
  }, [date]); // Fixed: Added 'date' to dependency array so the UI correctly updates when navigating between days

  const loadPrescriptions = async () => {
    try {
      const data = await getPrescriptionsByDate();
      setPrescriptions(data.map(rx => ({
        ...rx,
        completedToday: Array.isArray(rx.completedDates) && rx.completedDates.includes(date)
      })));
    } catch (e) {
      console.error("Failed to load prescriptions", e);
    }
  };

  const toggleCompletion = async (rx) => {
    const updatedRx = { 
      ...rx, 
      completedToday: !rx.completedToday,
      completedDates: rx.completedToday 
        ? (rx.completedDates || []).filter(d => d !== date)
        : [...(rx.completedDates || []), date]
    };
    
    // Calculate next due date for scheduling purposes
    let nextDate = updatedRx.nextDate;
    if (!updatedRx.completedToday && updatedRx.frequency !== 'Custom') {
      const d = new Date(updatedRx.nextDate);
      if (updatedRx.frequency === 'Daily') d.setDate(d.getDate() + 1);
      else if (updatedRx.frequency === 'Weekly') d.setDate(d.getDate() + 7);
      else if (updatedRx.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
      nextDate = d.toISOString().split('T')[0];
    }
    
    updatedRx.nextDate = nextDate;
    await savePrescription(updatedRx);
    loadPrescriptions();
  };

  const addPrescription = () => {
    if (!newRx.name.trim()) return;
    const rx = { 
      id: Date.now().toString(), 
      name: newRx.name, 
      frequency: newRx.frequency, 
      nextDate: newRx.nextDate || date, 
      reminderEnabled: newRx.reminderEnabled,
      photo: photoFile,
      completedDates: []
    };
    savePrescription(rx);
    setPrescriptions([...prescriptions, rx]);
    setNewRx({ name: '', frequency: 'Daily', nextDate: date, reminderEnabled: true });
    setPhotoFile(null);
  };

  const removePrescription = async (id) => {
    await deletePrescription(id);
    loadPrescriptions();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Prescriptions & Reminders</h3>
      
      {/* Add New Prescription */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
        <input
          type="text"
          value={newRx.name}
          onChange={(e) => setNewRx({ ...newRx, name: e.target.value })}
          placeholder="Medication Name"
          className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-gray-800 dark:text-gray-200"
        />
        
        <div className="flex gap-3 flex-wrap">
          <select 
            value={newRx.frequency}
            onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
            className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-600 dark:text-gray-300"
          >
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <input 
            type="date" 
            value={newRx.nextDate}
            onChange={(e) => setNewRx({ ...newRx, nextDate: e.target.value })}
            className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-600 dark:text-gray-300"
          />

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={newRx.reminderEnabled}
              onChange={(e) => setNewRx({ ...newRx, reminderEnabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            Remind Me
          </label>

          <button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoFile(reader.result);
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }} 
            className="ml-auto text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            <CameraIcon size={24} /> {photoFile ? 'Photo Added' : 'Add Photo'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
        {prescriptions.map(rx => (
          <div key={rx.id} className="flex items-center gap-3 group p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <button onClick={() => toggleCompletion(rx)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
              {rx.completedToday ? <CheckCircle size={24} /> : <Circle size={24} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${rx.completedToday ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {rx.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center gap-1"><Calendar size={12} /> {rx.frequency}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> Next: {rx.nextDate}</span>
                {rx.reminderEnabled && <span className="text-blue-500 flex items-center gap-1">🔔</span>}
              </div>
            </div>

            {rx.photo && (
              <img src={rx.photo} alt={rx.name} className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0" />
            )}

            <button onClick={() => removePrescription(rx.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
