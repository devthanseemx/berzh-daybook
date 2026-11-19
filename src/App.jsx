import { useState } from 'react';
import useAuth from './hooks/useAuth';
import useCollection from './hooks/useCollection';
import { supabase, cloudEnabled } from './lib/supabase';
import { todayKey } from './utils/dates';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import DayPanel from './components/DayPanel';
import Login from './components/Login';
import ImportExport from './components/ImportExport';
import './App.css';

function Main({ userId, email }) {
  const [events, ev, evReady] = useCollection('events', userId);
  const [tasks, tk, tkReady] = useCollection('tasks', userId);
  const [templates, tp, tpReady] = useCollection('templates', userId);
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(todayKey());
  const [showIO, setShowIO] = useState(false);

  const saveTemplate = (t) => {
    if (templates.some((x) => x.title === t.title && x.start === t.start && x.end === t.end)) return;
    tp.save({
      id: crypto.randomUUID(),
      title: t.title,
      start: t.start,
      end: t.end,
      subtasks: (t.subtasks || []).map((s) => s.title),
    });
  };

  const importData = (d) => {
    ev.saveMany(d.events);
    tk.saveMany(d.tasks);
    tp.saveMany(d.templates);
  };

  const openDay = (key) => {
    setSelected(key);
    setView('calendar');
  };

  if (!(evReady && tkReady && tpReady)) {
    return <div className="app"><p className="muted">Loading your data…</p></div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Daybook</h1>
        <div className="top-actions">
          <nav>
            <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Calendar</button>
          </nav>
          <button onClick={() => setShowIO(true)}>Import / Export</button>
          {cloudEnabled && (
            <>
              <span className="muted">{email}</span>
              <button onClick={() => supabase.auth.signOut()}>Sign out</button>
            </>
          )}
        </div>
      </header>

      {view === 'dashboard' ? (
        <Dashboard
          events={events}
          tasks={tasks}
          onOpenDay={openDay}
          saveTask={tk.save}
          deleteTask={tk.remove}
          deleteEvent={ev.remove}
        />
      ) : (
        <div className="split">
          <Calendar events={events} tasks={tasks} selected={selected} onSelect={setSelected} />
          <DayPanel
            date={selected}
            events={events.filter((e) => e.date === selected)}
            tasks={tasks.filter((t) => t.date === selected)}
            templates={templates}
            saveEvent={ev.save}
            deleteEvent={ev.remove}
            saveTask={tk.save}
            deleteTask={tk.remove}
            saveTemplate={saveTemplate}
            deleteTemplate={tp.remove}
          />
        </div>
      )}

      {showIO && (
        <ImportExport
          events={events}
          tasks={tasks}
          templates={templates}
          onImport={importData}
          onClose={() => setShowIO(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="app"><p className="muted">Loading…</p></div>;
  if (cloudEnabled && !user) return <div className="app"><Login /></div>;
  return <Main key={user?.id ?? 'local'} userId={user?.id ?? null} email={user?.email} />;
}