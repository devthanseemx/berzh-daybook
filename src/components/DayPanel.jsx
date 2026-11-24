import { useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { prettyDate, todayKey } from '../utils/dates';
import { categoryTone } from '../utils/categoryTone';
import EventForm from './EventForm';
import TaskPlanner from './TaskPlanner';
import DetailModal from './DetailModal';
import { requestConfirmation } from '../lib/confirm';

export default function DayPanel({
  date, events, allEvents, tasks, templates, initialEditId, onSelectDay,
  saveEvent, deleteEvent, saveTask, saveTasks, deleteTask, saveTemplate, deleteTemplate,
  updateTemplate, onRequestBulkDelete, onEditingDone,
}) {
  const [editing, setEditing] = useState(null); // null | 'new' | event object
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [viewingEvent, setViewingEvent] = useState(null);
  const isPast = date < todayKey();

  const initialEditEvent = useMemo(
    () => initialEditId ? events.find((item) => item.id === initialEditId) : null,
    [initialEditId, events]
  );
  const activeEditing = editing ?? initialEditEvent;
  const calendarEvents = [...(allEvents || events)].sort((a, b) => a.date.localeCompare(b.date));

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
          <h3>All events <span className="count-chip">{calendarEvents.length}</span></h3>
          <div className="day-card-actions">
            {calendarEvents.length > 0 && (
              <>
                <button className="bulk-select-all" onClick={() => {
                  const allSelected = calendarEvents.every((event) => selectedEventIds.includes(event.id));
                  setSelectedEventIds(allSelected ? [] : calendarEvents.map((event) => event.id));
                }}>
                  {calendarEvents.every((event) => selectedEventIds.includes(event.id)) ? 'Clear selection' : 'Select all'}
                </button>
                {calendarEvents.some((event) => selectedEventIds.includes(event.id)) && (
                  <button
                    className="action-button danger-button"
                    onClick={() => onRequestBulkDelete('event', calendarEvents.filter((event) => selectedEventIds.includes(event.id)))}
                  >
                    <Trash2 size={14} /> Delete selected
                  </button>
                )}
              </>
            )}
            {!activeEditing && <button className="primary action-button" onClick={() => setEditing('new')}><Plus size={16} /> Add event</button>}
          </div>
        </div>

        {activeEditing && (
          <EventForm
            key={activeEditing === 'new' ? 'new' : activeEditing.id}
            date={activeEditing === 'new' ? date : activeEditing.date}
            initial={activeEditing === 'new' ? null : activeEditing}
            onSave={handleSave}
            onCancel={() => {
              setEditing(null);
              onEditingDone?.();
            }}
          />
        )}

        {calendarEvents.length === 0 && !activeEditing && <p className="muted">No events added yet. Add one for this day.</p>}

        {calendarEvents.length > 0 && (
          <div className="all-event-list">
            {calendarEvents.map((ev) => (
              <article key={ev.id} className="calendar-event-item">
                <input
                  className="bulk-select"
                  type="checkbox"
                  checked={selectedEventIds.includes(ev.id)}
                  aria-label={`Select event ${ev.title}`}
                  onChange={() => setSelectedEventIds((current) =>
                    current.includes(ev.id) ? current.filter((id) => id !== ev.id) : [...current, ev.id]
                  )}
                />
                <button type="button" className="calendar-event-title" onClick={() => setViewingEvent(ev)}>
                  {ev.title}
                </button>
                <span className={`tag category-tag tone-${categoryTone(ev.category)}`}>{ev.category}</span>
                <span className="calendar-event-date">{prettyDate(ev.date)}</span>
                <button type="button" className="action-button event-view-day" onClick={() => onSelectDay?.(ev.date)}>
                  <CalendarDays size={14} /> View day
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="card day-time-card">
        <h3 className="time-plan-title"><CalendarPlus size={18} /> Time plan</h3>
        <TaskPlanner
          key={date}
          date={date}
          tasks={tasks}
          templates={templates}
          saveTask={saveTask}
          saveTasks={saveTasks}
          deleteTask={deleteTask}
          onRequestBulkDelete={onRequestBulkDelete}
          saveTemplate={saveTemplate}
          deleteTemplate={deleteTemplate}
          updateTemplate={updateTemplate}
        />
      </div>
      <DetailModal
        detail={viewingEvent ? { type: 'event', item: viewingEvent } : null}
        onClose={() => setViewingEvent(null)}
        onEdit={(entry) => {
          setEditing(entry.item);
          setViewingEvent(null);
        }}
        onOpenCalendar={(eventDate) => {
          onSelectDay?.(eventDate);
          setViewingEvent(null);
        }}
        onDelete={async (event) => {
          const confirmed = await requestConfirmation({
            title: 'Delete event?',
            message: `Delete "${event.title}"? This cannot be undone.`,
          });
          if (confirmed) {
            deleteEvent(event.id);
            setViewingEvent(null);
          }
        }}
      />
    </div>
  );
}