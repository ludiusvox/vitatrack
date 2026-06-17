import { useState, useEffect } from 'react';
import { getAutoHabits, saveAutoHabit, deleteAutoHabit } from '../db';
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';

export default function AutoTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const data = await getAutoHabits();
    setHabits(data);
  };

  const toggleHabit = async (habit) => {
    const updated = { ...habit, completed: !habit.completed };
    await saveAutoHabit(updated);
    loadHabits();
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    // Default expiration is 3 days from creation (handled in db.js)
    const newHabit = { id: Date.now().toString(), name: newHabitName, completed: false };
    saveAutoHabit(newHabit);
    setHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  const removeHabit = async (id) => {
    await deleteAutoHabit(id);
    loadHabits();
  };

  // Format expiration date for UI display
  const formatExpiration = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        Automobile Weekly Habits 
        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">Expires in 3 days</span>
      </h3>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
        {habits.map(habit => (
          <div key={habit.id} className="flex items-center gap-3 group relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
            <button onClick={() => toggleHabit(habit)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
              {habit.completed ? <CheckCircle size={24} className="text-green-500" /> : <Circle size={24} className="text-gray-300 dark:text-gray-500" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <span className={`block truncate ${habit.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'} font-medium`}>
                {habit.name}
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 uppercase font-bold tracking-wider">
                <Clock size={10} /> Expires: {formatExpiration(habit.expiresAt)}
              </span>
            </div>

            <button
              onClick={() => removeHabit(habit.id)}
              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"
              title="Delete habit"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        
        {habits.length === 0 && (
          <p className="text-center text-gray-400 py-4 italic">No active automobile habits. Add one below!</p>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Add new auto habit..."
            className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-gray-800 dark:text-gray-200"
          />
          <button onClick={addHabit} className="text-blue-500 hover:text-blue-600">
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
