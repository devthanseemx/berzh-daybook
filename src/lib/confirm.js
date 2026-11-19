export function requestConfirmation({ title, message, confirmLabel = 'Delete', tone = 'danger' }) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('daybook-confirm', {
      detail: { title, message, confirmLabel, tone, resolve },
    }));
  });
}
