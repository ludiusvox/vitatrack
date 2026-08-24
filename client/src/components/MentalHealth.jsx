import { useState, useEffect } from 'react';
import { getMentalHealthByDate, saveMentalHealthCheck, getWeeklyMentalHealth } from '../db';
import { Brain, Sunrise, Sun, Moon, AlertCircle, Info } from 'lucide-react';

const WellnessDial = ({ value, label, colorType = 'mood', size = 120 }) => {
  const radius = size * 0.4;
  const stroke = size * 0.1;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 10) * circumference;

  const getStrokeColor = () => {
    if (colorType === 'brain') {
      if (value >= 8) return '#a855f7'; // Purple (High)
      if (value >= 4) return '#3b82f6'; // Blue (Low)
      return '#94a3b8'; // Slate (Off)
    }
    // Mood colors
    if (value > 7) return '#10b981'; // Green
    if (value > 4) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg height={size} width={size} className="transform -rotate-90">
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            stroke={getStrokeColor()}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold dark:text-white">{value || 0}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">{label}</span>
    </div>
  );
};

const BrainMeter = ({ value, onSelect, disabled = false }) => {
  const options = [
    { id: 'off', label: 'Off', color: 'bg-gray-400', activeColor: 'bg-gray-600' },
    { id: 'low', label: 'Low', color: 'bg-blue-400', activeColor: 'bg-blue-600' },
    { id: 'high', label: 'High', color: 'bg-purple-400', activeColor: 'bg-purple-600' }
  ];

  return (
    <div className="flex gap-2 mt-3">
      {options.map(opt => (
        <button
          key={opt.id}
          disabled={disabled}
          onClick={() => onSelect(opt.id)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            value === opt.id
              ? `${opt.activeColor} text-white shadow-md scale-105`
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default function MentalHealth({ date }) {
  const [data, setData] = useState({ checks: {} });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const dayData = await getMentalHealthByDate(date);
      const weekData = await getWeeklyMentalHealth(date);
      setData(dayData);
      setWeeklyData(weekData);
      setLoading(false);
    };
    fetchData();
  }, [date]);

  const handleCheck = async (timeOfDay, mood, brain) => {
    await saveMentalHealthCheck(date, timeOfDay, mood, brain);
    const updatedData = await getMentalHealthByDate(date);
    setData(updatedData);
    const updatedWeek = await getWeeklyMentalHealth(date);
    setWeeklyData(updatedWeek);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading wellness data...</div>;

  const times = [
    { id: 'morning', label: 'Morning', icon: Sunrise, color: 'text-orange-500' },
    { id: 'evening', label: 'Evening', icon: Sun, color: 'text-yellow-500' },
    { id: 'night', label: 'Night', icon: Moon, color: 'text-indigo-500' }
  ];

  const calculateDailyAverages = () => {
    const checks = Object.values(data.checks);
    const moods = checks.map(c => c.mood).filter(m => m !== undefined);
    const brainMap = { 'high': 10, 'low': 5, 'off': 0 };
    const brains = checks.map(c => brainMap[c.brain] || 0);

    const moodAvg = moods.length > 0 ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) : 0;
    const brainAvg = checks.length > 0 ? Math.round(brains.reduce((a, b) => a + b, 0) / checks.length) : 0;

    return { mood: moodAvg, brain: brainAvg };
  };

  const calculateWeeklyAverages = () => {
    let moodTotal = 0;
    let moodCount = 0;
    let brainTotal = 0;
    let brainCount = 0;
    const brainMap = { 'high': 10, 'low': 5, 'off': 0 };

    weeklyData.forEach(day => {
      Object.values(day.checks).forEach(c => {
        if (c.mood !== undefined) {
          moodTotal += c.mood;
          moodCount++;
        }
        if (c.brain) {
          brainTotal += brainMap[c.brain] || 0;
          brainCount++;
        }
      });
    });

    return {
      mood: moodCount > 0 ? Math.round(moodTotal / moodCount) : 0,
      brain: brainCount > 0 ? Math.round(brainTotal / brainCount) : 0
    };
  };

  const dailyAvgs = calculateDailyAverages();
  const weeklyAvgs = calculateWeeklyAverages();

  return (
    <div className="space-y-6 pb-20">
      {/* Header Dials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="flex justify-around items-center">
             <WellnessDial value={dailyAvgs.mood} label="Daily Mood" />
             <WellnessDial value={dailyAvgs.brain} label="Daily Brain" colorType="brain" />
           </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="flex justify-around items-center">
             <WellnessDial value={weeklyAvgs.mood} label="Weekly Mood" size={120} />
             <WellnessDial value={weeklyAvgs.brain} label="Weekly Brain" size={120} colorType="brain" />
           </div>
        </div>
      </div>

      {/* Mood Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {times.map(t => {
          const check = data.checks[t.id] || {};
          return (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-4 opacity-10 ${t.color}`}>
                <t.icon size={64} />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <t.icon className={t.color} size={24} />
                <h3 className="font-bold text-lg dark:text-white">{t.label} Check</h3>
              </div>

              <div className="w-full space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase block mb-2">Mood (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={check.mood || 5}
                    onChange={(e) => handleCheck(t.id, parseInt(e.target.value), check.brain || 'off')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase block flex items-center gap-1">
                    <Brain size={14} /> Brain Meter
                  </label>
                  <BrainMeter
                    value={check.brain || 'off'}
                    onSelect={(val) => handleCheck(t.id, check.mood || 5, val)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3">
        <Info className="text-blue-500 shrink-0" size={20} />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Tracking your mood and mental energy (Brain Meter) helps identify patterns. "High" indicates peak cognitive function, while "Low" suggests a need for rest.
        </p>
      </div>

      {/* Weekly History Mini-View */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
           Weekly History
        </h3>
        <div className="flex justify-between gap-2 overflow-x-auto pb-2">
          {weeklyData.map((day, idx) => {
            const checks = Object.values(day.checks);
            const moods = checks.map(c => c.mood).filter(m => m !== undefined);
            const brainMap = { 'high': 10, 'low': 5, 'off': 0 };
            const brains = checks.map(c => brainMap[c.brain] || 0);

            const moodAvg = moods.length > 0 ? Math.round(moods.reduce((a,b)=>a+b,0)/moods.length) : 0;
            const brainAvg = checks.length > 0 ? Math.round(brains.reduce((a,b)=>a+b,0)/checks.length) : 0;

            const dateObj = new Date(day.date + 'T12:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={idx} className="flex flex-col items-center min-w-[60px]">
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative h-24 flex items-end justify-center gap-1 px-1">
                  {moodAvg > 0 && (
                    <div
                      className={`w-3 rounded-t-sm transition-all duration-500 ${moodAvg > 7 ? 'bg-green-500' : moodAvg > 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ height: `${moodAvg * 10}%` }}
                      title={`Mood: ${moodAvg}`}
                    ></div>
                  )}
                  {brainAvg > 0 && (
                    <div
                      className={`w-3 rounded-t-sm transition-all duration-500 ${brainAvg >= 8 ? 'bg-purple-500' : brainAvg >= 4 ? 'bg-blue-500' : 'bg-slate-400'}`}
                      style={{ height: `${brainAvg * 10}%` }}
                      title={`Brain: ${brainAvg}`}
                    ></div>
                  )}
                </div>
                <span className="text-[10px] mt-2 font-bold dark:text-gray-400 uppercase">{dayName}</span>
                <div className="flex gap-1 text-[8px] font-medium dark:text-gray-500">
                  <span>M:{moodAvg || '-'}</span>
                  <span>B:{brainAvg || '-'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
