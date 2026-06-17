import { useState, useEffect } from 'react';
import { getDB } from '../db';
import { Trophy, CalendarDays, TrendingUp, HeartPulse, AlertCircle, Shirt, Car, ListTodo, Home } from 'lucide-react';

export default function GamificationStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        // Fetch all data from our single consolidated store safely
        const db = await getDB();
        
        if (!isMounted) return;

        let tz = localStorage.getItem('vitatrack-timezone') || 'America/New_York';
        try { new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date()); } catch(e) { tz = 'America/New_York'; }

        const fmtDate = (dateObj) => 
          new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObj);

        const todayStr = fmtDate(new Date());
        
        // Helper to calculate completion rate for a date range (placeholder as requested)
        const calcRate = (startDate, endDate) => 0; 

        const dailyGrade = calcRate(todayStr, todayStr) !== null ? calcRate(todayStr, todayStr) : 0;

        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        const weeklyStartStr = fmtDate(lastWeekStart);
        const weeklyRate = calcRate(weeklyStartStr, todayStr);

        const lastMonthStart = new Date();
        lastMonthStart.setDate(lastMonthStart.getDate() - 29);
        const monthlyStartStr = fmtDate(lastMonthStart);
        const monthlyRate = calcRate(monthlyStartStr, todayStr);

        // OPTIMIZED STREAK CALCULATION:
        let completedDatesSet = new Set();
        
        (db.logs || []).forEach(log => { if (log.completed && log.date) completedDatesSet.add(log.date); });
        (db.bedroom || []).forEach(t => { if (t.completed && t.date) completedDatesSet.add(t.date); });
        // Fixed: Chores now track progress via nextDueDate instead of date
        (db.chores || []).forEach(c => { if (c.completed && c.nextDueDate) completedDatesSet.add(c.nextDueDate); });

        const sortedDates = Array.from(completedDatesSet).sort().reverse();
        let streak = 0;
        let checkDateStr = todayStr;
        
        for (let i = 0; i < 365 && sortedDates.length > 0; i++) {
          if (sortedDates.includes(checkDateStr)) {
            streak++;
            const d = new Date(checkDateStr + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            checkDateStr = fmtDate(d);
          } else {
            break;
          }
        }

        // Calculate progress for categories safely with type coercion guards
        const bedroomTasks = Array.isArray(db.bedroom) ? db.bedroom : [];
        const bedroomProgress = bedroomTasks.length > 0 
          ? Math.round((bedroomTasks.filter(t => t.completed).length / bedroomTasks.length) * 100) 
          : 0;

        const laundryItems = Array.isArray(db.laundryData?.items) ? db.laundryData.items : [];
        const laundryProgress = laundryItems.length > 0 
          ? Math.round((laundryItems.filter(i => i.completed).length / laundryItems.length) * 100) 
          : 0;

        // Fixed: Filter chores by nextDueDate for the last 7 days to match storage schema
        const choresList = Array.isArray(db.chores) ? db.chores : [];
        const last7DaysChores = choresList.filter(c => c.nextDueDate >= weeklyStartStr && c.nextDueDate <= todayStr);
        const choresProgress = last7DaysChores.length > 0 
          ? Math.round((last7DaysChores.filter(c => c.completed).length / last7DaysChores.length) * 100) 
          : 0;

        // Auto habits: Only count active (non-expired) habits for progress
        const autoList = Array.isArray(db.autoHabits) ? db.autoHabits : [];
        const now = Date.now();
        const activeAutoHabits = autoList.filter(h => !h.expiresAt || h.expiresAt > now);
        const autoProgress = activeAutoHabits.length > 0 
          ? Math.round((activeAutoHabits.filter(h => h.completed).length / activeAutoHabits.length) * 100) 
          : 0;

        // Combine with generic logs breakdown if available
        const habitTypes = {};
        (db.logs || []).filter(l => l.date >= weeklyStartStr && l.date <= todayStr).forEach(log => {
          if (!habitTypes[log.type]) habitTypes[log.type] = { total: 0, completed: 0 };
          habitTypes[log.type].total++;
          if (log.completed) habitTypes[log.type].completed++;
        });

        const breakdownData = Object.entries(habitTypes).map(([type, data]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
          color: 'bg-blue-500' 
        }));

        // Ensure new categories are represented in breakdown if they have data
        const existingNames = breakdownData.map(d => d.name);
        if (!existingNames.includes('Bedroom') && bedroomTasks.length > 0) breakdownData.push({ name: 'Bedroom', progress: bedroomProgress, color: 'bg-blue-500' });
        if (!existingNames.includes('Laundry') && laundryItems.length > 0) breakdownData.push({ name: 'Laundry', progress: laundryProgress, color: 'bg-purple-500' });
        if (!existingNames.includes('Chores') && last7DaysChores.length > 0) breakdownData.push({ name: 'Chores', progress: choresProgress, color: 'bg-orange-500' });
        if (!existingNames.includes('Auto') && activeAutoHabits.length > 0) breakdownData.push({ name: 'Auto', progress: autoProgress, color: 'bg-green-500' });

        setStats({
          dailyGrade: dailyGrade,
          weeklyRate: weeklyRate !== null ? `${weeklyRate}%` : 'Undetermined',
          monthlyRate: monthlyRate !== null ? `${monthlyRate}%` : 'Undetermined',
          streak: streak,
          hasMonthlyData: monthlyRate !== null,
          breakdownData: breakdownData.length > 0 ? breakdownData : [
            { name: 'Morning Hygiene', progress: 85, color: 'bg-blue-500' },
            { name: 'Medication Adherence', progress: 60, color: 'bg-green-500' },
            { name: 'Evening Routine', progress: 95, color: 'bg-purple-500' }
          ]
        });
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Gamification Hub...</div>;

  const formatRate = (rate, hasData) => {
    if (!hasData || rate === 'Undetermined') {
      return <span className="text-orange-500 flex items-center gap-1"><AlertCircle size={24} /> Undetermined</span>;
    }
    return <span className="text-3xl font-bold text-green-500">{rate}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Daily Grade Hero Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-100 font-medium mb-1 uppercase tracking-wider text-sm">Today's Grade</p>
          <h2 className="text-7xl font-bold">{stats.dailyGrade}%</h2>
          <p className="mt-3 text-indigo-50 max-w-md">Keep it up! Consistent habits lead to better health outcomes.</p>
        </div>
        <Trophy size={100} className="opacity-80 absolute right-6 top-6 rotate-12" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute left-10 top-10 w-20 h-20 bg-purple-300/20 rounded-full blur-lg"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="text-blue-500" size={24} />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Weekly Trend</h3>
          </div>
          {formatRate(stats.weeklyRate, stats.weeklyRate !== 'Undetermined')}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">vs last week</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Monthly Trend</h3>
          </div>
          {formatRate(stats.monthlyRate, stats.hasMonthlyData)}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">vs last month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <HeartPulse className="text-purple-500" size={24} />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.streak} days</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep the momentum going!</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Category Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bedroom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Shirt size={18} /> Bedroom</span>
              <span className="text-sm font-bold text-blue-500">{stats.breakdownData.find(d => d.name === 'Bedroom')?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.breakdownData.find(d => d.name === 'Bedroom')?.progress || 0}%` }}></div>
            </div>
          </div>

          {/* Auto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Car size={18} /> Automobile</span>
              <span className="text-sm font-bold text-green-500">{stats.breakdownData.find(d => d.name === 'Auto')?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.breakdownData.find(d => d.name === 'Auto')?.progress || 0}%` }}></div>
            </div>
          </div>

          {/* Laundry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><ListTodo size={18} /> Laundry</span>
              <span className="text-sm font-bold text-purple-500">{stats.breakdownData.find(d => d.name === 'Laundry')?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.breakdownData.find(d => d.name === 'Laundry')?.progress || 0}%` }}></div>
            </div>
          </div>

          {/* Chores */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Home size={18} /> Chores</span>
              <span className="text-sm font-bold text-orange-500">{stats.breakdownData.find(d => d.name === 'Chores')?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${stats.breakdownData.find(d => d.name === 'Chores')?.progress || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Habit Completion Breakdown <span className="text-sm font-normal text-gray-500">(Last 7 Days)</span></h3>
        <div className="space-y-5">
          {stats.breakdownData.map((habit) => (
            <div key={habit.name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{habit.name}</span>
                <span className="text-sm font-medium text-gray-500">{habit.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className={`${habit.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${habit.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
