import { useState } from 'react';
import {
  ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown,
  ChevronRight, CircleAlert, Clock3, ListTodo, Trash2, TrendingUp,
} from 'lucide-react';
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
    <li className="row event-row nopointer">
      <span className="row-date link-ish" onClick={() => onOpenDay(ev.date)}>{shortDate(ev.date)}</span>
      <span className="row-title link-ish" onClick={() => onOpenDay(ev.date)}>{ev.title}</span>
      <span className="tag">{ev.category}</span>
      <button
        className="icon row-action"
        aria-label="Delete event"
        onClick={() => window.confirm('Delete this event?') && onDelete(ev.id)}
      >
        <Trash2 size={16} />
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
        <span className="row-date task-time link-ish" onClick={() => onOpenDay(t.date)}>
          {showDate ? `${shortDate(t.date)} · ` : ''}{fmt12(t.start)} – {fmt12(t.end)}
        </span>
        <span className="row-title link-ish" onClick={() => onOpenDay(t.date)}>{t.title}</span>
        {subs.length > 0 && (
          <button className="subtask-count" title="Show or hide subtasks" onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {subs.filter((s) => s.done).length}/{subs.length}
          </button>
        )}
        <button
          className="icon row-action"
          aria-label="Delete task"
          onClick={() => window.confirm('Delete this task?') && deleteTask(t.id)}
        >
          <Trash2 size={16} />
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

function UpcomingTaskRow({ task, onOpenDay, saveTask }) {
  return (
    <li className="upcoming-task-row">
      <input
        type="checkbox"
        checked={task.done}
        aria-label={`Mark ${task.title} as complete`}
        onChange={() => saveTask({ ...task, done: !task.done })}
      />
      <button className="upcoming-task-detail" onClick={() => onOpenDay(task.date)}>
        <span className="upcoming-task-title">{task.title}</span>
        <span className="upcoming-task-meta">
          <span>{shortDate(task.date)}</span>
          <span>{fmt12(task.start)} – {fmt12(task.end)}</span>
        </span>
      </button>
      <span className="upcoming-task-state">UP NEXT</span>
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
  const allUpcomingTasks = tasks
    .filter((task) => task.date >= today && !task.done)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const upcomingTasks = allUpcomingTasks.slice(0, 4);

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
  const completedToday = todayTasks.filter((t) => t.done).length;
  const metrics = [
    { label: 'Total events', value: events.length, note: 'Saved in your daybook', icon: CalendarDays, tone: 'violet' },
    { label: 'Upcoming events', value: upcomingAll.length, note: 'Still ahead of you', icon: TrendingUp, tone: 'blue' },
    { label: 'Past events', value: recentAll.length, note: 'Captured along the way', icon: BriefcaseBusiness, tone: 'amber' },
    { label: "Today's tasks", value: `${completedToday}/${todayTasks.length}`, note: 'Marked complete today', icon: CheckCircle2, tone: 'green' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-intro">
        <div>
          <p className="dashboard-kicker">YOUR OVERVIEW</p>
          <h2 className="hello">{hello}{name ? `, ${name}` : ''}</h2>
          <p className="dashboard-subtitle">A clear view of what’s happening and what’s next.</p>
        </div>
        <div className="today-pill"><CalendarDays size={16} />{shortDate(today)}</div>
      </div>

      <section className="stats">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <div className="stat" key={label}>
            <div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={2} /></div>
            <div className="stat-copy">
              <span>{label}</span>
              <b>{value}</b>
              <small>{note}</small>
            </div>
          </div>
        ))}
      </section>

      <section className="card dashboard-card upcoming-tasks-card">
        <div className="dashboard-card-head">
          <div className="dashboard-section-icon blue"><ListTodo size={18} /></div>
          <div>
            <p className="dashboard-kicker">COMING UP</p>
            <h2>Next on your list</h2>
          </div>
          <button className="upcoming-calendar-link" onClick={() => onOpenDay(today)}>
            View calendar <ArrowUpRight size={15} />
          </button>
        </div>
        {upcomingTasks.length === 0 ? (
          <div className="upcoming-tasks-empty">
            <CheckCircle2 size={19} />
            <span>You're all caught up. Plan something for your day.</span>
          </div>
        ) : (
          <>
            <ul className="upcoming-task-list">
              {upcomingTasks.map((task) => (
                <UpcomingTaskRow key={task.id} task={task} onOpenDay={onOpenDay} saveTask={saveTask} />
              ))}
            </ul>
            {allUpcomingTasks.length > upcomingTasks.length && (
              <button
                className="upcoming-more"
                onClick={() => onOpenDay(allUpcomingTasks[upcomingTasks.length].date)}
              >
                View all {allUpcomingTasks.length} upcoming tasks
                <ArrowUpRight size={14} />
              </button>
            )}
          </>
        )}
      </section>

      <div className="grid-2">
        <section className="card dashboard-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon violet"><CalendarDays size={17} /></div>
            <div><h2>Upcoming events</h2><p>What’s next on your calendar</p></div>
            <span className="count-chip">{upcomingAll.length}</span>
          </div>
          {upcomingAll.length === 0 ? (
            <div className="dashboard-empty"><CalendarDays size={19} /><p>Nothing coming up. Add an event from your calendar.</p></div>
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

        <section className="card dashboard-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon amber"><BriefcaseBusiness size={17} /></div>
            <div><h2>Recent events</h2><p>Moments you’ve logged</p></div>
            <span className="count-chip">{recentAll.length}</span>
          </div>
          {recentAll.length === 0 ? (
            <div className="dashboard-empty"><BriefcaseBusiness size={19} /><p>No past events logged yet.</p></div>
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

      <section className="card dashboard-card schedule-card">
        <div className="section-head dashboard-card-head">
          <div className="dashboard-section-icon blue"><ListTodo size={18} /></div>
          <div className="dashboard-section-copy">
            <h2>Schedule</h2>
            <p>Your time blocks, all in one place</p>
          </div>
          <FilterBar
            range={range} setRange={setRange}
            status={status} setStatus={setStatus}
            order={order} setOrder={setOrder}
          />
        </div>

        {days.length === 0 ? (
          <div className="dashboard-empty"><Clock3 size={19} /><p>No time blocks match this filter.</p></div>
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
        <section className="card dashboard-card missed-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon red"><CircleAlert size={17} /></div>
            <div><h2>Missed tasks</h2><p>Past tasks not marked complete</p></div>
            <span className="count-chip">{missed.length}</span>
          </div>
          <p className="muted">Past tasks not ticked as done. Tick them if you finished them.</p>
          <ul className="list">
            {missed.map((t) => <TaskLine key={t.id} t={t} showDate {...lineProps} />)}
          </ul>
        </section>
      )}

      <Charts events={events} tasks={tasks} />
    </div>
  );
}