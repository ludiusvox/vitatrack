import { ChevronLeft, ChevronRight, Calendar, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

export default function Sidebar({ selectedDate, setSelectedDate, isCollapsed, setIsCollapsed }) {
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const handlePrev = () => {
    const d = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid DST edge cases
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  };

  const handleNext = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
  };

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

      <div className={`bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 ${isCollapsed ? 'px-1' : ''}`}>
        {!isCollapsed && <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Select Date</label>}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${isCollapsed ? 'text-[10px] p-1' : ''}`}
        />
      </div>

      {!isCollapsed && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Previous Day"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center flex-1 px-1">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Next Day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
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
