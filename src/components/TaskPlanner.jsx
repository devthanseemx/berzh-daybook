import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Star, Trash2 } from 'lucide-react';
import TimeWheel from './TimeWheel';
import FilterBar from './FilterBar';
import { notify } from '../lib/notify';
import { fmt12, getTaskDates, pad, shortDate } from '../utils/dates';
import { requestConfirmation } from '../lib/confirm';
import SavedTaskEditorModal from './SavedTaskEditorModal';

const addHour = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${pad(Math.min(h + 1, 23))}:${pad(m)}`;
};

const snap5 = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${pad(h)}:${pad(Math.min(55, Math.round(m / 5) * 5))}`;
};

function TaskItem({ t, starred, selected, onToggleSelect, saveTask, deleteTask, saveTemplate, showDate }) {
  const [sub, setSub] = useState('');
  const [subsOpen, setSubsOpen] = useState(true);
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
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select task ${t.title}`}
          onChange={() => onToggleSelect(t.id)}
        />
        <input type="checkbox" checked={t.done} aria-label={`Mark ${t.title} as complete`} onChange={() => saveTask({ ...t, done: !t.done })} />
        <span className="row-date">{showDate ? `${shortDate(t.date)} · ` : ''}{fmt12(t.start)} – {fmt12(t.end)}</span>
        <span className="row-title">{t.title}</span>
        {subs.length > 0 ? (
          <button
            type="button"
            className="subtask-count"
            aria-expanded={subsOpen}
            aria-label={`${subsOpen ? 'Collapse' : 'Expand'} ${subs.length} subtasks`}
            onClick={() => setSubsOpen((open) => !open)}
          >
            {subsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {subs.filter((s) => s.done).length}/{subs.length}
          </button>
        ) : <span className="subtask-count-placeholder" aria-hidden="true" />}
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

      {t.description && <p className="task-description">{t.description}</p>}

      {subsOpen && (
        <>
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
        </>
      )}
    </li>
  );
}

export default function TaskPlanner({
  date, tasks, allTasks = tasks, templates, saveTask, saveTasks, deleteTask, saveTemplate, deleteTemplate,
  updateTemplate, onRequestBulkDelete,
}) {
  const dayTasks = [...tasks].sort((a, b) => a.start.localeCompare(b.start));
  const sorted = [...allTasks].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const lastEnd = snap5(dayTasks.length ? dayTasks[dayTasks.length - 1].end : '09:00');

  const [start, setStart] = useState(lastEnd);
  const [end, setEnd] = useState(addHour(lastEnd));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openTemplateId, setOpenTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [status, setStatus] = useState('all');
  const [order, setOrder] = useState('asc');

  const shown = sorted
    .filter((t) => status === 'all' || (status === 'done' ? t.done : !t.done))
    .sort((a, b) => {
      const byDateAndTime = (a.date + a.start).localeCompare(b.date + b.start);
      return order === 'asc' ? byDateAndTime : -byDateAndTime;
    });
  const toggleSelection = (setIds, id) => setIds((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  );
  const toggleAllSelection = (setIds, items, selectedIds) => {
    const ids = items.map((item) => item.id);
    setIds(ids.every((id) => selectedIds.includes(id))
      ? selectedIds.filter((id) => !ids.includes(id))
      : [...new Set([...selectedIds, ...ids])]);
  };

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return notify.warning('Enter a task name first');
    if (end <= start) return notify.warning('End time must be after the start time');
    saveTask({
      id: crypto.randomUUID(),
      date,
      start,
      end,
      title: title.trim(),
      description: description.trim(),
      done: false,
      subtasks: [],
    });
    setTitle('');
    setDescription('');
    setStart(end); // next block starts where this one ended
    setEnd(addHour(end));
  };

  const addTemplateTasks = (tpl, range) => {
    const dates = getTaskDates(range, date);
    saveTasks(dates.map((taskDate) => ({
      id: crypto.randomUUID(),
      date: taskDate,
      start: tpl.start,
      end: tpl.end,
      title: tpl.title,
      description: tpl.description || '',
      done: false,
      subtasks: tpl.subtasks.map((s) => ({ id: crypto.randomUUID(), title: s, done: false })),
    })));
    setOpenTemplateId(null);
  };

  const isStarred = (t) =>
    templates.some((x) =>
      x.title === t.title
      && x.start === t.start
      && x.end === t.end
      && (x.description || '') === (t.description || '')
    );

  return (
    <div>
      <form onSubmit={add}>
        <div className="time-pick">
          <TimeWheel label="Start" value={start} onChange={setStart} />
          <TimeWheel label="End" value={end} onChange={setEnd} />
        </div>
        <div className="task-form">
          <div className="task-form-fields">
            <input className="grow" placeholder="What to do?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              className="task-description-input"
              placeholder="Description (optional)"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="primary action-button"><Plus size={16} /> Add task</button>
        </div>
      </form>

      <div className="section-head planner-task-heading">
        <div>
          <strong>All tasks</strong>
          <span className="muted">{shown.length} of {sorted.length} tasks across all dates</span>
        </div>
        {sorted.length > 0 && <FilterBar status={status} setStatus={setStatus} order={order} setOrder={setOrder} />}
      </div>

      {sorted.length > 0 ? (
        <div className="all-task-list">
          <ul className="list">
            {shown.map((t) => (
              <TaskItem
                key={t.id}
                t={t}
                showDate
                starred={isStarred(t)}
                selected={selectedTaskIds.includes(t.id)}
                onToggleSelect={(id) => toggleSelection(setSelectedTaskIds, id)}
                saveTask={saveTask}
                deleteTask={deleteTask}
                saveTemplate={saveTemplate}
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">No time blocks yet. Add one above or reuse a saved task.</p>
      )}

      {shown.length > 0 && (
        <div className="bulk-actions planner-bulk-actions">
          <button className="bulk-select-all" onClick={() => toggleAllSelection(setSelectedTaskIds, shown, selectedTaskIds)}>
            {shown.every((task) => selectedTaskIds.includes(task.id)) ? 'Clear selection' : 'Select visible'}
          </button>
          {shown.some((task) => selectedTaskIds.includes(task.id)) && (
            <button
              className="action-button danger-button"
              onClick={() => onRequestBulkDelete('task', shown.filter((task) => selectedTaskIds.includes(task.id)))}
            >
              <Trash2 size={14} /> Delete selected ({shown.filter((task) => selectedTaskIds.includes(task.id)).length})
            </button>
          )}
        </div>
      )}
      {sorted.length > 0 && shown.length === 0 && <p className="muted">No tasks match this filter.</p>}

      <details
        className="templates"
        open={templatesOpen}
        onToggle={(event) => setTemplatesOpen(event.currentTarget.open)}
      >
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
          <>
            <div className="saved-template-toolbar bulk-actions">
              <button className="bulk-select-all" onClick={() => toggleAllSelection(setSelectedTemplateIds, templates, selectedTemplateIds)}>
                {templates.every((template) => selectedTemplateIds.includes(template.id)) ? 'Clear selection' : 'Select all'}
              </button>
              {templates.some((template) => selectedTemplateIds.includes(template.id)) && (
                <button
                  className="action-button danger-button"
                  onClick={() => onRequestBulkDelete('template', templates.filter((template) => selectedTemplateIds.includes(template.id)))}
                >
                  <Trash2 size={14} /> Delete selected ({templates.filter((template) => selectedTemplateIds.includes(template.id)).length})
                </button>
              )}
            </div>
            <div className="saved-task-grid">
              {templates.map((tpl) => (
                <article key={tpl.id} className="saved-task-card">
                  <label className="saved-task-select">
                    <input
                      type="checkbox"
                      checked={selectedTemplateIds.includes(tpl.id)}
                      aria-label={`Select saved task ${tpl.title}`}
                      onChange={() => toggleSelection(setSelectedTemplateIds, tpl.id)}
                    />
                    <span>Select</span>
                  </label>
                  <div className="saved-task-card-time">{fmt12(tpl.start)} – {fmt12(tpl.end)}</div>
                  <strong>{tpl.title}</strong>
                  {tpl.description && <p className="saved-task-card-description">{tpl.description}</p>}
                  {tpl.subtasks?.length > 0 && <span className="saved-task-subcount">{tpl.subtasks.length} subtasks</span>}
                  <div className="saved-task-card-actions">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => {
                        setEditingTemplate({
                          ...tpl,
                          title: tpl.title,
                          description: tpl.description || '',
                          subtasks: (tpl.subtasks || []).map((subtask) => ({ title: subtask })),
                        });
                        setOpenTemplateId(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="action-button"
                      aria-expanded={openTemplateId === tpl.id}
                      aria-controls={`saved-task-options-${tpl.id}`}
                      onClick={() => setOpenTemplateId(openTemplateId === tpl.id ? null : tpl.id)}
                    >
                      <Plus size={15} /> Add to day <ChevronDown size={14} />
                    </button>
                    <button
                      className="icon task-icon-button danger-button"
                      aria-label="Remove saved task"
                      onClick={async () => {
                        const confirmed = await requestConfirmation({
                          title: 'Delete saved task?',
                          message: `Delete "${tpl.title}" from saved tasks? This cannot be undone.`,
                        });
                        if (confirmed) deleteTemplate(tpl.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {openTemplateId === tpl.id && (
                    <div className="saved-task-options" id={`saved-task-options-${tpl.id}`} role="group" aria-label={`Add ${tpl.title} to`}>
                      {[
                        ['selected', 'Selected day'],
                        ['today', 'Today'],
                        ['tomorrow', 'Tomorrow'],
                        ['next7', 'Next 7 days (rolling)'],
                        ['nextWeek', 'Next week (Mon–Sun)'],
                        ['nextMonth', 'Next calendar month'],
                        ['nextYear', 'Next year (Jan–Dec)'],
                      ].map(([range, label]) => (
                        <button key={range} type="button" onClick={() => addTemplateTasks(tpl, range)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </details>
      <SavedTaskEditorModal
        template={editingTemplate}
        onChange={setEditingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={(template) => {
          updateTemplate(template);
          setEditingTemplate(null);
        }}
      />
    </div>
  );
}