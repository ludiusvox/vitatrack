import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import { getHygieneByDate, saveHygieneTask, deleteHygieneTask } from '../db';

const DEFAULT_TASKS = ['Shower', 'Brush Teeth', 'Floss', 'Deodorant'];

export default function HygieneChecklist({ date }) {
  const [tasks, setTasks] = useState([]);
  const [customTask, setCustomTask] = useState('');

  useEffect(() => {
    setTasks(getHygieneByDate(date));
  }, [date, tasks.length]); // Re-fetch if length changes (item added/removed)

  const toggleTask = (taskName, existingTask) => {
    const isCompleted = !existingTask?.completed;

    const updatedTask = { 
      date,
      task_name: taskName, 
      completed: isCompleted 
    };

    saveHygieneTask(updatedTask);
    setTasks(getHygieneByDate(date));
  };

  const addTask = () => {
    if (!customTask.trim()) return;
    saveHygieneTask({ date, task_name: customTask, completed: false });
    setCustomTask('');
    setTasks(getHygieneByDate(date));
  };

  const removeTask = (taskName) => {
    if (window.confirm(`Remove "${taskName}"?`)) {
      deleteHygieneTask(taskName);
      setTasks(getHygieneByDate(date));
    }
  };

  // Combine DEFAULT_TASKS with stored hygiene items
  const allTaskNames = Array.from(new Set([...DEFAULT_TASKS, ...tasks.map(t => t.task_name)]));

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        Hygiene Tasks
      </h3>
      
      <ul className="space-y-3 mb-4">
        {allTaskNames.map(taskName => {
          const existing = tasks.find(t => t.task_name === taskName);
          const isDefault = DEFAULT_TASKS.includes(taskName);
          return (
            <li key={taskName} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
              <button 
                onClick={() => toggleTask(taskName, existing)}
                className={`transition-colors ${existing?.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-500 hover:text-blue-400'}`}
              >
                {existing?.completed ? <CheckSquare size={22} /> : <Square size={22} />}
              </button>
              <span className={`flex-1 text-sm ${existing?.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                {taskName}
              </span>
              {!isDefault && (
                <button
                  onClick={() => removeTask(taskName)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border-t dark:border-gray-700 pt-3 flex gap-2">
        <input 
          value={customTask} 
          onChange={e => setCustomTask(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add custom task..." 
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={addTask} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium text-sm"
        >
          <Plus size={18} /> Add
        </button>
      </div>
    </div>
  );
}
