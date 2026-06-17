import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HygieneChecklist from './components/HygieneChecklist';
import Medications from './components/Medications';
import GamificationStats from './components/GamificationStats';
import BedroomTracker from './components/BedroomTracker';
import AutoTracker from './components/AutoTracker';
import LaundryCountdown from './components/LaundryCountdown';
import ChoreChecklist from './components/ChoreChecklist';
import Prescriptions from './components/Prescriptions';
import { Moon, Sun, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

export default function App() {
  const getTodayStr = () => {
    let tz = localStorage.getItem('vitatrack-timezone') || 'America/New_York';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    } catch (e) {
      console.error("Invalid timezone, falling back to America/New_York");
      tz = 'America/New_York';
    }

    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [today, setToday] = useState(getTodayStr());
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('tracker');

  useEffect(() => {
    const checkMidnight = () => {
      const currentToday = getTodayStr();
      if (today !== currentToday) {
        if (selectedDate === today) {
          setSelectedDate(currentToday);
        }
        setToday(currentToday);
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [selectedDate, today]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      body.style.backgroundColor = '#111827';
      html.style.backgroundColor = '#111827';
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      body.style.backgroundColor = '#f9fafb';
      html.style.backgroundColor = '#f9fafb';
    }
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activeView) {
      case 'bedroom': return <BedroomTracker date={selectedDate} />;
      case 'auto': return <AutoTracker />;
      case 'laundry': return <LaundryCountdown />;
      case 'chores': return <ChoreChecklist date={selectedDate} />;
      case 'prescriptions': return <Prescriptions date={selectedDate} />;
      case 'stats': return <GamificationStats />;
      default: return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Hygiene Checklist — {selectedDate}
              </h3>
              <HygieneChecklist date={selectedDate} />
            </div>
            <Medications date={selectedDate} />
          </div>
        </>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
              </button>
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 drop-shadow-sm">
                VitaTrack
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Elevate your daily wellness journey.</p>
          </div>

          {/* Right-aligned Tabs & Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-600 dark:text-gray-300"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
