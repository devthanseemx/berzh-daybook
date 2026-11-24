import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { todayKey } from '../utils/dates';

const COLOR = { done: '#10b981', pending: '#5145e5', missed: '#ef4444' };
const tip = {
  contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--text)' },
};
export function TaskStatusChart({ tasks }) {
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

  return (
    <div className="card dashboard-card chart-card task-status-chart">
      <div className="chart-heading">
        <div className="dashboard-section-icon green"><CheckCircle2 size={17} /></div>
        <div><h3>Task status</h3><p>How your tasks are going</p></div>
      </div>
      {tasks.length === 0 ? (
        <p className="muted">Add some tasks to see this chart.</p>
      ) : (
        <>
          <p className="muted">{rate}% of all tasks completed</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={status} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={2}>
                {status.map((s) => <Cell key={s.name} fill={s.color} stroke="none" />)}
              </Pie>
              <Tooltip {...tip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}