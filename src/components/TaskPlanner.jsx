import { useState } from 'react';
import TimeWheel from './TimeWheel';

const addHour = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

function TaskItem({ t, starred, saveTask, deleteTask, saveTemplate }) {
  const [sub, setSub] = useState('');
  const subs = t.subtasks || [];

  const addSub = (e) => {
    e.preventDefault();
    if (!sub.trim()) return;
    saveTask({ ...t, subtasks: [...subs, { id: crypto.randomUUID(), title: sub.trim(), done: false }] });
    setSub('');
  };
  const toggleSub = (id) =>
    saveTask({ ...t, subtasks: subs.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });
  const deleteSub = (id) => saveTask({ ...t, subtasks: subs.filter((s) => s.id !== id) });

  return (
    <li className="task">
      <div className={`row ${t.done ? 'done' : ''}`}>
        <input type="checkbox" checked={t.done} onChange={() => saveTask({ ...t, done: !t.done })} />
        <span className="row-date">{t.start} – {t.end}</span>
        <span className="row-title">{t.title}</span>
        {subs.length > 0 && (
          <span className="tag">{subs.filter((s) => s.done).length}/{subs.length}</span>
        )}
        <button
          className="icon"
          title={starred ? 'Already saved' : 'Save as reusable task'}
          disabled={starred}
          onClick={() => saveTemplate(t)}
        >
          {starred ? '★' : '☆'}
        </button>
        <button className="icon" aria-label="Delete task" onClick={() => deleteTask(t.id)}>✕</button>
      </div>

      <ul className="subs">
        {subs.map((s) => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} />
            <span className="grow">{s.title}</span>
            <button className="icon" aria-label="Delete subtask" onClick={() => deleteSub(s.id)}>✕</button>
          </li>
        ))}
      </ul>

      <form className="sub-form" onSubmit={addSub}>
        <input placeholder="+ Add subtask" value={sub} onChange={(e) => setSub(e.target.value)} />
      </form>
    </li>
  );
}

export default function TaskPlanner({
  date, tasks, templates, saveTask, deleteTask, saveTemplate, deleteTemplate,
}) {
  const sorted = [...tasks].sort((a, b) => a.start.localeCompare(b.start));
  const lastEnd = sorted.length ? sorted[sorted.length - 1].end : '09:00';

  const [start, setStart] = useState(lastEnd);
  const [end, setEnd] = useState(addHour(lastEnd));
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (end <= start) return setError('End time must be after start time.');
    setError('');
    saveTask({ id: crypto.randomUUID(), date, start, end, title: title.trim(), done: false, subtasks: [] });
    setTitle('');
    setStart(end); // next block starts where this one ended
    setEnd(addHour(end));
  };

  const useTemplate = (tpl) =>
    saveTask({
      id: crypto.randomUUID(),
      date,
      start: tpl.start,
      end: tpl.end,
      title: tpl.title,
      done: false,
      subtasks: tpl.subtasks.map((s) => ({ id: crypto.randomUUID(), title: s, done: false })),
    });

  const isStarred = (t) =>
    templates.some((x) => x.title === t.title && x.start === t.start && x.end === t.end);

  return (
    <div>
      <form onSubmit={add}>
        <div className="time-pick">
          <TimeWheel label="Start" value={start} onChange={setStart} />
          <TimeWheel label="End" value={end} onChange={setEnd} />
        </div>
        <div className="task-form">
          <input className="grow" placeholder="What to do?" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="submit" className="primary">Add</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}

      <ul className="list">
        {sorted.map((t) => (
          <TaskItem
            key={t.id}
            t={t}
            starred={isStarred(t)}
            saveTask={saveTask}
            deleteTask={deleteTask}
            saveTemplate={saveTemplate}
          />
        ))}
        {sorted.length === 0 && <p className="muted">No time blocks for this day yet.</p>}
      </ul>

      <details className="templates" open>
        <summary>★ Saved tasks ({templates.length})</summary>
        {templates.length === 0 ? (
          <p className="muted">Press ☆ on any task to save it here and reuse it on any date.</p>
        ) : (
          <ul className="list">
            {templates.map((tpl) => (
              <li key={tpl.id} className="row nopointer">
                <span className="row-date">{tpl.start} – {tpl.end}</span>
                <span className="row-title">
                  {tpl.title}
                  {tpl.subtasks.length > 0 && <span className="muted"> · {tpl.subtasks.length} subtasks</span>}
                </span>
                <button onClick={() => useTemplate(tpl)}>+ Add to this day</button>
                <button className="icon" aria-label="Remove saved task" onClick={() => deleteTemplate(tpl.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}