import { useState, useEffect } from 'react';
import { getBedroomTasksByDate, saveBedroomTask, deleteBedroomTask } from '../db';
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';

const TIME_SLOTS = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

export default function BedroomTracker({ date }) {
  const [slots, setSlots] = useState([]);
  const [newItemTexts, setNewItemTexts] = useState({}); // Map timeSlot -> text

  useEffect(() => {
    loadTasks();
  }, [date]);

  const loadTasks = async () => {
    const data = await getBedroomTasksByDate(date);
    setSlots(data);
    // Initialize newItemTexts map
    const initialInputs = {};
    data.forEach(slot => { initialInputs[slot.timeSlot] = ''; });
    setNewItemTexts(initialInputs);
  };

  const toggleItem = async (slotTime, itemId) => {
    const item = slots.find(s => s.timeSlot === slotTime)?.items.find(i => i.id === itemId);
    if (!item) return;
    
    await saveBedroomTask({ id: item.id, date, timeSlot: slotTime, text: item.text, completed: !item.completed });
    loadTasks();
  };

  const addItem = async (slotTime) => {
    const text = newItemTexts[slotTime]?.trim();
    if (!text) return;
    
    await saveBedroomTask({ date, timeSlot: slotTime, text });
    setNewItemTexts(prev => ({ ...prev, [slotTime]: '' }));
    loadTasks();
  };

  const removeItem = async (slotTime, itemId) => {
    await deleteBedroomTask(itemId);
    loadTasks();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Bedroom Tasks — {date}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map(slot => (
          <div key={slot.timeSlot} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
              <Clock size={18} className="text-blue-500" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">{slot.timeSlot}</h4>
            </div>

            <ul className="space-y-2 mb-3 flex-1 overflow-y-auto max-h-[200px] pr-1">
              {slot.items.map(item => (
                <li key={item.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <button onClick={() => toggleItem(slot.timeSlot, item.id)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                    {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  <span className={`flex-1 text-sm truncate ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {item.text}
                  </span>
                  <button onClick={() => removeItem(slot.timeSlot, item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
              <input 
                type="text"
                value={newItemTexts[slot.timeSlot] || ''}
                onChange={(e) => setNewItemTexts(prev => ({ ...prev, [slot.timeSlot]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') addItem(slot.timeSlot); }}
                placeholder="Add task..." 
                className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-800 dark:text-gray-200"
              />
              <button onClick={() => addItem(slot.timeSlot)} className="text-blue-500 hover:text-blue-600 transition-colors">
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
