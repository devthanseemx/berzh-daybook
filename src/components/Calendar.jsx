import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toKey, todayKey, fromKey, prettyDate, monthGrid } from '../utils/dates';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ events, tasks, selected, onSelect }) {
  const selectedMonth = selected.slice(0, 7);
  const [cursor, setCursor] = useState(`${selectedMonth}-01`);
  const today = todayKey();

  const shift = (amount) =>
    setCursor((current) => {
      const month = fromKey(current);
      return toKey(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    });

  const showToday = () => {
    const date = fromKey(today);
    setCursor(toKey(new Date(date.getFullYear(), date.getMonth(), 1)));
    onSelect(today);
  };
  const cursorDate = fromKey(cursor);
  const days = monthGrid(cursorDate.getFullYear(), cursorDate.getMonth());
  const label = cursorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
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
          <span className="calendar-eyebrow">MONTH VIEW</span>
          <h2>{label}</h2>
          <p>Events and tasks by day</p>
        </div>
        <div className="calendar-controls">
          <button className="calendar-nav" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={17} />
          </button>
          <button className="calendar-today" onClick={showToday}><CalendarDays size={14} /> Today</button>
          <button className="calendar-nav" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={17} />
          </button>
        </div>
      </header>

      <div className="cal-grid month-grid" role="grid" aria-label={label}>
        {WEEK.map((day) => (
          <div className="cal-weekday" role="columnheader" key={day}>{day}</div>
        ))}
        {days.map((date) => {
          const key = toKey(date);
          const eventCount = eventCounts.get(key) || 0;
          const taskCount = taskCounts.get(key) || 0;
          const isToday = key === today;
          const classes = [
            'cal-cell',
            date.getMonth() !== cursorDate.getMonth() ? 'other' : '',
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
