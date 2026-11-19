import { useMemo } from 'react';
import { BriefcaseBusiness, CalendarDays, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { toKey, todayKey } from '../utils/dates';

const COLOR = { done: '#10b981', pending: '#5145e5', missed: '#ef4444' };
const tip = {
  contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--text)' },
};
const areaCursor = { fill: 'rgba(128,128,128,0.08)' };
const barCursor = { fill: 'rgba(128,128,128,0.12)' };

export default function Charts({ events, tasks }) {
  const today = todayKey();

  const status = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    const missed = tasks.filter((t) => !t.done && t.date < today).length;
    const pending = tasks.filter((t) => !t.done && t.date >= today).length;
    return [
      { name: 'Completed', value: done, color: COLOR.done },
      { name: 'Pending', value: pending, color: COLOR.pending },
      { name: 'Missed', value: missed, color: COLOR.missed },
    ].filter((d) => d.value > 0);
  }, [tasks, today]);

  const doneCount = tasks.filter((t) => t.done).length;
  const rate = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const days = useMemo(() => {
    const now = new Date();
    const countsByDay = new Map();
    tasks.forEach((task) => {
      const counts = countsByDay.get(task.date) || { Completed: 0, Pending: 0 };
      counts[task.done ? 'Completed' : 'Pending'] += 1;
      countsByDay.set(task.date, counts);
    });

    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
      const key = toKey(d);
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        date: key,
        ...(countsByDay.get(key) || { Completed: 0, Pending: 0 }),
      };
    });
  }, [tasks]);

  const categories = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  return (
    <section className="charts">
      <div className="card dashboard-card chart-card">
        <div className="chart-heading">
          <div className="dashboard-section-icon green"><CheckCircle2 size={17} /></div>
          <div><h3>Task status</h3><p>How your tasks are going</p></div>
        </div>
        {tasks.length === 0 ? (
          <p className="muted">Add some tasks to see this chart.</p>
        ) : (
          <>
            <p className="muted">{rate}% of all tasks completed</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={status} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {status.map((s) => <Cell key={s.name} fill={s.color} stroke="none" />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="card dashboard-card chart-card">
        <div className="chart-heading">
          <div className="dashboard-section-icon blue"><CalendarDays size={17} /></div>
          <div><h3>Tasks per day</h3><p>Completed and pending · 14-day view</p></div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={days}>
            <defs>
              <linearGradient id="completedTaskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR.done} stopOpacity={0.28} />
                <stop offset="95%" stopColor={COLOR.done} stopOpacity={0.015} />
              </linearGradient>
              <linearGradient id="pendingTaskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR.pending} stopOpacity={0.24} />
                <stop offset="95%" stopColor={COLOR.pending} stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <Tooltip {...tip} cursor={areaCursor} />
            <Legend />
            <Area type="monotone" dataKey="Completed" stroke={COLOR.done} strokeWidth={2} fill="url(#completedTaskFill)" activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Pending" stroke={COLOR.pending} strokeWidth={2} fill="url(#pendingTaskFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card full dashboard-card chart-card">
        <div className="chart-heading">
          <div className="dashboard-section-icon violet"><BriefcaseBusiness size={17} /></div>
          <div><h3>Events by category</h3><p>Where your time and focus are going</p></div>
        </div>
        {categories.length === 0 ? (
          <p className="muted">Add some events to see this chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(150, categories.length * 44)}>
            <BarChart data={categories} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={barCursor} />
              <Bar dataKey="value" name="Events" fill={COLOR.pending} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}