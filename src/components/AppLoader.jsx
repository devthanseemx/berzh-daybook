export default function AppLoader({ message = 'Getting your daybook ready' }) {
  return (
    <main className="app-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="app-loader-content">
        <img src="/daybook-mark.svg" alt="" />
        <span className="app-loader-spinner" aria-hidden="true" />
        <strong>{message}</strong>
        <span className="app-loader-caption">A little more focus. A lot more you.</span>
      </div>
    </main>
  );
}
