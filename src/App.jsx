import { useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { todayKey } from './utils/dates';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import DayPanel from './components/DayPanel';
import './App.css';

const upsert = (list, item) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

export default function App() {
  const [events, setEvents] = useLocalStorage('daybook.events', []);
  const [tasks, setTasks] = useLocalStorage('daybook.tasks', []);
  const [templates, setTemplates] = useLocalStorage('daybook.templates', []);
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(todayKey());

  const saveEvent = (ev) => setEvents((l) => upsert(l, ev));
  const deleteEvent = (id) => setEvents((l) => l.filter((e) => e.id !== id));
  const saveTask = (t) => setTasks((l) => upsert(l, t));
  const deleteTask = (id) => setTasks((l) => l.filter((t) => t.id !== id));

  const saveTemplate = (t) =>
    setTemplates((l) =>
      l.some((x) => x.title === t.title && x.start === t.start && x.end === t.end)
        ? l
        : [
            ...l,
            {
              id: crypto.randomUUID(),
              title: t.title,
              start: t.start,
              end: t.end,
              subtasks: (t.subtasks || []).map((s) => s.title),
            },
          ]
    );
  const deleteTemplate = (id) => setTemplates((l) => l.filter((x) => x.id !== id));

  const openDay = (key) => {
    setSelected(key);
    setView('calendar');
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Daybook</h1>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
            Dashboard
          </button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
            Calendar
          </button>
        </nav>
      </header>

      {view === 'dashboard' ? (
        <Dashboard events={events} tasks={tasks} onOpenDay={openDay} saveTask={saveTask} />
      ) : (
        <div className="split">
          <Calendar events={events} tasks={tasks} selected={selected} onSelect={setSelected} />
          <DayPanel
            date={selected}
            events={events.filter((e) => e.date === selected)}
            tasks={tasks.filter((t) => t.date === selected)}
            templates={templates}
            saveEvent={saveEvent}
            deleteEvent={deleteEvent}
            saveTask={saveTask}
            deleteTask={deleteTask}
            saveTemplate={saveTemplate}
            deleteTemplate={deleteTemplate}
          />
        </div>
      )}
    </div>
  );
}