import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({ open, title = 'Confirm action', message, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <button className="confirm-close" type="button" aria-label="Close" onClick={onCancel}><X size={17} /></button>
        <div className={`confirm-icon ${tone}`}><AlertTriangle size={21} /></div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="action-button" onClick={onCancel}>Cancel</button>
          <button type="button" className={`action-button ${tone === 'danger' ? 'confirm-danger' : 'confirm-primary'}`} onClick={onConfirm}>
            {tone === 'danger' ? <Trash2 size={15} /> : <AlertTriangle size={15} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
