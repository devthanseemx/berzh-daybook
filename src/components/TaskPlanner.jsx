import { useState } from 'react';
import TimeWheel from './TimeWheel';
import FilterBar from './FilterBar';
import { notify } from '../lib/notify';
import { fmt12, pad } from '../utils/dates';

const addHour = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${pad(Math.min(h + 1, 23))}:${pad(m)}`;
};

const snap5 = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${pad(h)}:${pad(Math.min(55, Math.round(m / 5) * 5))}`;
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
        <span className="row-date">{fmt12(t.start)} – {fmt12(t.end)}</span>
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
  const lastEnd = snap5(sorted.length ? sorted[sorted.length - 1].end : '09:00');

  const [start, setStart] = useState(lastEnd);
  const [end, setEnd] = useState(addHour(lastEnd));
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('all');
  const [order, setOrder] = useState('asc');

  const shown = sorted
    .filter((t) => status === 'all' || (status === 'done' ? t.done : !t.done))
    .sort((a, b) => (order === 'asc' ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)));

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return notify.warning('Enter a task name first');
    if (end <= start) return notify.warning('End time must be after the start time');
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

      {sorted.length > 1 && (
        <div className="section-head" style={{ marginTop: 14 }}>
          <span className="muted">{shown.length} of {sorted.length} tasks</span>
          <FilterBar status={status} setStatus={setStatus} order={order} setOrder={setOrder} />
        </div>
      )}

      <ul className="list">
        {shown.map((t) => (
          <TaskItem
            key={t.id}
            t={t}
            starred={isStarred(t)}
            saveTask={saveTask}
            deleteTask={deleteTask}
            saveTemplate={saveTemplate}
          />
        ))}
      </ul>
      {sorted.length === 0 && <p className="muted">No time blocks for this day yet.</p>}
      {sorted.length > 0 && shown.length === 0 && <p className="muted">No tasks match this filter.</p>}

      <details className="templates" open>
        <summary>★ Saved tasks ({templates.length})</summary>
        {templates.length === 0 ? (
          <p className="muted">Press ☆ on any task to save it here and reuse it on any date.</p>
        ) : (
          <ul className="list">
            {templates.map((tpl) => (
              <li key={tpl.id} className="row nopointer">
                <span className="row-date">{fmt12(tpl.start)} – {fmt12(tpl.end)}</span>
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