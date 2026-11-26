import { useEffect, useRef } from 'react';
import { fmt12, pad } from '../utils/dates';

const ITEM = 40; // px, must match .wheel-item height in the CSS
const HOURS = Array.from({ length: 12 }, (_, i) => pad(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const AMPM = ['AM', 'PM'];

function Column({ items, value, onChange, label }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  }, [value, onChange]);
  const idx = Math.max(0, items.indexOf(value));

  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM) !== idx) el.scrollTop = idx * ITEM;
  }, [idx]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      el.scrollTo({ top: i * ITEM, behavior: 'smooth' });
      if (items[i] !== latest.current.value) latest.current.onChange(items[i]);
    }, 220);
  };

  const onWheel = (event) => {
    event.preventDefault();
    const el = ref.current;
    if (!el) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    el.scrollTo({ top: el.scrollTop + direction * ITEM, behavior: 'smooth' });
  };

  const onKeyDown = (event) => {
    let nextIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = Math.min(items.length - 1, idx + 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = Math.max(0, idx - 1);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    clearTimeout(timer.current);
    if (nextIndex !== idx) onChange(items[nextIndex]);
  };

  return (
    <div
      className="wheel-col"
      ref={ref}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-valuenow={idx}
      aria-valuetext={value}
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      onWheel={onWheel}
    >
      <div className="wheel-pad" />
      {items.map((it) => (
        <div key={it} className={`wheel-item ${it === value ? 'on' : ''}`} onClick={() => onChange(it)}>
          {it}
        </div>
      ))}
      <div className="wheel-pad" />
    </div>
  );
}

export default function TimeWheel({ value, onChange, label }) {
  const [h24, m] = value.split(':').map(Number);
  const hour = pad(h24 % 12 || 12);
  const min = pad(m);
  const ap = h24 >= 12 ? 'PM' : 'AM';

  const emit = (hh, mm, a) => {
    const h = (Number(hh) % 12) + (a === 'PM' ? 12 : 0);
    onChange(`${pad(h)}:${mm}`);
  };

  return (
    <div className="wheel">
      {label && (
        <div className="wheel-heading">
          <span className="wheel-label">{label}</span>
          <output className="wheel-selected-time">{fmt12(value)}</output>
        </div>
      )}
      <div className="wheel-box">
        <Column items={HOURS} value={hour} label={`${label} hour`} onChange={(v) => emit(v, min, ap)} />
        <span className="wheel-colon">:</span>
        <Column items={MINUTES} value={min} label={`${label} minutes`} onChange={(v) => emit(hour, v, ap)} />
        <Column items={AMPM} value={ap} label={`${label} AM/PM`} onChange={(v) => emit(hour, min, v)} />
        <div className="wheel-band" />
      </div>
    </div>
  );
}