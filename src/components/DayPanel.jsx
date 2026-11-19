import { useMemo, useState } from 'react';
import { CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { prettyDate, todayKey } from '../utils/dates';
import { categoryTone } from '../utils/categoryTone';
import EventForm from './EventForm';
import TaskPlanner from './TaskPlanner';
import { requestConfirmation } from '../lib/confirm';

export default function DayPanel({
  date, events, tasks, templates, initialEditId,
  saveEvent, deleteEvent, saveTask, deleteTask, saveTemplate, deleteTemplate, onEditingDone,
}) {
  const [editing, setEditing] = useState(null); // null | 'new' | event object
  const isPast = date < todayKey();

  const initialEditEvent = useMemo(
    () => initialEditId ? events.find((item) => item.id === initialEditId) : null,
    [initialEditId, events]
  );
  const activeEditing = editing ?? initialEditEvent;

  const handleSave = (ev) => {
    saveEvent(ev);
    setEditing(null);
    onEditingDone?.();
  };

  return (
    <div className="day-panel">
      <div className="card day-header-card">
        <div className="day-header-kicker">{isPast ? 'PAST DAY' : date === todayKey() ? 'TODAY' : 'UPCOMING DAY'}</div>
        <h2>{prettyDate(date)}</h2>
        <p className="muted">{events.length} event{events.length === 1 ? '' : 's'} · {tasks.length} task{tasks.length === 1 ? '' : 's'} planned</p>
      </div>

      <div className="card day-events-card">
        <div className="card-head">
          <h3>Events</h3>
          {!activeEditing && <button className="primary action-button" onClick={() => setEditing('new')}><Plus size={16} /> Add event</button>}
        </div>

        {activeEditing && (
          <EventForm
            key={activeEditing === 'new' ? 'new' : activeEditing.id}
            date={date}
            initial={activeEditing === 'new' ? null : activeEditing}
            onSave={handleSave}
            onCancel={() => {
              setEditing(null);
              onEditingDone?.();
            }}
          />
        )}

        {events.length === 0 && !activeEditing && <p className="muted">No events on this date.</p>}

        {events.map((ev) => (
          <article key={ev.id} className="event">
            <div className="card-head">
              <strong>{ev.title}</strong>
              <span className={`tag category-tag tone-${categoryTone(ev.category)}`}>{ev.category}</span>
            </div>
            {ev.company && <p><b>Company:</b> {ev.company}</p>}
            {ev.jobTitle && <p><b>Job title:</b> {ev.jobTitle}</p>}
            {ev.salary && <p><b>Salary:</b> {ev.salary}</p>}
            {ev.description && <p><b>Description:</b> {ev.description}</p>}
            {ev.nextSteps && <p><b>To do:</b> {ev.nextSteps}</p>}
            {ev.notes && <p><b>Notes:</b> {ev.notes}</p>}
            <div className="form-actions">
              <button className="action-button" onClick={() => setEditing(ev)}><Pencil size={15} /> Edit</button>
              <button className="action-button danger-button" onClick={async () => {
                const confirmed = await requestConfirmation({
                  title: 'Delete event?',
                  message: `Delete "${ev.title}"? This cannot be undone.`,
                });
                if (confirmed) deleteEvent(ev.id);
              }}><Trash2 size={15} /> Delete</button>
            </div>
          </article>
        ))}
      </div>

      <div className="card day-time-card">
        <h3 className="time-plan-title"><CalendarPlus size={18} /> Time plan</h3>
        <TaskPlanner
  key={date}
  date={date}
  tasks={tasks}
  templates={templates}
  saveTask={saveTask}
  deleteTask={deleteTask}
  saveTemplate={saveTemplate}
  deleteTemplate={deleteTemplate}
/>
      </div>
    </div>
  );
}