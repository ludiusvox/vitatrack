import { useState, useEffect } from 'react';
import { getChoresByDate, saveChore, deleteChore, getNextDueDate } from '../db';
import { Plus, Trash2, CheckCircle, Circle, Repeat } from 'lucide-react';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export default function ChoreChecklist({ date }) {
  const [chores, setChores] = useState([]);
  const [newChoreName, setNewChoreName] = useState('');
  const [selectedRecurrence, setSelectedRecurrence] = useState('none');

  useEffect(() => {
    loadChores();
  }, [date]);

  const loadChores = async () => {
    const data = await getChoresByDate(date);
    setChores(data);
  };

  const toggleChore = async (chore) => {
    const updated = { ...chore, completed: !chore.completed };
    
    // If completing a recurring chore, schedule the next occurrence
    if (!updated.completed && chore.recurrence !== 'none') {
      const nextDate = getNextDueDate(date, chore.recurrence);
      if (nextDate) {
        updated.nextDueDate = nextDate;
      }
    } else if (chore.recurrence === 'none' && !updated.completed) {
      // One-time chores disappear when completed
      await deleteChore(chore.id);
      loadChores();
      return;
    }

    await saveChore(updated);
    loadChores();
  };

  const addChore = () => {
    if (!newChoreName.trim()) return;
    
    // Calculate next due date based on recurrence
    let nextDueDate = date;
    if (selectedRecurrence !== 'none') {
      const d = new Date(date + 'T12:00:00');
      if (selectedRecurrence === 'daily') d.setDate(d.getDate() + 1);
      else if (selectedRecurrence === 'weekly') d.setDate(d.getDate() + 7);
      else if (selectedRecurrence === 'monthly') d.setMonth(d.getMonth() + 1);
      
      nextDueDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    }

    const newChore = { 
      id: Date.now().toString(), 
      name: newChoreName, 
      recurrence: selectedRecurrence, 
      nextDueDate: nextDueDate,
      completedDates: [] 
    };
    
    saveChore(newChore);
    setChores([...chores, { ...newChore, completed: false }]);
    setNewChoreName('');
  };

  const removeChore = async (id) => {
    await deleteChore(id);
    loadChores();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">House Chores — {date}</h3>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
        {chores.map(chore => (
          <div key={chore.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
            <button onClick={() => toggleChore(chore)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
              {chore.completed ? <CheckCircle size={28} className="text-green-500" /> : <Circle size={28} className="text-gray-300 dark:text-gray-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <span className={`block truncate ${chore.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'} font-semibold`}>
                {chore.name}
              </span>
              {chore.recurrence !== 'none' && (
                <span className="text-[10px] text-purple-500 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wider">
                  <Repeat size={10} /> Recurring: {chore.recurrence}
                </span>
              )}
            </div>
            <button
              onClick={() => removeChore(chore.id)}
              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"
              title="Delete chore"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 items-center">
          <input
            type="text"
            value={newChoreName}
            onChange={(e) => setNewChoreName(e.target.value)}
            placeholder="Add new chore..."
            className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-gray-800 dark:text-gray-200"
          />
          
          <select 
            value={selectedRecurrence}
            onChange={(e) => setSelectedRecurrence(e.target.value)}
            className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-600 dark:text-gray-300"
          >
            {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <button onClick={addChore} className="text-blue-500 hover:text-blue-600">
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
