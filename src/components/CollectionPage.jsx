import { useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, CheckCircle2, ListTodo, Trash2 } from 'lucide-react';
import { categoryTone } from '../utils/categoryTone';
import { fmt12, prettyDate } from '../utils/dates';

export default function CollectionPage({
  type, items, onView, saveTask, onRequestDelete, onRequestBulkDelete,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const isTask = type === 'task';
  const sortedItems = useMemo(() => [...items].sort((a, b) => {
    const first = isTask ? `${a.date}${a.start}` : a.date;
    const second = isTask ? `${b.date}${b.start}` : b.date;
    return first.localeCompare(second);
  }), [isTask, items]);
  const allSelected = sortedItems.length > 0 && sortedItems.every((item) => selectedIds.includes(item.id));
  const selectedItems = sortedItems.filter((item) => selectedIds.includes(item.id));
  const Icon = isTask ? ListTodo : BriefcaseBusiness;

  const toggleSelected = (id) => setSelectedIds((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  );

  return (
    <main className="collection-page">
      <header className="collection-page-heading">
        <div>
          <p className="dashboard-kicker">YOUR DAYBOOK</p>
          <h1>{isTask ? 'All tasks' : 'All events'}</h1>
          <p>{isTask ? 'Review and manage every task across your schedule.' : 'Browse every event you have saved.'}</p>
        </div>
        <span className="collection-total">{sortedItems.length} {isTask ? 'tasks' : 'events'}</span>
      </header>

      <section className="card collection-card">
        <div className="collection-toolbar">
          <div className="collection-toolbar-title">
            <span className={`dashboard-section-icon ${isTask ? 'blue' : 'violet'}`}>
              {isTask ? <CheckCircle2 size={17} /> : <CalendarDays size={17} />}
            </span>
            <div>
              <h2>{isTask ? 'Task list' : 'Event history'}</h2>
              <p>{isTask ? 'Sorted by date and start time' : 'Sorted by event date'}</p>
            </div>
          </div>
          <div className="collection-toolbar-actions">
            {sortedItems.length > 0 && (
              <button
                type="button"
                className="bulk-select-all"
                onClick={() => setSelectedIds(allSelected ? [] : sortedItems.map((item) => item.id))}
              >
                {allSelected ? 'Clear selection' : 'Select all'}
              </button>
            )}
            {selectedItems.length > 0 && (
              <button
                type="button"
                className="action-button danger-button"
                onClick={() => onRequestBulkDelete(type, selectedItems)}
              >
                <Trash2 size={14} /> Delete selected ({selectedItems.length})
              </button>
            )}
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="dashboard-empty collection-empty">
            <Icon size={20} />
            <p>No {isTask ? 'tasks' : 'events'} yet. Add them from the calendar view.</p>
          </div>
        ) : (
          <ul className={`collection-list ${isTask ? 'task-collection-list' : 'event-collection-list'}`}>
            {sortedItems.map((item) => (
              <li className="collection-row" key={item.id}>
                <input
                  type="checkbox"
                  className="bulk-select"
                  checked={selectedIds.includes(item.id)}
                  aria-label={`Select ${isTask ? 'task' : 'event'} ${item.title}`}
                  onChange={() => toggleSelected(item.id)}
                />
                {isTask && (
                  <input
                    type="checkbox"
                    checked={item.done}
                    aria-label={`Mark ${item.title} as complete`}
                    onChange={() => saveTask({ ...item, done: !item.done })}
                  />
                )}
                <span className="collection-date">{prettyDate(item.date)}</span>
                <button type="button" className="collection-item-title" onClick={() => onView(item)}>
                  {item.title}
                  {isTask && item.description && <small>{item.description}</small>}
                </button>
                {isTask ? (
                  <span className="collection-meta">{fmt12(item.start)} – {fmt12(item.end)}</span>
                ) : (
                  <span className={`tag category-tag tone-${categoryTone(item.category)}`}>{item.category}</span>
                )}
                <button
                  type="button"
                  className="icon row-action"
                  aria-label={`Delete ${isTask ? 'task' : 'event'} ${item.title}`}
                  onClick={() => onRequestDelete({ type, item })}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
