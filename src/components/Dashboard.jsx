import { todayKey, shortDate } from '../utils/dates';

function EventRow({ ev, onOpenDay }) {
  return (
    <li className="row" onClick={() => onOpenDay(ev.date)}>
      <span className="row-date">{shortDate(ev.date)}</span>
      <span className="row-title">{ev.title}</span>
      <span className="tag">{ev.category}</span>
    </li>
  );
}

export default function Dashboard({ events, tasks, onOpenDay }) {
  const today = todayKey();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => e.date >= today).slice(0, 6);
  const recent = sorted.filter((e) => e.date < today).reverse().slice(0, 6);
  const todayTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const doneCount = todayTasks.filter((t) => t.done).length;

  return (
    <div className="dashboard">
      <section className="stats">
        <div className="stat"><b>{events.length}</b><span>Total events</span></div>
        <div className="stat"><b>{sorted.filter((e) => e.date >= today).length}</b><span>Upcoming</span></div>
        <div className="stat"><b>{sorted.filter((e) => e.date < today).length}</b><span>Happened</span></div>
        <div className="stat"><b>{doneCount}/{todayTasks.length}</b><span>Today's tasks done</span></div>
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
        <h2>Today's schedule</h2>
        {todayTasks.length === 0 ? (
          <p className="muted">No time blocks for today.</p>
        ) : (
          <ul className="list">
            {todayTasks.map((t) => (
              <li key={t.id} className={`row ${t.done ? 'done' : ''}`} onClick={() => onOpenDay(today)}>
                <span className="row-date">{t.start} – {t.end}</span>
                <span className="row-title">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}