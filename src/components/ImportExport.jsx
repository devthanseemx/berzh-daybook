import { useRef, useState } from 'react';
import { EXAMPLE, FIELDS, parseImport } from '../utils/importData';
import { todayKey } from '../utils/dates';

const exampleText = JSON.stringify(EXAMPLE, null, 2);

export default function ImportExport({ events, tasks, templates, onImport, onClose }) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [okMsg, setOkMsg] = useState('');
  const fileRef = useRef(null);

  const loadFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result));
    reader.readAsText(f);
    e.target.value = '';
  };

  const doImport = () => {
    setOkMsg('');
    const { data, errors: errs } = parseImport(text);
    setErrors(errs);
    if (errs.length) return;
    if (!data.events.length && !data.tasks.length && !data.templates.length) {
      return setErrors(['Nothing to import: add items to "events", "tasks" or "templates".']);
    }
    onImport(data);
    setOkMsg(`Imported ${data.events.length} events, ${data.tasks.length} tasks, ${data.templates.length} saved tasks.`);
    setText('');
  };

  const exportAll = () => {
    const payload = {
      events: events.map(({ id, ...e }) => e),
      tasks: tasks.map(({ id, subtasks = [], ...t }) => ({
        ...t,
        subtasks: subtasks.map(({ title, done }) => ({ title, done })),
      })),
      templates: templates.map(({ id, ...t }) => t),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daybook-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>Import / Export</h2>
          <button className="icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <h3>1. The format</h3>
        <p className="muted">
          All three lists are optional. Times are 24-hour <code>HH:MM</code> in the JSON; the app shows them as 12-hour.
          Importing adds items; it never replaces or merges existing ones.
        </p>
        <table className="fields">
          <thead><tr><th>List</th><th>Field</th><th></th><th>Format</th></tr></thead>
          <tbody>
            {FIELDS.map(([list, field, req, fmt]) => (
              <tr key={list + field}>
                <td>{list}</td><td><code>{field}</code></td><td>{req}</td><td>{fmt}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Example</h3>
        <pre className="example">{exampleText}</pre>
        <div className="form-actions">
          <button onClick={() => setText(exampleText)}>Use this example</button>
          <button onClick={() => navigator.clipboard?.writeText(exampleText)}>Copy example</button>
        </div>

        <h3>2. Paste your JSON</h3>
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "events": [], "tasks": [], "templates": [] }'
        />
        <div className="form-actions">
          <button className="primary" onClick={doImport} disabled={!text.trim()}>Import</button>
          <button onClick={() => fileRef.current?.click()}>Upload .json file</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={loadFile} />
        </div>
        {errors.length > 0 && (
          <ul className="error-list">{errors.map((er, i) => <li key={i}>{er}</li>)}</ul>
        )}
        {okMsg && <p className="ok">{okMsg}</p>}

        <h3>Backup</h3>
        <button onClick={exportAll}>Download all my data (.json)</button>
      </div>
    </div>
  );
}