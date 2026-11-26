import { useState } from 'react';
import {
  ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown,
  ChevronRight, Circle, CircleAlert, Clock3, ListTodo, Trash2, TrendingUp,
} from 'lucide-react';
import { todayKey, shortDate, prettyDate, fmt12 } from '../utils/dates';
import { categoryTone } from '../utils/categoryTone';
import FilterBar from './FilterBar';
import { TaskStatusChart } from './Charts';

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

function EventRow({ ev, onView, onRequestDelete, selected, selectionMode, onToggleSelect }) {
  return (
    <li className={`row event-row nopointer ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="row-date link-ish row-detail-button" onClick={() => onView(ev)}>{shortDate(ev.date)}</button>
      <button
        type="button"
        className="row-title link-ish row-detail-button"
        aria-pressed={selectionMode ? selected : undefined}
        aria-label={selectionMode ? `${selected ? 'Deselect' : 'Select'} event ${ev.title}` : `Open event ${ev.title}`}
        onClick={() => selectionMode ? onToggleSelect(ev.id) : onView(ev)}
      >
        {ev.title}
      </button>
      <span className={`tag category-tag tone-${categoryTone(ev.category)}`}>{ev.category}</span>
      <button
        className="icon row-action"
        aria-label="Delete event"
        onClick={() => onRequestDelete(ev)}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

function TaskLine({ t, saveTask, onRequestDelete, onView, showDate, selected, selectionMode, onToggleSelect, startCollapsed = false }) {
  const [open, setOpen] = useState(!startCollapsed);
  const subs = t.subtasks || [];
  const toggleSub = (id) =>
    saveTask({ ...t, subtasks: subs.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });

  return (
    <li className={`task ${selected ? 'is-selected' : ''}`}>
      <div className={`row nopointer ${t.done ? 'done' : ''} ${showDate ? 'task-with-date' : ''}`}>
        <input type="checkbox" checked={t.done} aria-label={`Mark ${t.title} as complete`} onChange={() => saveTask({ ...t, done: !t.done })} />
        {showDate && (
          <button type="button" className="row-date link-ish row-detail-button" onClick={() => onView(t)}>
            {shortDate(t.date)}
          </button>
        )}
        <span className="row-time">{fmt12(t.start)} – {fmt12(t.end)}</span>
        {selectionMode ? (
          <button
            type="button"
            className="row-title link-ish row-detail-button task-selection-button"
            aria-pressed={selected}
            aria-label={`${selected ? 'Deselect' : 'Select'} task ${t.title}`}
            onClick={() => onToggleSelect(t.id)}
          >
            {selected ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            {t.title}
          </button>
        ) : (
          <button type="button" className="row-title link-ish row-detail-button" onClick={() => onView(t)}>{t.title}</button>
        )}
        {subs.length > 0 ? (
          <button
            className="subtask-count"
            title="Show or hide subtasks"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${subs.length} subtasks`}
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {subs.filter((s) => s.done).length}/{subs.length}
          </button>
        ) : <span className="subtask-count-placeholder" aria-hidden="true" />}
        <button
          className="icon row-action"
          aria-label="Delete task"
          onClick={() => onRequestDelete(t)}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {open && subs.length > 0 && (
        <ul className="subs">
          {subs.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <input type="checkbox" checked={s.done} aria-label={`Mark ${s.title} as complete`} onChange={() => toggleSub(s.id)} />
              <span className="grow">{s.title}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function UpcomingTaskRow({ task, onView, saveTask, selected, selectionMode, onToggleSelect }) {
  return (
    <li className={`upcoming-task-row ${selected ? 'is-selected' : ''}`}>
      <input
        type="checkbox"
        checked={task.done}
        aria-label={`Mark ${task.title} as complete`}
        onChange={() => saveTask({ ...task, done: !task.done })}
      />
      <button
        className="upcoming-task-detail"
        aria-pressed={selectionMode ? selected : undefined}
        aria-label={selectionMode ? `${selected ? 'Deselect' : 'Select'} task ${task.title}` : `Open task ${task.title}`}
        onClick={() => selectionMode ? onToggleSelect(task.id) : onView(task)}
      >
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

export default function Dashboard({
  name, events, tasks, onOpenDay, saveTask, deleteTask, onViewTask, onViewEvent,
  onRequestDelete, onRequestBulkDelete,
}) {
  const today = todayKey();
  const [upLimit, setUpLimit] = useState(STEP);
  const [recLimit, setRecLimit] = useState(STEP);
  const [dayLimit, setDayLimit] = useState(STEP);
  const [range, setRange] = useState('upcoming');
  const [status, setStatus] = useState('all');
  const [order, setOrder] = useState('asc');
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectedUpcomingTaskIds, setSelectedUpcomingTaskIds] = useState([]);
  const [selectedMissedTaskIds, setSelectedMissedTaskIds] = useState([]);
  const [upcomingTaskSelectionMode, setUpcomingTaskSelectionMode] = useState(false);
  const [upcomingEventSelectionMode, setUpcomingEventSelectionMode] = useState(false);
  const [missedTaskSelectionMode, setMissedTaskSelectionMode] = useState(false);
  const [recentEventSelectionMode, setRecentEventSelectionMode] = useState(false);
  const [scheduleSelectionMode, setScheduleSelectionMode] = useState(false);

  const toggleSelected = (setIds, id) => setIds((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  );
  const toggleAllSelected = (setIds, items, selectedIds) => {
    const ids = items.map((item) => item.id);
    setIds(ids.every((id) => selectedIds.includes(id))
      ? selectedIds.filter((id) => !ids.includes(id))
      : [...new Set([...selectedIds, ...ids])]);
  };

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingAll = sortedEvents.filter((e) => e.date >= today);
  const recentAll = sortedEvents.filter((e) => e.date < today).reverse();
  const allUpcomingTasks = tasks
    .filter((task) => task.date >= today && !task.done)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const upcomingTasks = allUpcomingTasks.slice(0, 4);
  const visibleUpcomingEvents = upcomingAll.slice(0, upLimit);

  const filtered = tasks
    .filter((task) => range === 'all' || (range === 'upcoming' ? task.date >= today : task.date < today))
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
  const visibleScheduleTasks = days.flatMap((day) => groups[day]);

  const missed = tasks
    .filter((t) => t.date < today && !t.done)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
    .slice(0, 6);
  const selectedUpcomingTasks = upcomingTasks.filter((task) => selectedUpcomingTaskIds.includes(task.id));
  const selectedMissedTasks = missed.filter((task) => selectedMissedTaskIds.includes(task.id));
  const selectedUpcomingEvents = visibleUpcomingEvents.filter((event) => selectedEventIds.includes(event.id));

  const todayTasks = tasks.filter((t) => t.date === today);
  const lineProps = {
    saveTask,
    deleteTask,
    onOpenDay,
    onView: (task) => onViewTask(task),
    onRequestDelete: (task) => onRequestDelete({ type: 'task', item: task }),
  };
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

      <div className="dashboard-section-divider">
        <span>PRIORITIES</span>
        <h2>Your priorities</h2>
      </div>
      <div className="dashboard-feature-grid">
        <section className="card dashboard-card upcoming-tasks-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon blue"><ListTodo size={18} /></div>
            <div>
              <h2>Upcoming tasks</h2>
              <p>Your next time blocks</p>
            </div>
            <div className="dashboard-header-actions">
              <button className="upcoming-calendar-link" onClick={() => onOpenDay(today)}>
                View calendar <ArrowUpRight size={15} />
              </button>
              <span className="count-chip">{allUpcomingTasks.length}</span>
              <button
                className="bulk-select-all"
                disabled={upcomingTasks.length === 0}
                aria-pressed={upcomingTaskSelectionMode}
                onClick={() => {
                  if (upcomingTaskSelectionMode) setSelectedUpcomingTaskIds([]);
                  setUpcomingTaskSelectionMode((active) => !active);
                }}
              >
                {upcomingTaskSelectionMode ? 'Done' : 'Select items'}
              </button>
              {upcomingTaskSelectionMode && (
                <button className="bulk-select-all" onClick={() => toggleAllSelected(setSelectedUpcomingTaskIds, upcomingTasks, selectedUpcomingTaskIds)}>
                  {upcomingTasks.length > 0 && upcomingTasks.every((task) => selectedUpcomingTaskIds.includes(task.id)) ? 'Clear selection' : 'Select visible'}
                </button>
              )}
              {upcomingTaskSelectionMode && selectedUpcomingTasks.length > 0 && (
                <button className="action-button danger-button" onClick={() => onRequestBulkDelete('task', selectedUpcomingTasks)}>
                  <Trash2 size={14} /> Delete ({selectedUpcomingTasks.length})
                </button>
              )}
            </div>
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
                  <UpcomingTaskRow
                    key={task.id}
                    task={task}
                    onView={(item) => onViewTask(item)}
                    saveTask={saveTask}
                    selected={selectedUpcomingTaskIds.includes(task.id)}
                    selectionMode={upcomingTaskSelectionMode}
                    onToggleSelect={(id) => toggleSelected(setSelectedUpcomingTaskIds, id)}
                  />
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
        <section className="card dashboard-card upcoming-events-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon violet"><CalendarDays size={17} /></div>
            <div><h2>Upcoming events</h2><p>Dates on your calendar</p></div>
            <div className="dashboard-header-actions">
              <span className="count-chip">{upcomingAll.length}</span>
              <button
                className="bulk-select-all"
                disabled={visibleUpcomingEvents.length === 0}
                aria-pressed={upcomingEventSelectionMode}
                onClick={() => {
                  if (upcomingEventSelectionMode) setSelectedEventIds([]);
                  setUpcomingEventSelectionMode((active) => !active);
                }}
              >
                {upcomingEventSelectionMode ? 'Done' : 'Select items'}
              </button>
              {upcomingEventSelectionMode && (
                <button className="bulk-select-all" onClick={() => toggleAllSelected(setSelectedEventIds, visibleUpcomingEvents, selectedEventIds)}>
                  {visibleUpcomingEvents.length > 0 && visibleUpcomingEvents.every((event) => selectedEventIds.includes(event.id)) ? 'Clear selection' : 'Select visible'}
                </button>
              )}
              {upcomingEventSelectionMode && selectedUpcomingEvents.length > 0 && (
                <button className="action-button danger-button" onClick={() => onRequestBulkDelete('event', selectedUpcomingEvents)}>
                  <Trash2 size={14} /> Delete ({selectedUpcomingEvents.length})
                </button>
              )}
            </div>
          </div>
          {upcomingAll.length === 0 ? (
            <div className="dashboard-empty"><CalendarDays size={19} /><p>Nothing coming up. Add an event from your calendar.</p></div>
          ) : (
            <>
              <ul className="list">
                {visibleUpcomingEvents.map((e) => (
                  <EventRow
                    key={e.id}
                    ev={e}
                    selected={selectedEventIds.includes(e.id)}
                    selectionMode={upcomingEventSelectionMode}
                    onToggleSelect={(id) => toggleSelected(setSelectedEventIds, id)}
                    onView={(item) => onViewEvent(item)}
                    onRequestDelete={(item) => onRequestDelete({ type: 'event', item })}
                  />
                ))}
              </ul>
              <MoreButtons limit={upLimit} total={upcomingAll.length} setLimit={setUpLimit} />
            </>
          )}
        </section>

        <section className="card dashboard-card missed-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon red"><CircleAlert size={17} /></div>
            <div><h2>Missed tasks</h2><p>Past tasks not marked complete</p></div>
            <div className="dashboard-header-actions">
              <span className="count-chip">{missed.length}</span>
              <button
                className="bulk-select-all"
                disabled={missed.length === 0}
                aria-pressed={missedTaskSelectionMode}
                onClick={() => {
                  if (missedTaskSelectionMode) setSelectedMissedTaskIds([]);
                  setMissedTaskSelectionMode((active) => !active);
                }}
              >
                {missedTaskSelectionMode ? 'Done' : 'Select items'}
              </button>
              {missedTaskSelectionMode && (
                <button className="bulk-select-all" onClick={() => toggleAllSelected(setSelectedMissedTaskIds, missed, selectedMissedTaskIds)}>
                  {missed.length > 0 && missed.every((task) => selectedMissedTaskIds.includes(task.id)) ? 'Clear selection' : 'Select visible'}
                </button>
              )}
              {missedTaskSelectionMode && selectedMissedTasks.length > 0 && (
                <button className="action-button danger-button" onClick={() => onRequestBulkDelete('task', selectedMissedTasks)}>
                  <Trash2 size={14} /> Delete ({selectedMissedTasks.length})
                </button>
              )}
            </div>
          </div>
          {missed.length === 0 ? (
            <div className="dashboard-empty"><CheckCircle2 size={19} /><p>No missed tasks. You’re all caught up.</p></div>
          ) : (
            <ul className="list">
              {missed.map((task) => (
                <TaskLine
                  key={task.id}
                  t={task}
                  showDate
                  startCollapsed
                  selected={selectedMissedTaskIds.includes(task.id)}
                  selectionMode={missedTaskSelectionMode}
                  onToggleSelect={(id) => toggleSelected(setSelectedMissedTaskIds, id)}
                  {...lineProps}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="dashboard-section-divider">
        <span>YOUR DAYBOOK</span>
        <h2>Recent events and schedule</h2>
      </div>
      <div className="dashboard-lower-grid">
        <section className="card dashboard-card recent-events-card">
          <div className="dashboard-card-head">
            <div className="dashboard-section-icon amber"><BriefcaseBusiness size={17} /></div>
            <div><h2>Recent events</h2><p>Moments you’ve logged</p></div>
            <span className="count-chip">{recentAll.length}</span>
          </div>
          {recentAll.length === 0 ? (
            <div className="dashboard-empty"><BriefcaseBusiness size={19} /><p>No past events logged yet.</p></div>
          ) : (
            <>
              <div className="bulk-actions">
                <button
                  className="bulk-select-all"
                  aria-pressed={recentEventSelectionMode}
                  onClick={() => {
                    if (recentEventSelectionMode) setSelectedEventIds([]);
                    setRecentEventSelectionMode((active) => !active);
                  }}
                >
                  {recentEventSelectionMode ? 'Done' : 'Select items'}
                </button>
                {recentEventSelectionMode && (
                  <button className="bulk-select-all" onClick={() => toggleAllSelected(setSelectedEventIds, recentAll.slice(0, recLimit), selectedEventIds)}>
                    {recentAll.slice(0, recLimit).every((item) => selectedEventIds.includes(item.id)) ? 'Clear selection' : 'Select visible'}
                  </button>
                )}
                {recentEventSelectionMode && recentAll.some((item) => selectedEventIds.includes(item.id)) && (
                  <button className="action-button danger-button" onClick={() => onRequestBulkDelete('event', recentAll.filter((item) => selectedEventIds.includes(item.id)))}>
                    <Trash2 size={14} /> Delete selected ({recentAll.filter((item) => selectedEventIds.includes(item.id)).length})
                  </button>
                )}
              </div>
              <ul className="list">
                {recentAll.slice(0, recLimit).map((event) => (
                  <EventRow
                    key={event.id}
                    ev={event}
                    selected={selectedEventIds.includes(event.id)}
                    selectionMode={recentEventSelectionMode}
                    onToggleSelect={(id) => toggleSelected(setSelectedEventIds, id)}
                    onView={(item) => onViewEvent(item)}
                    onRequestDelete={(item) => onRequestDelete({ type: 'event', item })}
                  />
                ))}
              </ul>
              <MoreButtons limit={recLimit} total={recentAll.length} setLimit={setRecLimit} />
            </>
          )}
        </section>

        <div className="schedule-overview">
          <TaskStatusChart tasks={tasks} />
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
              <>
                <div className="bulk-actions schedule-bulk-actions">
                  <button
                    className="bulk-select-all"
                    aria-pressed={scheduleSelectionMode}
                    onClick={() => {
                      if (scheduleSelectionMode) setSelectedTaskIds([]);
                      setScheduleSelectionMode((active) => !active);
                    }}
                  >
                    {scheduleSelectionMode ? 'Done' : 'Select items'}
                  </button>
                  {scheduleSelectionMode && (
                    <button className="bulk-select-all" onClick={() => toggleAllSelected(setSelectedTaskIds, visibleScheduleTasks, selectedTaskIds)}>
                      {visibleScheduleTasks.length > 0 && visibleScheduleTasks.every((item) => selectedTaskIds.includes(item.id)) ? 'Clear selection' : 'Select visible'}
                    </button>
                  )}
                  {scheduleSelectionMode && visibleScheduleTasks.some((item) => selectedTaskIds.includes(item.id)) && (
                    <button className="action-button danger-button" onClick={() => onRequestBulkDelete('task', visibleScheduleTasks.filter((item) => selectedTaskIds.includes(item.id)))}>
                      <Trash2 size={14} /> Delete selected ({visibleScheduleTasks.filter((item) => selectedTaskIds.includes(item.id)).length})
                    </button>
                  )}
                </div>
                {days.map((d) => (
                  <div key={d} className="day-group">
                    <h4 className="day-head">{d === today ? 'Today · ' : ''}{prettyDate(d)}</h4>
                    <ul className="list">
                      {groups[d].map((t) => (
                        <TaskLine
                          key={t.id}
                          t={t}
                          {...lineProps}
                          selected={selectedTaskIds.includes(t.id)}
                          selectionMode={scheduleSelectionMode}
                          onToggleSelect={(id) => toggleSelected(setSelectedTaskIds, id)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
            <MoreButtons limit={dayLimit} total={allDays.length} setLimit={setDayLimit} />
          </section>
        </div>
      </div>

    </div>
  );
}