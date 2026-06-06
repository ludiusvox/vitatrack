import { useState, useEffect } from 'react';
import { getDB } from '../db';
import { BarChart3, Trophy, CalendarDays, TrendingUp, HeartPulse, AlertCircle } from 'lucide-react';

export default function GamificationStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const db = await getDB();
        // Ensure logs is an array and filter out invalid entries
        const logs = (db.logs || []).filter(l => l.date && typeof l.completed === 'boolean');
        
        let tz = localStorage.getItem('vitatrack-timezone') || 'America/New_York';
        try { new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date()); } catch(e) { tz = 'America/New_York'; }

        // Consistent date formatter matching the app's timezone logic to prevent UTC/local mismatches
        const fmtDate = (dateObj) => 
          new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObj);

        const todayStr = fmtDate(new Date());
        
        // Helper to calculate completion rate for a date range
        const calcRate = (startDate, endDate) => {
          const filteredLogs = logs.filter(log => log.date >= startDate && log.date <= endDate);
          if (filteredLogs.length === 0) return null;
          const completedCount = filteredLogs.filter(l => l.completed).length;
          return Math.round((completedCount / filteredLogs.length) * 100);
        };

        // Today's grade
        const todayRate = calcRate(todayStr, todayStr);
        const dailyGrade = todayRate !== null ? todayRate : 0;

        // Last week (7 days including today)
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        const weeklyStartStr = fmtDate(lastWeekStart);
        const weeklyRate = calcRate(weeklyStartStr, todayStr);

        // Last month (30 days including today)
        const lastMonthStart = new Date();
        lastMonthStart.setDate(lastMonthStart.getDate() - 29);
        const monthlyStartStr = fmtDate(lastMonthStart);
        const monthlyRate = calcRate(monthlyStartStr, todayStr);

        // Streak calculation: consecutive days with at least one completed task
        let streak = 0;
        let checkDate = new Date();
        while (true) {
          const dateStr = fmtDate(checkDate);
          const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
          if (dayLogs.length > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Habit breakdown by type for the last week
        const habitTypes = {};
        logs.filter(l => l.date >= weeklyStartStr && l.date <= todayStr).forEach(log => {
          if (!habitTypes[log.type]) habitTypes[log.type] = { total: 0, completed: 0 };
          habitTypes[log.type].total++;
          if (log.completed) habitTypes[log.type].completed++;
        });

        const breakdownData = Object.entries(habitTypes).map(([type, data]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
          color: 'bg-blue-500' 
        }));

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
        setLoading(false);
      }
    };
    fetchStats();
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
        {/* Decorative background circles */}
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
