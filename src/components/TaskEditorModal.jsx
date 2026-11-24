import { useState } from 'react';
import { CalendarDays, Check, Clock3, Pencil, X } from 'lucide-react';
import TimeWheel from './TimeWheel';
import DescriptionField from './DescriptionField';
import { notify } from '../lib/notify';

export default function TaskEditorModal({ task, onClose, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...task,
    description: task.description || '',
  }));
  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return notify.warning('Enter a task name first');
    if (!draft.date) return notify.warning('Choose a task date');
    if (draft.end <= draft.start) return notify.warning('End time must be after the start time');
    onSave({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
  };

  return (
    <div
      className="detail-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="detail-modal task-editor-modal" role="dialog" aria-modal="true" aria-labelledby="task-editor-title">
        <header className="detail-header">
          <div className="detail-icon task"><Pencil size={18} /></div>
          <div>
            <span>EDIT TASK</span>
            <h2 id="task-editor-title">{draft.title || 'Untitled task'}</h2>
          </div>
          <button type="button" className="detail-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="task-editor-form" onSubmit={submit}>
          <div className="detail-body">
            <label className="task-editor-field">
              <span>Task title</span>
              <input autoFocus value={draft.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <label className="task-editor-field">
              <span><CalendarDays size={14} /> Date</span>
              <input type="date" value={draft.date} onChange={(event) => setField('date', event.target.value)} required />
            </label>
            <div className="task-editor-time">
              <div className="task-editor-section-title"><Clock3 size={15} /> Time</div>
              <div className="time-pick task-edit-time-pick">
                <TimeWheel label="Start" value={draft.start} onChange={(value) => setField('start', value)} />
                <TimeWheel label="End" value={draft.end} onChange={(value) => setField('end', value)} />
              </div>
            </div>
            <DescriptionField
              value={draft.description}
              onChange={(description) => setField('description', description)}
              label="Description (optional)"
              placeholder="Add task details or a numbered list…"
              rows={4}
            />
          </div>
          <footer className="detail-actions">
            <button type="button" className="action-button" onClick={onClose}><X size={15} /> Cancel</button>
            <button type="submit" className="action-button primary"><Check size={15} /> Save changes</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
