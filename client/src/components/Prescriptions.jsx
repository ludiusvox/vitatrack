import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Upload, Trash2 } from 'lucide-react';
import { getPrescriptionsByDate, savePrescription, deletePrescription, fileToBase64 } from '../db';

const PRESET_TIMES = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

export default function Prescriptions({ date }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [newRx, setNewRx] = useState({ name: '', time_slot: PRESET_TIMES[0] });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setPrescriptions(getPrescriptionsByDate(date));
  }, [date]);

  const toggleRx = (id, completed) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, completed } : p));
    const rx = prescriptions.find(p => p.id === id);
    if (rx) {
      savePrescription({ ...rx, completed }, date);
    }
  };

  const addRx = async () => {
    if (!newRx.name.trim()) return;
    
    let imagePath = null;
    if (imageFile) {
      try {
        imagePath = await fileToBase64(imageFile);
      } catch (err) {
        console.error('Failed to read image:', err);
      }
    }

    const newRxObj = { id: Date.now(), name: newRx.name, time_slot: newRx.time_slot, image_path: imagePath };
    savePrescription(newRxObj); // Save to master list
    setPrescriptions(getPrescriptionsByDate(date)); // Refresh list for today
    
    setNewRx({ name: '', time_slot: PRESET_TIMES[0] });
    setImageFile(null);
  };

  const removeRx = (id) => {
    if (window.confirm('Remove this prescription entirely?')) {
      deletePrescription(id);
      setPrescriptions(getPrescriptionsByDate(date));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
        Prescriptions & Scheduled Meds
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {prescriptions.map(rx => (
          <div key={rx.id} className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${rx.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}>
            <button onClick={() => toggleRx(rx.id, !rx.completed)}>
              {rx.completed ? <CheckSquare className="text-green-500" size={22} /> : <Square className="text-gray-300 dark:text-gray-500" size={22} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${rx.completed ? 'line-through text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'}`}>{rx.name}</p>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full">
                {rx.time_slot}
              </span>
            </div>
            {rx.image_path && (
              <img 
                src={rx.image_path} 
                alt={rx.name} 
                className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-600 shadow-sm"
              />
            )}
            <button
              onClick={() => removeRx(rx.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Remove prescription"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-gray-700 pt-3 space-y-2">
        <input 
          value={newRx.name} 
          onChange={e => setNewRx({...newRx, name: e.target.value})} 
          placeholder="Add prescription..." 
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        <div className="flex gap-2">
          <select 
            value={newRx.time_slot} 
            onChange={e => setNewRx({...newRx, time_slot: e.target.value})} 
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {PRESET_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-500 hover:text-purple-600 border border-gray-300 dark:border-gray-600 p-2 rounded-lg transition-colors bg-white dark:bg-gray-700">
            <Upload size={14} /> Attach
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="hidden" />
          </label>

          <button onClick={addRx} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium text-sm">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
