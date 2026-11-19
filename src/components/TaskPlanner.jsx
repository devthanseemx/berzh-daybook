import { useState } from 'react';

export default function TaskPlanner({ date, tasks, saveTask, deleteTask }) {
  const sorted = [...tasks].sort((a, b) => a.start.localeCompare(b.start));
  const lastEnd = sorted.length ? sorted[sorted.length - 1].end : '09:00';

  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  // when the day changes or after adding, suggest the next slot starting at the last block's end
  const suggestNext = (from) => {
    const [h, m] = from.split(':').map(Number);
    const next = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setStart(from);
    setEnd(next);
  };

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (end <= start) return setError('End time must be after start time.');
    setError('');
    saveTask({ id: crypto.randomUUID(), date, start, end, title: title.trim(), done: false });
    setTitle('');
    suggestNext(end);
  };

  return (
    <div>
      <form className="task-form" onSubmit={add}>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <span>to</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        <input className="grow" placeholder="What to do?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className="primary">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {sorted.length > 0 && (
        <button className="link" onClick={() => suggestNext(lastEnd)}>
          Set next slot after {lastEnd}
        </button>
      )}

      <ul className="list">
        {sorted.map((t) => (
          <li key={t.id} className={`row ${t.done ? 'done' : ''}`}>
            <input type="checkbox" checked={t.done} onChange={() => saveTask({ ...t, done: !t.done })} />
            <span className="row-date">{t.start} – {t.end}</span>
            <span className="row-title">{t.title}</span>
            <button className="icon" onClick={() => deleteTask(t.id)} aria-label="Delete">✕</button>
          </li>
        ))}
        {sorted.length === 0 && <p className="muted">No time blocks for this day yet.</p>}
      </ul>
    </div>
  );
}