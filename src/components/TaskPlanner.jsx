import { useState } from 'react';
import { ChevronDown, Plus, Star, Trash2 } from 'lucide-react';
import TimeWheel from './TimeWheel';
import FilterBar from './FilterBar';
import { notify } from '../lib/notify';
import { fmt12, pad } from '../utils/dates';
import { requestConfirmation } from '../lib/confirm';

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
  const deleteSub = async (id) => {
    const subtask = subs.find((item) => item.id === id);
    const confirmed = await requestConfirmation({
      title: 'Delete subtask?',
      message: `Delete "${subtask?.title || 'this subtask'}"? This cannot be undone.`,
    });
    if (confirmed) saveTask({ ...t, subtasks: subs.filter((item) => item.id !== id) });
  };

  return (
    <li className="task">
      <div className={`row ${t.done ? 'done' : ''}`}>
        <input type="checkbox" checked={t.done} aria-label={`Mark ${t.title} as complete`} onChange={() => saveTask({ ...t, done: !t.done })} />
        <span className="row-date">{fmt12(t.start)} – {fmt12(t.end)}</span>
        <span className="row-title">{t.title}</span>
        {subs.length > 0 && (
          <span className="tag">{subs.filter((s) => s.done).length}/{subs.length}</span>
        )}
        <button
          className="icon task-icon-button"
          aria-label={starred ? 'Already saved' : 'Save as reusable task'}
          title={starred ? 'Already saved' : 'Save as reusable task'}
          disabled={starred}
          onClick={() => saveTemplate(t)}
        >
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
        <button className="icon task-icon-button danger-button" aria-label="Delete task" onClick={async () => {
          const confirmed = await requestConfirmation({
            title: 'Delete task?',
            message: `Delete "${t.title}"? This cannot be undone.`,
          });
          if (confirmed) deleteTask(t.id);
        }}><Trash2 size={16} /></button>
      </div>

      <ul className="subs">
        {subs.map((s) => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <input type="checkbox" checked={s.done} aria-label={`Mark ${s.title} as complete`} onChange={() => toggleSub(s.id)} />
            <span className="grow">{s.title}</span>
            <button className="icon task-icon-button danger-button" aria-label="Delete subtask" onClick={() => deleteSub(s.id)}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>

      <form className="sub-form" onSubmit={addSub}>
        <input placeholder="+ Add subtask" value={sub} onChange={(e) => setSub(e.target.value)} />
        <button className="subtask-add-button" type="submit" aria-label="Add subtask" disabled={!sub.trim()}><Plus size={15} /></button>
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

  const addTemplateTask = (tpl) =>
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
          <button type="submit" className="primary action-button"><Plus size={16} /> Add task</button>
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

      <details className="templates">
        <summary>
          <span className="saved-task-summary-icon"><Star size={15} /></span>
          <span><strong>Saved tasks</strong><small>{templates.length} reusable task{templates.length === 1 ? '' : 's'}</small></span>
          <ChevronDown className="saved-task-chevron" size={16} />
        </summary>
        {templates.length === 0 ? (
          <div className="saved-tasks-empty">
            <span className="saved-tasks-empty-icon"><Star size={18} /></span>
            <div>
              <strong>No saved tasks yet</strong>
              <p>Use the star beside a task to save it here for quick reuse.</p>
            </div>
          </div>
        ) : (
          <div className="saved-task-grid">
            {templates.map((tpl) => (
              <article key={tpl.id} className="saved-task-card">
                <div className="saved-task-card-time">{fmt12(tpl.start)} – {fmt12(tpl.end)}</div>
                <strong>{tpl.title}</strong>
                {tpl.subtasks.length > 0 && <span className="saved-task-subcount">{tpl.subtasks.length} subtasks</span>}
                <div className="saved-task-card-actions">
                  <button className="action-button" onClick={() => addTemplateTask(tpl)}><Plus size={15} /> Add</button>
                  <button className="icon task-icon-button danger-button" aria-label="Remove saved task" onClick={() => deleteTemplate(tpl.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </details>
    </div>
  );
}