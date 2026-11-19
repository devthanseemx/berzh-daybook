import { useState } from 'react';
import { monthGrid, toKey, todayKey, fromKey } from '../utils/dates';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ events, tasks, selected, onSelect }) {
  const sel = fromKey(selected);
  const [cursor, setCursor] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const today = todayKey();

  const shift = (n) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const label = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, {
    month: 'long', year: 'numeric',
  });
  const count = (list, key) => list.filter((i) => i.date === key).length;

  return (
    <div className="card calendar">
      <div className="cal-head">
        <button onClick={() => shift(-1)}>‹</button>
        <h2>{label}</h2>
        <button onClick={() => shift(1)}>›</button>
      </div>

      <div className="cal-grid">
        {WEEK.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
        {monthGrid(cursor.y, cursor.m).map((d) => {
          const key = toKey(d);
          const ev = count(events, key);
          const tk = count(tasks, key);
          const cls = [
            'cal-cell',
            d.getMonth() !== cursor.m ? 'other' : '',
            key === today ? 'today' : '',
            key === selected ? 'selected' : '',
          ].join(' ');
          return (
            <button key={key} className={cls} onClick={() => onSelect(key)}>
              <span>{d.getDate()}</span>
              <span className="dots">
                {ev > 0 && <i className="dot ev" title={`${ev} event(s)`} />}
                {tk > 0 && <i className="dot tk" title={`${tk} task(s)`} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="muted legend"><i className="dot ev" /> events &nbsp; <i className="dot tk" /> time blocks</p>
    </div>
  );
}