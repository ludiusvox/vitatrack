import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import { getHygieneByDate, saveHygieneTask, deleteHygieneTask } from '../db';

export default function HygieneChecklist({ date }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const loadTasks = async () => {
    const data = await getHygieneByDate(date);
    setTasks(data);
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) loadTasks();
    return () => { mounted = false; };
  }, [date]);

  const toggleTask = async (taskName, completed) => {
    await saveHygieneTask({ date, task_name: taskName, completed });
    loadTasks();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await saveHygieneTask({ date, task_name: newTask, completed: false });
    setNewTask('');
    loadTasks();
  };

  const removeTask = async (taskName) => {
    if (window.confirm(`Remove "${taskName}"?`)) {
      await deleteHygieneTask(taskName);
      loadTasks();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        Hygiene Checklist
      </h3>
      
      <ul className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
        {tasks.map(task => (
          <li key={task.task_name} className="flex items-center gap-3 p-2 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-colors">
            <button onClick={() => toggleTask(task.task_name, !task.completed)}>
              {task.completed ? <CheckSquare className="text-blue-500" size={22} /> : <Square className="text-gray-300 dark:text-gray-500" size={22} />}
            </button>
            <span className={`flex-1 text-sm font-medium truncate ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.task_name}
            </span>
            <button
              onClick={() => removeTask(task.task_name)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t dark:border-gray-700 pt-3">
        <input 
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add custom task..." 
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={addTask} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-1">
          <Plus size={18} /> Add
        </button>
      </div>
    </div>
  );
}
