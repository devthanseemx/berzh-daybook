import { CalendarDays, Check, Clock3, Pencil, Trash2, X } from 'lucide-react';
import { fmt12, shortDate } from '../utils/dates';
import { categoryTone } from '../utils/categoryTone';

export default function DetailModal({ detail, onClose, onEdit, onOpenCalendar, onDelete }) {
  if (!detail) return null;
  const isTask = detail.type === 'task';
  const item = detail.item;

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="detail-header">
          <div className={`detail-icon ${isTask ? 'task' : 'event'}`}>{isTask ? <Check size={18} /> : <CalendarDays size={18} />}</div>
          <div>
            <span>{isTask ? 'TASK DETAILS' : 'EVENT DETAILS'}</span>
            <h2 id="detail-title">{item.title}</h2>
          </div>
          <button type="button" className="detail-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="detail-body">
          <div className="detail-meta">
            <div><CalendarDays size={16} /><span>{shortDate(item.date)}</span></div>
            {isTask ? (
              <div><Clock3 size={16} /><span>{fmt12(item.start)} – {fmt12(item.end)}</span></div>
            ) : (
              <span className={`tag category-tag tone-${categoryTone(item.category)}`}>{item.category}</span>
            )}
          </div>

          {isTask ? (
            <>
              <div className="detail-section">
                <h3>Subtasks</h3>
                {item.subtasks?.length ? (
                  <ul className="detail-subtasks">
                    {item.subtasks.map((subtask) => (
                      <li key={subtask.id} className={subtask.done ? 'done' : ''}>
                        <span className="detail-check">{subtask.done ? <Check size={13} /> : null}</span>
                        <span>{subtask.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="detail-empty">No subtasks for this task.</p>
                )}
              </div>
              <div className="detail-status">
                <span>Status</span>
                <strong className={item.done ? 'done' : ''}>{item.done ? 'Completed' : 'Pending'}</strong>
              </div>
            </>
          ) : (
            <div className="detail-fields">
              {[
                ['Company', item.company],
                ['Job title', item.jobTitle],
                ['Salary', item.salary],
                ['Description', item.description],
                ['Next steps', item.nextSteps],
                ['Notes', item.notes],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label}><span>{label}</span><p>{value}</p></div>
              ))}
              {!item.company && !item.jobTitle && !item.salary && !item.description && !item.nextSteps && !item.notes && (
                <p className="detail-empty">No extra information was added.</p>
              )}
            </div>
          )}
        </div>

        <footer className="detail-actions">
          {onDelete && (
            <button type="button" className="action-button danger-button" onClick={() => onDelete(item)}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <div>
            {onEdit && <button type="button" className="action-button" onClick={() => onEdit(detail)}><Pencil size={15} /> Edit</button>}
            <button type="button" className="action-button primary" onClick={() => onOpenCalendar(item.date)}>
              <CalendarDays size={15} /> View in calendar
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
