import { useRef, useState } from 'react';
import { Check, Copy, Download, FileUp, X } from 'lucide-react';
import { EXAMPLE, FIELDS, parseImport } from '../utils/importData';
import { todayKey } from '../utils/dates';
import { notify } from '../lib/notify';

const exampleText = JSON.stringify(EXAMPLE, null, 2);
const withoutId = (item) =>
  Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id'));

export default function ImportExport({ events, tasks, templates, onImport, onClose }) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [okMsg, setOkMsg] = useState('');
  const fileRef = useRef(null);

  const loadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result));
    reader.readAsText(file);
    e.target.value = '';
  };

  const doImport = () => {
    setOkMsg('');
    const { data, errors: parseErrors } = parseImport(text);
    setErrors(parseErrors);
    if (parseErrors.length) {
      return notify.error(`Import failed: ${parseErrors.length} problem${parseErrors.length > 1 ? 's' : ''} found`);
    }
    if (!data.events.length && !data.tasks.length && !data.templates.length) {
      setErrors(['Nothing to import: add items to "events", "tasks" or "templates".']);
      return notify.warning('Nothing to import');
    }
    onImport(data);
    const message = `Imported ${data.events.length} events, ${data.tasks.length} tasks, ${data.templates.length} saved tasks.`;
    setOkMsg(message);
    notify.imported(message);
    setText('');
  };

  const exportAll = () => {
    const payload = {
      events: events.map(withoutId),
      tasks: tasks.map((task) => ({
        ...withoutId(task),
        subtasks: (task.subtasks || []).map(({ title, done }) => ({ title, done })),
      })),
      templates: templates.map(withoutId),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `daybook-backup-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify.exported('Backup downloaded');
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-export-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-title">
            <span className="modal-title-icon"><FileUp size={18} /></span>
            <div>
              <h2 id="import-export-title">Import / Export</h2>
              <p>Move your Daybook data safely</p>
            </div>
          </div>
          <button className="icon modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="modal-body">
          <h3>1. The format</h3>
          <p className="muted">
            All three lists are optional. Times are 24-hour <code>HH:MM</code> in the JSON; the app shows them as 12-hour.
            Importing adds items; it never replaces or merges existing ones.
          </p>
          <p className="muted">
            Task descriptions and saved-template descriptions are included in backups. Tasks added across a date range
            are stored as one task per date, so every day is included in the export and restored by import.
          </p>
          <div className="fields-wrap">
            <table className="fields">
              <thead><tr><th>List</th><th>Field</th><th></th><th>Format</th></tr></thead>
              <tbody>
                {FIELDS.map(([list, field, required, format]) => (
                  <tr key={list + field}>
                    <td>{list}</td><td><code>{field}</code></td><td>{required}</td><td>{format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Example</h3>
          <pre className="example">{exampleText}</pre>
          <div className="form-actions">
            <button className="action-button" onClick={() => setText(exampleText)}><Check size={15} /> Use this example</button>
            <button className="action-button" onClick={() => { navigator.clipboard?.writeText(exampleText); notify.copied('Example copied'); }}><Copy size={15} /> Copy example</button>
          </div>

          <h3>2. Paste your JSON</h3>
          <textarea
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder='{ "events": [], "tasks": [], "templates": [] }'
          />
          <div className="form-actions">
            <button className="primary action-button" onClick={doImport} disabled={!text.trim()}><Check size={15} /> Import</button>
            <button className="action-button" onClick={() => fileRef.current?.click()}><FileUp size={15} /> Upload .json file</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={loadFile} />
          </div>
          {errors.length > 0 && (
            <ul className="error-list">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>
          )}
          {okMsg && <p className="ok">{okMsg}</p>}

          <h3>Backup</h3>
          <button className="action-button" onClick={exportAll}><Download size={15} /> Download all my data (.json)</button>
        </div>
      </div>
    </div>
  );
}
