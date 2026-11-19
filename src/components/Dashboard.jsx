import { useState } from 'react';
import { todayKey, shortDate, prettyDate, fmt12 } from '../utils/dates';
import FilterBar from './FilterBar';
import Charts from './Charts';

const STEP = 5;

function MoreButtons({ limit, total, setLimit }) {
  if (total <= STEP) return null;
  const shown = Math.min(limit, total);
  return (
    <div className="more">
      {shown < total && (
        <button onClick={() => setLimit(shown + STEP)}>Show more · {total - shown} left</button>
      )}
      {shown > STEP && <button className="link" onClick={() => setLimit(STEP)}>Show less</button>}
    </div>
  );
}

function EventRow({ ev, onOpenDay, onDelete }) {
  return (
    <li className="row nopointer">
      <span className="row-date link-ish" onClick={() => onOpenDay(ev.date)}>{shortDate(ev.date)}</span>
      <span className="row-title link-ish" onClick={() => onOpenDay(ev.date)}>{ev.title}</span>
      <span className="tag">{ev.category}</span>
      <button
        className="icon"
        aria-label="Delete event"
        onClick={() => window.confirm('Delete this event?') && onDelete(ev.id)}
      >
        🗑
      </button>
    </li>
  );
}

function TaskLine({ t, saveTask, deleteTask, onOpenDay, showDate }) {
  const [open, setOpen] = useState(true);
  const subs = t.subtasks || [];
  const toggleSub = (id) =>
    saveTask({ ...t, subtasks: subs.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });

  return (
    <li className="task">
      <div className={`row nopointer ${t.done ? 'done' : ''}`}>
        <input type="checkbox" checked={t.done} onChange={() => saveTask({ ...t, done: !t.done })} />
        <span className="row-date link-ish" onClick={() => onOpenDay(t.date)}>
          {showDate ? `${shortDate(t.date)} · ` : ''}{fmt12(t.start)} – {fmt12(t.end)}
        </span>
        <span className="row-title link-ish" onClick={() => onOpenDay(t.date)}>{t.title}</span>
        {subs.length > 0 && (
          <button className="icon" title="Show or hide subtasks" onClick={() => setOpen(!open)}>
            {open ? '▾' : '▸'} {subs.filter((s) => s.done).length}/{subs.length}
          </button>
        )}
        <button
          className="icon"
          aria-label="Delete task"
          onClick={() => window.confirm('Delete this task?') && deleteTask(t.id)}
        >
          🗑
        </button>
      </div>

      {open && subs.length > 0 && (
        <ul className="subs">
          {subs.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} />
              <span className="grow">{s.title}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Dashboard({ name, events, tasks, onOpenDay, saveTask, deleteTask, deleteEvent }) {
  const today = todayKey();
  const [upLimit, setUpLimit] = useState(STEP);
  const [recLimit, setRecLimit] = useState(STEP);
  const [dayLimit, setDayLimit] = useState(STEP);
  const [range, setRange] = useState('upcoming');
  const [status, setStatus] = useState('all');
  const [order, setOrder] = useState('asc');

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingAll = sortedEvents.filter((e) => e.date >= today);
  const recentAll = sortedEvents.filter((e) => e.date < today).reverse();

  const filtered = tasks
    .filter((t) => range === 'all' || (range === 'upcoming' ? t.date >= today : t.date < today))
    .filter((t) => status === 'all' || (status === 'done' ? t.done : !t.done))
    .sort((a, b) => {
      const c = (a.date + a.start).localeCompare(b.date + b.start);
      return order === 'asc' ? c : -c;
    });
  const groups = {};
  filtered.forEach((t) => {
    (groups[t.date] = groups[t.date] || []).push(t);
  });
  const allDays = Object.keys(groups); // already in sorted order
  const days = allDays.slice(0, dayLimit);

  const missed = tasks
    .filter((t) => t.date < today && !t.done)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
    .slice(0, 6);

  const todayTasks = tasks.filter((t) => t.date === today);
  const lineProps = { saveTask, deleteTask, onOpenDay };

  return (
    <div className="dashboard">
      <h2 className="hello">{hello}{name ? `, ${name}` : ''} 👋</h2>

      <section className="stats">
        <div className="stat"><b>{events.length}</b><span>Total events</span></div>
        <div className="stat"><b>{upcomingAll.length}</b><span>Upcoming events</span></div>
        <div className="stat"><b>{recentAll.length}</b><span>Happened</span></div>
        <div className="stat">
          <b>{todayTasks.filter((t) => t.done).length}/{todayTasks.length}</b>
          <span>Today's tasks done</span>
        </div>
      </section>

      <Charts events={events} tasks={tasks} />

      <div className="grid-2">
        <section className="card">
          <h2>Upcoming events</h2>
          {upcomingAll.length === 0 ? (
            <p className="muted">Nothing coming up. Add one from the Calendar.</p>
          ) : (
            <>
              <ul className="list">
                {upcomingAll.slice(0, upLimit).map((e) => (
                  <EventRow key={e.id} ev={e} onOpenDay={onOpenDay} onDelete={deleteEvent} />
                ))}
              </ul>
              <MoreButtons limit={upLimit} total={upcomingAll.length} setLimit={setUpLimit} />
            </>
          )}
        </section>

        <section className="card">
          <h2>Recent events</h2>
          {recentAll.length === 0 ? (
            <p className="muted">No past events logged yet.</p>
          ) : (
            <>
              <ul className="list">
                {recentAll.slice(0, recLimit).map((e) => (
                  <EventRow key={e.id} ev={e} onOpenDay={onOpenDay} onDelete={deleteEvent} />
                ))}
              </ul>
              <MoreButtons limit={recLimit} total={recentAll.length} setLimit={setRecLimit} />
            </>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-head">
          <h2>Schedule</h2>
          <FilterBar
            range={range} setRange={setRange}
            status={status} setStatus={setStatus}
            order={order} setOrder={setOrder}
          />
        </div>

        {days.length === 0 ? (
          <p className="muted">No time blocks match this filter.</p>
        ) : (
          days.map((d) => (
            <div key={d} className="day-group">
              <h4 className="day-head">{d === today ? 'Today · ' : ''}{prettyDate(d)}</h4>
              <ul className="list">
                {groups[d].map((t) => <TaskLine key={t.id} t={t} {...lineProps} />)}
              </ul>
            </div>
          ))
        )}
        <MoreButtons limit={dayLimit} total={allDays.length} setLimit={setDayLimit} />
      </section>

      {missed.length > 0 && (
        <section className="card">
          <h2>Missed tasks</h2>
          <p className="muted">Past tasks not ticked as done. Tick them if you finished them.</p>
          <ul className="list">
            {missed.map((t) => <TaskLine key={t.id} t={t} showDate {...lineProps} />)}
          </ul>
        </section>
      )}
    </div>
  );
}