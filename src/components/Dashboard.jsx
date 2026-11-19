import { todayKey, shortDate, prettyDate } from '../utils/dates';

function EventRow({ ev, onOpenDay }) {
  return (
    <li className="row" onClick={() => onOpenDay(ev.date)}>
      <span className="row-date">{shortDate(ev.date)}</span>
      <span className="row-title">{ev.title}</span>
      <span className="tag">{ev.category}</span>
    </li>
  );
}

function TaskLine({ t, onToggle, onOpenDay, showDate }) {
  const subs = t.subtasks || [];
  return (
    <li className={`row nopointer ${t.done ? 'done' : ''}`}>
      <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} />
      <span className="row-date link-ish" onClick={() => onOpenDay(t.date)}>
        {showDate ? `${shortDate(t.date)} · ` : ''}{t.start} – {t.end}
      </span>
      <span className="row-title link-ish" onClick={() => onOpenDay(t.date)}>{t.title}</span>
      {subs.length > 0 && <span className="tag">{subs.filter((s) => s.done).length}/{subs.length}</span>}
    </li>
  );
}

export default function Dashboard({ events, tasks, onOpenDay, saveTask }) {
  const today = todayKey();
  const toggle = (t) => saveTask({ ...t, done: !t.done });

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sortedEvents.filter((e) => e.date >= today).slice(0, 6);
  const recent = sortedEvents.filter((e) => e.date < today).reverse().slice(0, 6);

  const upcomingTasks = tasks
    .filter((t) => t.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const groups = {};
  upcomingTasks.forEach((t) => {
    (groups[t.date] = groups[t.date] || []).push(t);
  });
  const days = Object.keys(groups).sort().slice(0, 7);

  const missed = tasks
    .filter((t) => t.date < today && !t.done)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
    .slice(0, 6);

  const todayTasks = tasks.filter((t) => t.date === today);

  return (
    <div className="dashboard">
      <section className="stats">
        <div className="stat"><b>{events.length}</b><span>Total events</span></div>
        <div className="stat"><b>{sortedEvents.filter((e) => e.date >= today).length}</b><span>Upcoming events</span></div>
        <div className="stat"><b>{sortedEvents.filter((e) => e.date < today).length}</b><span>Happened</span></div>
        <div className="stat">
          <b>{todayTasks.filter((t) => t.done).length}/{todayTasks.length}</b>
          <span>Today's tasks done</span>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Upcoming events</h2>
          {upcoming.length === 0 ? (
            <p className="muted">Nothing coming up. Add one from the Calendar.</p>
          ) : (
            <ul className="list">
              {upcoming.map((e) => <EventRow key={e.id} ev={e} onOpenDay={onOpenDay} />)}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Recent events</h2>
          {recent.length === 0 ? (
            <p className="muted">No past events logged yet.</p>
          ) : (
            <ul className="list">
              {recent.map((e) => <EventRow key={e.id} ev={e} onOpenDay={onOpenDay} />)}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Upcoming schedule</h2>
        {days.length === 0 ? (
          <p className="muted">No time blocks planned from today onward.</p>
        ) : (
          days.map((d) => (
            <div key={d} className="day-group">
              <h4 className="day-head">
                {d === today ? 'Today · ' : ''}{prettyDate(d)}
              </h4>
              <ul className="list">
                {groups[d].map((t) => (
                  <TaskLine key={t.id} t={t} onToggle={toggle} onOpenDay={onOpenDay} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {missed.length > 0 && (
        <section className="card">
          <h2>Missed tasks</h2>
          <p className="muted">Past tasks not ticked as done. Tick them if you finished them.</p>
          <ul className="list">
            {missed.map((t) => (
              <TaskLine key={t.id} t={t} onToggle={toggle} onOpenDay={onOpenDay} showDate />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}