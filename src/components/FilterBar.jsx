import Dropdown from './Dropdown';

export default function FilterBar({ status, setStatus, order, setOrder, range, setRange }) {
  return (
    <div className="filters">
      {setRange && (
        <Dropdown
          ariaLabel="Date range"
          className="filter-dropdown"
          value={range}
          onChange={setRange}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
            { value: 'all', label: 'All dates' },
          ]}
        />
      )}
      <div className="seg" role="group" aria-label="Status filter">
        {[['all', 'All'], ['pending', 'Pending'], ['done', 'Completed']].map(([v, label]) => (
          <button key={v} className={status === v ? 'active' : ''} onClick={() => setStatus(v)}>
            {label}
          </button>
        ))}
      </div>
      <Dropdown
        ariaLabel="Sort order"
        className="filter-dropdown"
        value={order}
        onChange={setOrder}
        options={[
          { value: 'asc', label: 'Earliest first' },
          { value: 'desc', label: 'Latest first' },
        ]}
      />
    </div>
  );
}