import { Plus, Star, Trash2, X } from 'lucide-react';
import { notify } from '../lib/notify';
import DescriptionField from './DescriptionField';

export default function SavedTaskEditorModal({ template, onChange, onClose, onSave }) {
  if (!template) return null;

  const setField = (field, value) => onChange({ ...template, [field]: value });
  const setSubtask = (index, value) => setField(
    'subtasks',
    template.subtasks.map((subtask, itemIndex) => itemIndex === index ? { ...subtask, title: value } : subtask)
  );
  const removeSubtask = (index) => setField(
    'subtasks',
    template.subtasks.filter((_, itemIndex) => itemIndex !== index)
  );

  const submit = (event) => {
    event.preventDefault();
    const title = template.title.trim();
    if (!title) return notify.warning('Enter a saved task name first');
    onSave({
      ...template,
      title,
      description: template.description.trim(),
      subtasks: template.subtasks.map((subtask) => subtask.title.trim()).filter(Boolean),
    });
  };

  return (
    <div
      className="detail-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="detail-modal saved-task-edit-modal" role="dialog" aria-modal="true" aria-labelledby="saved-task-edit-title">
        <header className="detail-header">
          <div className="detail-icon task"><Star size={18} /></div>
          <div>
            <span>EDIT SAVED TASK</span>
            <h2 id="saved-task-edit-title">{template.title || 'Untitled saved task'}</h2>
          </div>
          <button type="button" className="detail-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="saved-task-edit-form" onSubmit={submit}>
          <div className="detail-body">
            <label>
              <span>Task title</span>
              <input autoFocus value={template.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <DescriptionField
              value={template.description}
              onChange={(description) => setField('description', description)}
              label="Description (optional)"
              placeholder="Add reusable task details or a numbered list…"
            />
            <div className="saved-task-edit-subtasks">
              <div className="saved-task-edit-subtasks-heading">
                <span>Subtasks</span>
                <button
                  type="button"
                  className="bulk-select-all"
                  onClick={() => setField('subtasks', [...template.subtasks, { title: '' }])}
                >
                  <Plus size={14} /> Add subtask
                </button>
              </div>
              {template.subtasks.length === 0 && <p className="detail-empty">No subtasks added.</p>}
              {template.subtasks.map((subtask, index) => (
                <div className="saved-template-subtask" key={`${template.id}-sub-${index}`}>
                  <input
                    aria-label={`Subtask ${index + 1}`}
                    value={subtask.title}
                    onChange={(event) => setSubtask(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className="icon task-icon-button danger-button"
                    aria-label={`Delete subtask ${subtask.title || index + 1}`}
                    onClick={() => removeSubtask(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <footer className="detail-actions">
            <button type="button" className="action-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-button primary">Save changes</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
