import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Camera, Trash2 } from 'lucide-react';
import { getMedsByDate, saveMed, deleteMed } from '../db';

// Safe fallback for Capacitor to prevent web dev crashes
const CapacitorCamera = typeof window !== 'undefined' && window.Capacitor?.plugins?.Camera ? window.Capacitor.plugins.Camera : null;
const CameraResultType = { DataUrl: 0 }; // Fallback constant

export default function Medications({ date }) {
  const [meds, setMeds] = useState([]);
  const [newMed, setNewMed] = useState({ name: '', type: 'multivitamin' });
  const [imageFile, setImageFile] = useState(null);

  const loadMeds = async () => {
    const data = await getMedsByDate(date);
    setMeds(data);
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) loadMeds();
    return () => { mounted = false; };
  }, [date]);

  const takePhoto = async () => {
    try {
      if (!CapacitorCamera) return; // Skip on web dev without capacitor
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl
      });
      setImageFile(image.dataUrl);
    } catch (err) {
      console.error('Camera cancelled or failed', err);
    }
  };

  const toggleMed = async (id, completed) => {
    const med = meds.find(m => m.id === id);
    if (med) {
      await saveMed({ ...med, completed }, date);
      loadMeds();
    }
  };

  const addMed = async () => {
    if (!newMed.name.trim()) return;
    
    const newMedObj = { id: Date.now(), name: newMed.name, type: newMed.type, image_path: imageFile };
    await saveMed(newMedObj, date); // FIXED: Added missing date argument
    await loadMeds();

    setNewMed({ name: '', type: 'multivitamin' });
    setImageFile(null);
  };

  const removeMed = async (id) => {
    if (window.confirm('Remove this medication?')) {
      await deleteMed(id);
      loadMeds();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
        Vitamins & OTC
      </h3>

      <ul className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
        {meds.map(med => (
          <li key={med.id} className="flex items-center gap-3 p-2 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-colors">
            <button onClick={() => toggleMed(med.id, !med.completed)}>
              {med.completed ? <CheckSquare className="text-green-500" size={22} /> : <Square className="text-gray-300 dark:text-gray-500" size={22} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${med.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>{med.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${med.type === 'multivitamin' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                {med.type}
              </span>
            </div>
            {med.image_path && (
              <img 
                src={med.image_path} 
                alt={med.name} 
                className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-600 shadow-sm"
              />
            )}
            <button
              onClick={() => removeMed(med.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Remove medication"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t dark:border-gray-700 pt-3 space-y-2">
        <input 
          value={newMed.name} 
          onChange={e => setNewMed({...newMed, name: e.target.value})} 
          placeholder="Add medication/vitamin..." 
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        
        <div className="flex gap-2">
          <select 
            value={newMed.type} 
            onChange={e => setNewMed({...newMed, type: e.target.value})} 
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="multivitamin">Multivitamin</option>
            <option value="otc">OTC Medication</option>
          </select>

          <button
            onClick={takePhoto}
            className={`flex items-center gap-1 cursor-pointer text-xs p-2 rounded-lg transition-colors border ${imageFile ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 hover:text-green-600'}`}
          >
            <Camera size={14} /> {imageFile ? 'Captured' : 'Photo'}
          </button>

          <button onClick={addMed} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium text-sm">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
