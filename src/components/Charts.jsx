import { useMemo } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { toKey, todayKey } from '../utils/dates';

const COLOR = { done: '#10b981', pending: '#6366f1', missed: '#ef4444', cat: '#8b5cf6' };
const tip = {
  contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--text)' },
};
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
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
      const list = tasks.filter((t) => t.date === toKey(d));
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        Completed: list.filter((t) => t.done).length,
        Pending: list.filter((t) => !t.done).length,
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
      <div className="card">
        <h3>Task status</h3>
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

      <div className="card">
        <h3>Tasks per day · last 7 and next 7 days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={days}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} interval="preserveStartEnd" minTickGap={8} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <Tooltip {...tip} cursor={barCursor} />
            <Legend />
            <Bar dataKey="Completed" stackId="a" fill={COLOR.done} />
            <Bar dataKey="Pending" stackId="a" fill={COLOR.pending} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card full">
        <h3>Events by category</h3>
        {categories.length === 0 ? (
          <p className="muted">Add some events to see this chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(150, categories.length * 44)}>
            <BarChart data={categories} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={barCursor} />
              <Bar dataKey="value" name="Events" fill={COLOR.cat} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}