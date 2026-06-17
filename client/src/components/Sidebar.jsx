import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, PanelLeftClose, PanelLeftOpen, X, Home, Car, Shirt, ListTodo, Pill } from 'lucide-react';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export default function Sidebar({ selectedDate, setSelectedDate, isCollapsed, setIsCollapsed, activeView, setActiveView }) {
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('vitatrack-timezone') || 'America/New_York';
  });

  useEffect(() => {
    localStorage.setItem('vitatrack-timezone', timezone);
  }, [timezone]);

  // Updated to safely handle both strings and Date objects
  const formatDate = (input) => {
    let d;
    if (input instanceof Date) {
      d = input;
    } else {
      // Append T12:00:00 to treat the YYYY-MM-DD string as local noon, preventing UTC shift issues
      d = new Date(input + 'T12:00:00'); 
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format dates for display with the selected timezone
  const formatDateWithTimezone = (dateStr, options) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { ...options, timeZone: timezone });
  };

  const handlePrev = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  };

  const handleNext = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
  };

  // Generate a list of dates for the sidebar listing (e.g., last 3 days to next 3 days)
  const generateDateList = () => {
    const dates = [];
    const baseDate = new Date(selectedDate + 'T12:00:00');
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d)); // Now safely handles the Date object
    }
    return dates;
  };

  const dateList = generateDateList();

  const navItems = [
    { id: 'tracker', label: 'Tracker', icon: Home },
    { id: 'bedroom', label: 'Bedroom', icon: Shirt },
    { id: 'auto', label: 'Auto', icon: Car },
    { id: 'laundry', label: 'Laundry', icon: ListTodo },
    { id: 'chores', label: 'Chores', icon: ListTodo },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'stats', label: 'Stats', icon: Home } 
  ];

  return (
    <aside className={`${isCollapsed ? 'w-0 lg:w-20 overflow-hidden p-0 lg:p-5' : 'w-72 p-5'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col gap-4 shadow-sm transition-all duration-300 relative z-40`}>
      {/* Desktop Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1 shadow-md hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden lg:block"
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {/* Sidebar Header with X Close Button */}
      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'mx-auto' : ''}`}>
          <Calendar size={24} />
          {!isCollapsed && <h2 className="text-xl font-bold tracking-tight">History</h2>}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-red-100"
            aria-label="Close Sidebar"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Category Navigation */}
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  activeView === item.id 
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Previous Day"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center flex-1 px-1">
              {formatDateWithTimezone(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Next Day"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Synced Date Listing */}
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Recent Dates</label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {dateList.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDate === date
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {formatDateWithTimezone(date, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <label htmlFor="timezone-select" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              App Timezone
            </label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="hidden lg:flex flex-col gap-2">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronLeft size={24} /></button>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronRight size={24} /></button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        {!isCollapsed ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Select a date above to view and edit past checklists. Data is stored locally.
          </p>
        ) : (
          <div className="text-center hidden lg:block">
            <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1 animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
