import { useState, useEffect } from 'react';
import Medications from './Medications';
import Prescriptions from './Prescriptions';
import { Pill, Activity } from 'lucide-react';

export default function MedicationManager({ date }) {
  const [activeTab, setActiveTab] = useState('vits');

  return (
    <div className="space-y-6">
      <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('vits')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-semibold text-sm ${
            activeTab === 'vits'
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Activity size={18} />
          Vitamins & OTC
        </button>
        <button
          onClick={() => setActiveTab('rx')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-semibold text-sm ${
            activeTab === 'rx'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Pill size={18} />
          Prescriptions
        </button>
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'vits' ? (
          <div className="max-w-2xl">
            <Medications date={date} />
          </div>
        ) : (
          <Prescriptions date={date} />
        )}
      </div>
    </div>
  );
}
