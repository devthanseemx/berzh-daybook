export default function FilterBar({ status, setStatus, order, setOrder, range, setRange }) {
  return (
    <div className="filters">
      {setRange && (
        <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
      )}
      <div className="seg" role="group" aria-label="Status filter">
        {[['all', 'All'], ['pending', 'Pending'], ['done', 'Completed']].map(([v, label]) => (
          <button key={v} className={status === v ? 'active' : ''} onClick={() => setStatus(v)}>
            {label}
          </button>
        ))}
      </div>
      <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order">
        <option value="asc">Earliest first</option>
        <option value="desc">Latest first</option>
      </select>
    </div>
  );
}