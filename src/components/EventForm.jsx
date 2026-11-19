import { useState } from 'react';
import Dropdown from './Dropdown';

export const CATEGORIES = ['Job application', 'Interview', 'Meeting', 'Personal', 'Other'];

export default function EventForm({ date, initial, onSave, onCancel }) {
  const [f, setF] = useState(
    initial || {
      title: '', category: 'Job application', company: '', jobTitle: '',
      salary: '', description: '', nextSteps: '', notes: '',
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setCategory = (category) => setF((current) => ({ ...current, category }));
  const isJob = f.category === 'Job application';

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    onSave({ ...f, id: initial?.id || crypto.randomUUID(), date });
  };

  return (
    <form className="form" onSubmit={submit}>
      <input placeholder="Event title (e.g. Applied to Acme Corp)" value={f.title} onChange={set('title')} required />
      <Dropdown
        ariaLabel="Event category"
        className="event-category-dropdown"
        value={f.category}
        onChange={setCategory}
        options={CATEGORIES.map((category) => ({ value: category, label: category }))}
      />

      {isJob && (
        <>
          <input placeholder="Company" value={f.company} onChange={set('company')} />
          <input placeholder="Job title" value={f.jobTitle} onChange={set('jobTitle')} />
          <input placeholder="Salary information" value={f.salary} onChange={set('salary')} />
          <textarea rows={3} placeholder="Job description" value={f.description} onChange={set('description')} />
          <textarea rows={2} placeholder="Things to do from this job (follow-up, assignment, interview prep...)" value={f.nextSteps} onChange={set('nextSteps')} />
        </>
      )}

      <textarea rows={2} placeholder="Notes / what happened" value={f.notes} onChange={set('notes')} />

      <div className="form-actions">
        <button type="submit" className="primary">{initial ? 'Update event' : 'Save event'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}