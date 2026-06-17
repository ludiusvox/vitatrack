import { useState, useEffect } from 'react';
import { getLaundryData, updateLaundryCount, addLaundryItem, toggleLaundryItem, deleteLaundryItem } from '../db';
import { Plus, Minus, Shirt, CheckSquare, Square, Trash2 } from 'lucide-react';

export default function LaundryCountdown() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(4);
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always fetch fresh data on mount to ensure persistence across tab switches
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getLaundryData();
      // Ensure state is strictly a number to prevent React object rendering crashes
      setCount(Number(data.count) || 0);
      setTarget(Number(data.targetCount) || 4);
      
      let loadedItems = Array.isArray(data.items) ? data.items : [];
      if (loadedItems.length === 0) {
        loadedItems = [{ id: Date.now().toString(), text: 'Fold clothes', completed: false }];
      }
      setItems(loadedItems);
    } catch (e) {
      console.error("Failed to load laundry data", e);
    } finally {
      setLoading(false);
    }
  };

  const adjustCount = (delta) => {
    const newCount = Math.max(0, count + delta);
    setCount(newCount);
    // Pass the number directly. DB layer now strictly validates types.
    updateLaundryCount(newCount); 
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;
    const newItem = await addLaundryItem(newItemText);
    if (newItem) {
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const toggleItem = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    await toggleLaundryItem(id, !item.completed);
    // Optimistic UI update for instant feedback, synced with DB save above
    setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const removeItem = async (id) => {
    await deleteLaundryItem(id);
    setItems(items.filter(i => i.id !== id));
  };

  if (loading) return <div className="p-6 text-center">Loading Laundry Stats...</div>;

  // Ensure progress calculation uses numbers
  const safeCount = Number(count) || 0;
  const safeTarget = Number(target) || 1;
  const progress = Math.min((safeCount / safeTarget) * 100, 100);
  const isComplete = safeCount >= safeTarget;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Laundry Weekly Countdown</h3>
      
      {/* Counter Section */}
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border ${isComplete ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'} flex flex-col items-center justify-center gap-4`}>
        <Shirt size={48} className={`${isComplete ? 'text-green-500' : 'text-blue-500'}`} />
        
        <div className="flex items-center gap-4">
          <button onClick={() => adjustCount(-1)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Minus size={20} />
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loads This Week</p>
            {/* Safely render count as a number */}
            <p className="text-5xl font-bold text-gray-800 dark:text-white">{safeCount}</p>
          </div>

          <button onClick={() => adjustCount(1)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">Target: {safeTarget} loads/week</p>
      </div>

      {/* Laundry Tasks Checklist */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Laundry Tasks</h4>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <button onClick={() => toggleItem(item.id)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                {item.completed ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                {item.text}
              </span>
              <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            placeholder="Add laundry task..."
            className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-800 dark:text-gray-200"
          />
          <button onClick={addItem} className="text-blue-500 hover:text-blue-600 transition-colors">
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
