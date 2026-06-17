import { useState, useEffect } from 'react';
import { getPrescriptionsByDate, savePrescription, deletePrescription } from '../db';
import { Plus, Trash2, Calendar, Clock, CheckCircle, Circle, Camera as CameraIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });
      setPhotoFile(image.dataUrl);
    } catch (err) {
      console.error('Camera cancelled or failed', err);
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
      const d = new Date(updatedRx.nextDate + 'T12:00:00');
      if (updatedRx.frequency === 'Daily') d.setDate(d.getDate() + 1);
      else if (updatedRx.frequency === 'Weekly') d.setDate(d.getDate() + 7);
      else if (updatedRx.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
      nextDate = d.toISOString().split('T')[0];
    }
    
    updatedRx.nextDate = nextDate;
    await savePrescription(updatedRx);
    loadPrescriptions();
  };

  const addPrescription = async () => {
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
    await savePrescription(rx);
    await loadPrescriptions();
    setNewRx({ name: '', frequency: 'Daily', nextDate: date, reminderEnabled: true });
    setPhotoFile(null);
  };

  const removePrescription = async (id) => {
    await deletePrescription(id);
    loadPrescriptions();
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
        Prescriptions & Reminders
      </h3>
      
      {/* Add New Prescription */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <input
          type="text"
          value={newRx.name}
          onChange={(e) => setNewRx({ ...newRx, name: e.target.value })}
          placeholder="Medication or Reminder Name..."
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800 dark:text-gray-200"
        />
        
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Frequency</label>
            <select
              value={newRx.frequency}
              onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500"
            >
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Next Due Date</label>
            <input 
              type="date"
              value={newRx.nextDate}
              onChange={(e) => setNewRx({ ...newRx, nextDate: e.target.value })}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-500 transition-colors">
              <input
                type="checkbox"
                checked={newRx.reminderEnabled}
                onChange={(e) => setNewRx({ ...newRx, reminderEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900"
              />
              Remind Me
            </label>

            <button
              onClick={takePhoto}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${photoFile ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500'}`}
            >
              <CameraIcon size={20} />
              <span className="text-xs font-bold uppercase">{photoFile ? 'Photo Added' : 'Add Photo'}</span>
            </button>
          </div>

          <button 
            onClick={addPrescription}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus size={20} /> Add Item
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {prescriptions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-400 italic">No prescriptions or reminders set yet.</p>
          </div>
        ) : (
          prescriptions.map(rx => (
            <div key={rx.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 group hover:shadow-md transition-all">
              <button onClick={() => toggleCompletion(rx)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                {rx.completedToday ? <CheckCircle size={32} className="text-green-500" /> : <Circle size={32} className="text-gray-300 dark:text-gray-600" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-lg font-bold truncate ${rx.completedToday ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                  {rx.name}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md"><Calendar size={14} /> {rx.frequency}</span>
                  <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md"><Clock size={14} /> Next: {rx.nextDate}</span>
                  {rx.reminderEnabled && <span className="text-blue-500 font-bold flex items-center gap-1">🔔 Active</span>}
                </div>
              </div>

              {rx.photo && (
                <div className="relative group/photo">
                  <img src={rx.photo} alt={rx.name} className="w-12 h-12 object-cover rounded-xl border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                     <CameraIcon size={16} className="text-white" />
                  </div>
                </div>
              )}

              <button onClick={() => removePrescription(rx.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0">
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

