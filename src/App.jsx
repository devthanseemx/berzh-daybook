import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { CalendarDays, LayoutDashboard, Upload } from 'lucide-react';
import useAuth from './hooks/useAuth';
import useCollection from './hooks/useCollection';
import { supabase, cloudEnabled } from './lib/supabase';
import { notify } from './lib/notify';
import { todayKey } from './utils/dates';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import DayPanel from './components/DayPanel';
import Login from './components/Login';
import ImportExport from './components/ImportExport';
import ProfileMenu from './components/ProfileMenu';
import './App.css';

function Main({ user }) {
  const userId = user?.id ?? null;
  const [events, ev, evReady] = useCollection('events', userId);
  const [tasks, tk, tkReady] = useCollection('tasks', userId);
  const [templates, tp, tpReady] = useCollection('templates', userId);
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(todayKey());
  const [showIO, setShowIO] = useState(false);

  const meta = user?.user_metadata || {};
  const firstName = (meta.full_name || meta.name || '').split(' ')[0];

  // welcome toast once per browser session
  useEffect(() => {
    if (!user || sessionStorage.getItem('daybook.welcomed')) return;
    sessionStorage.setItem('daybook.welcomed', '1');
    notify.signedIn(`Welcome${firstName ? `, ${firstName}` : ''}`);
  }, [user, firstName]);

  const saveEvent = (e) => {
    const exists = events.some((x) => x.id === e.id);
    ev.save(e);
    notify.success(exists ? 'Event updated' : 'Event added');
  };

  const deleteEvent = (id) => {
    ev.remove(id);
    notify.deleted('Event deleted');
  };

  const saveTask = (t) => {
    const old = tasks.find((x) => x.id === t.id);
    tk.save(t);
    if (!old) return notify.success('Task added');
    if (old.done !== t.done) {
      return t.done ? notify.success('Task completed') : notify.reopened('Task marked as pending');
    }
    const a = old.subtasks || [];
    const b = t.subtasks || [];
    if (b.length > a.length) return notify.success('Subtask added');
    if (b.length < a.length) return notify.deleted('Subtask removed');
    const changed = b.find((s) => a.find((x) => x.id === s.id)?.done !== s.done);
    if (changed) {
      return changed.done ? notify.success('Subtask completed') : notify.reopened('Subtask marked as pending');
    }
  };

  const deleteTask = (id) => {
    tk.remove(id);
    notify.deleted('Task deleted');
  };

  const saveTemplate = (t) => {
    if (templates.some((x) => x.title === t.title && x.start === t.start && x.end === t.end)) {
      return notify.info('Already in your saved tasks');
    }
    tp.save({
      id: crypto.randomUUID(),
      title: t.title,
      start: t.start,
      end: t.end,
      subtasks: (t.subtasks || []).map((s) => s.title),
    });
    notify.saved('Saved for reuse');
  };

  const deleteTemplate = (id) => {
    tp.remove(id);
    notify.deleted('Removed from saved tasks');
  };

  const importData = (d) => {
    ev.saveMany(d.events);
    tk.saveMany(d.tasks);
    tp.saveMany(d.templates);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return notify.error(error.message);
    sessionStorage.removeItem('daybook.welcomed');
    notify.signedOut('You have been signed out');
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
        <div className="brand-lockup">
          <img src="/daybook-mark.svg" alt="" />
          <div>
            <strong>Daybook</strong>
            <span>PLAN YOUR DAYS WITH INTENTION</span>
          </div>
        </div>
        <div className="top-actions">
          <nav>
            <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              <CalendarDays size={16} /> Calendar
            </button>
          </nav>
          <button className="import-button" onClick={() => setShowIO(true)}>
            <Upload size={16} /> <span>Import / Export</span>
          </button>
          {user && <ProfileMenu user={user} onSignOut={signOut} />}
        </div>
      </header>

      {view === 'dashboard' ? (
        <Dashboard
          name={firstName}
          events={events}
          tasks={tasks}
          onOpenDay={openDay}
          saveTask={saveTask}
          deleteTask={deleteTask}
          deleteEvent={deleteEvent}
        />
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

  let body;
  if (!ready) body = <div className="app"><p className="muted">Loading…</p></div>;
  else if (cloudEnabled && !user) body = <div className="auth-shell"><Login /></div>;
  else body = <Main key={user?.id ?? 'local'} user={user} />;

  return (
    <>
      {body}
      <Toaster position="top-right" richColors closeButton theme="system" />
    </>
  );
}