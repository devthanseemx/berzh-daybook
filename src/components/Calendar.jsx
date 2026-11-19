import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toKey, todayKey, fromKey, prettyDate } from '../utils/dates';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfWeek = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
};

export default function Calendar({ events, tasks, selected, onSelect }) {
  const selectedDate = fromKey(selected);
  const [cursor, setCursor] = useState(toKey(startOfWeek(selectedDate)));
  const today = todayKey();
  const todayDate = fromKey(today);

  const shift = (amount) =>
    setCursor((current) => {
      const date = fromKey(current);
      date.setDate(date.getDate() + amount);
      return toKey(date);
    });

  const showToday = () => {
    setCursor(toKey(startOfWeek(todayDate)));
    onSelect(today);
  };
  const start = fromKey(cursor);
  const days = Array.from({ length: 7 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  );
  const end = days[6];
  const label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const rangeLabel = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const countByDate = (list) => list.reduce((counts, item) => {
    counts.set(item.date, (counts.get(item.date) || 0) + 1);
    return counts;
  }, new Map());
  const eventCounts = countByDate(events);
  const taskCounts = countByDate(tasks);

  return (
    <section className="card calendar" aria-label="Calendar">
      <header className="calendar-toolbar">
        <div className="calendar-month">
          <span className="calendar-eyebrow">AGENDA WEEK</span>
          <h2>{label}</h2>
          <p>{rangeLabel}</p>
        </div>
        <div className="calendar-controls">
          <button className="calendar-nav" onClick={() => shift(-7)} aria-label="Previous week">
            <ChevronLeft size={17} />
          </button>
          <button className="calendar-today" onClick={showToday}><CalendarDays size={14} /> Today</button>
          <button className="calendar-nav" onClick={() => shift(7)} aria-label="Next week">
            <ChevronRight size={17} />
          </button>
        </div>
      </header>

      <div className="cal-grid agenda-grid" role="grid" aria-label={rangeLabel}>
        {days.map((date, index) => {
          const key = toKey(date);
          const eventCount = eventCounts.get(key) || 0;
          const taskCount = taskCounts.get(key) || 0;
          const isToday = key === today;
          const classes = [
            'cal-cell',
            isToday ? 'today' : '',
            key === selected ? 'selected' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={key}
              className={classes}
              role="gridcell"
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={key === selected}
              aria-label={`${prettyDate(key)}${eventCount ? `, ${eventCount} event${eventCount === 1 ? '' : 's'}` : ''}${taskCount ? `, ${taskCount} task${taskCount === 1 ? '' : 's'}` : ''}`}
              onClick={() => onSelect(key)}
            >
              <span className="agenda-day-name">{WEEK[index]}</span>
              <span className="cal-day-number">{date.getDate()}</span>
              <span className="cal-day-dots" aria-hidden="true">
                {eventCount > 0 && <i className="dot ev" />}
                {taskCount > 0 && <i className="dot tk" />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="calendar-legend">
        <span><i className="dot ev" /> Events</span>
        <span><i className="dot tk" /> Time blocks</span>
      </p>
    </section>
  );
}
