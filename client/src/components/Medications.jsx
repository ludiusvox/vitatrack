import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Upload, Trash2 } from 'lucide-react';
import { getMedsByDate, saveMed, deleteMed, fileToBase64 } from '../db';

export default function Medications({ date }) {
  const [meds, setMeds] = useState([]);
  const [newMed, setNewMed] = useState({ name: '', type: 'multivitamin' });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setMeds(getMedsByDate(date));
  }, [date]);

  const toggleMed = (id, completed) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, completed } : m));
    const med = meds.find(m => m.id === id);
    if (med) {
      saveMed({ ...med, completed }, date);
    }
  };

  const addMed = async () => {
    if (!newMed.name.trim()) return;
    
    let imagePath = null;
    if (imageFile) {
      try {
        imagePath = await fileToBase64(imageFile);
      } catch (err) {
        console.error('Failed to read image:', err);
      }
    }

    const newMedObj = { id: Date.now(), name: newMed.name, type: newMed.type, image_path: imagePath };
    saveMed(newMedObj);
    setMeds(getMedsByDate(date));

    setNewMed({ name: '', type: 'multivitamin' });
    setImageFile(null);
  };

  const removeMed = (id) => {
    if (window.confirm('Remove this medication?')) {
      deleteMed(id);
      setMeds(getMedsByDate(date));
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

          <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-500 hover:text-green-600 border border-gray-300 dark:border-gray-600 p-2 rounded-lg transition-colors bg-white dark:bg-gray-700">
            <Upload size={14} /> Attach
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="hidden" />
          </label>

          <button onClick={addMed} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium text-sm">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
