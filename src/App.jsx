import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { BriefcaseBusiness, CalendarDays, LayoutDashboard, ListTodo, Upload } from 'lucide-react';
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
import AppLoader from './components/AppLoader';
import ConfirmDialog from './components/ConfirmDialog';
import DetailModal from './components/DetailModal';
import CollectionPage from './components/CollectionPage';
import './App.css';

function Main({ user }) {
  const userId = user?.id ?? null;
  const [events, ev, evReady] = useCollection('events', userId);
  const [tasks, tk, tkReady] = useCollection('tasks', userId);
  const [templates, tp, tpReady] = useCollection('templates', userId);
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(todayKey());
  const [showIO, setShowIO] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  useEffect(() => {
    const onConfirm = (event) => setConfirmState(event.detail);
    window.addEventListener('daybook-confirm', onConfirm);
    return () => window.removeEventListener('daybook-confirm', onConfirm);
  }, []);

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

  const deleteEvents = (ids) => {
    ev.removeMany(ids);
    notify.deleted(`${ids.length} event${ids.length === 1 ? '' : 's'} deleted`);
  };

  const saveTask = (t) => {
    const old = tasks.find((x) => x.id === t.id);
    const oldSubtasks = old?.subtasks || [];
    const nextSubtasks = t.subtasks || [];
    const subtasksChanged = old && (
      oldSubtasks.length !== nextSubtasks.length
      || nextSubtasks.some((subtask) => {
        const previous = oldSubtasks.find((item) => item.id === subtask.id);
        return !previous || previous.done !== subtask.done;
      })
    );
    const mainTaskChanged = old && old.done !== t.done;
    const savedTask = mainTaskChanged && nextSubtasks.length
      ? {
          ...t,
          done: t.done,
          subtasks: nextSubtasks.map((subtask) => ({ ...subtask, done: t.done })),
        }
      : subtasksChanged && nextSubtasks.length
        ? { ...t, done: nextSubtasks.every((subtask) => subtask.done) }
        : t;
    tk.save(savedTask);
    if (!old) return notify.success('Task added');
    if (old.done !== savedTask.done) {
      return savedTask.done ? notify.success('Task completed') : notify.reopened('Task marked as pending');
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

  const deleteTasks = (ids) => {
    tk.removeMany(ids);
    notify.deleted(`${ids.length} task${ids.length === 1 ? '' : 's'} deleted`);
  };

  const saveTasks = (items) => {
    if (!items.length) return;
    tk.saveMany(items);
    notify.success(items.length === 1 ? 'Saved task added' : `Saved task added to ${items.length} days`);
  };

  const saveTemplate = (t) => {
    if (templates.some((x) =>
      x.title === t.title
      && x.start === t.start
      && x.end === t.end
      && (x.description || '') === (t.description || '')
    )) {
      return notify.info('Already in your saved tasks');
    }
    tp.save({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description || '',
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

  const updateTemplate = (template) => {
    tp.save(template);
    notify.success('Saved task updated');
  };

  const deleteTemplates = (ids) => {
    tp.removeMany(ids);
    notify.deleted(`${ids.length} saved task${ids.length === 1 ? '' : 's'} deleted`);
  };

  const requestBulkDelete = (type, items) => {
    if (!items.length) return;
    const ids = items.map((item) => item.id);
    const label = type === 'template' ? 'saved task' : type;
    setConfirmState({
      title: `Delete ${items.length} ${label}${items.length === 1 ? '' : 's'}?`,
      message: `This will permanently delete the selected ${label}${items.length === 1 ? '' : 's'}. This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      resolve: (confirmed) => {
        if (confirmed) {
          if (type === 'event') deleteEvents(ids);
          if (type === 'task') deleteTasks(ids);
          if (type === 'template') deleteTemplates(ids);
        }
        setConfirmState(null);
      },
    });
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

  const openDay = (key, eventId = null) => {
    setSelected(key);
    setEditingEventId(eventId);
    setView('calendar');
  };

  if (!(evReady && tkReady && tpReady)) {
    return <AppLoader message="Loading your daybook" />;
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
            <button className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}>
              <ListTodo size={16} /> Tasks
            </button>
            <button className={view === 'events' ? 'active' : ''} onClick={() => setView('events')}>
              <BriefcaseBusiness size={16} /> Events
            </button>
          </nav>
          <button className="import-button" aria-label="Import / Export" onClick={() => setShowIO(true)}>
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
          onRequestBulkDelete={(type, items) => requestBulkDelete(type, items)}
          deleteEvent={deleteEvent}
          onViewTask={(task) => setDetail({ type: 'task', item: task })}
          onViewEvent={(event) => setDetail({ type: 'event', item: event })}
          onRequestDelete={(target) => setConfirmState({
            title: `Delete ${target.type}?`,
            message: `Delete "${target.item.title}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            tone: 'danger',
            resolve: (confirmed) => {
              if (confirmed) target.type === 'task' ? deleteTask(target.item.id) : deleteEvent(target.item.id);
              setConfirmState(null);
              setDetail(null);
            },
          })}
        />
      ) : view === 'calendar' ? (
        <div className="split">
          <Calendar key={selected.slice(0, 7)} events={events} tasks={tasks} selected={selected} onSelect={setSelected} />
          <DayPanel
            date={selected}
            initialEditId={editingEventId}
            events={events.filter((e) => e.date === selected)}
            onSelectDay={setSelected}
            tasks={tasks.filter((t) => t.date === selected)}
            templates={templates}
            saveEvent={saveEvent}
            deleteEvent={deleteEvent}
            saveTask={saveTask}
            saveTasks={saveTasks}
            deleteTask={deleteTask}
            onRequestBulkDelete={(type, items) => requestBulkDelete(type, items)}
            saveTemplate={saveTemplate}
            deleteTemplate={deleteTemplate}
            updateTemplate={updateTemplate}
            onEditingDone={() => setEditingEventId(null)}
          />
        </div>
      ) : (
        <CollectionPage
          type={view === 'tasks' ? 'task' : 'event'}
          items={view === 'tasks' ? tasks : events}
          saveTask={saveTask}
          onView={(item) => setDetail({ type: view === 'tasks' ? 'task' : 'event', item })}
          onRequestBulkDelete={(type, items) => requestBulkDelete(type, items)}
          onRequestDelete={(target) => setConfirmState({
            title: `Delete ${target.type}?`,
            message: `Delete "${target.item.title}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            tone: 'danger',
            resolve: (confirmed) => {
              if (confirmed) target.type === 'task' ? deleteTask(target.item.id) : deleteEvent(target.item.id);
              setConfirmState(null);
            },
          })}
        />
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
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        onCancel={() => {
          if (confirmState?.resolve) confirmState.resolve(false);
          setConfirmState(null);
        }}
        onConfirm={() => {
          if (confirmState?.resolve) confirmState.resolve(true);
          setConfirmState(null);
        }}
      />
      {detail && (
        <DetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onEdit={(entry) => {
            setDetail(null);
            openDay(entry.item.date, entry.type === 'event' ? entry.item.id : null);
          }}
          onOpenCalendar={(date) => {
            setDetail(null);
            openDay(date);
          }}
          onDelete={(item) => setConfirmState({
            title: `Delete ${detail.type}?`,
            message: `Delete "${item.title}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            tone: 'danger',
            resolve: (confirmed) => {
              if (confirmed) detail.type === 'task' ? deleteTask(item.id) : deleteEvent(item.id);
              setConfirmState(null);
              setDetail(null);
            },
          })}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();

  let body;
  if (!ready) body = <AppLoader message="Checking your session" />;
  else if (cloudEnabled && !user) body = <div className="auth-shell"><Login /></div>;
  else body = <Main key={user?.id ?? 'local'} user={user} />;

  return (
    <>
      {body}
      <Toaster
        position="bottom-right"
        closeButton
        theme="light"
        toastOptions={{
          className: 'daybook-toast',
          closeButton: true,
          closeButtonAriaLabel: 'Dismiss notification',
          duration: 3600,
        }}
      />
    </>
  );
}