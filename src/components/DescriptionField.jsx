import { useId, useRef } from 'react';
import { ListPlus } from 'lucide-react';

export default function DescriptionField({
  value = '', onChange, label = 'Description (optional)', placeholder = 'Add details or a numbered list…', rows = 3,
}) {
  const inputRef = useRef(null);
  const fieldId = useId();

  const insertText = (text, cursorOffset) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + cursorOffset, start + cursorOffset);
    });
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    const input = event.currentTarget;
    const beforeCursor = value.slice(0, input.selectionStart);
    const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf('\n') + 1);
    const match = currentLine.match(/^(\s*)(\d+)\.\s.*$/);
    if (!match) return;
    event.preventDefault();
    const nextNumber = Number(match[2]) + 1;
    insertText(`\n${match[1]}${nextNumber}. `, match[1].length + String(nextNumber).length + 3);
  };

  return (
    <div className="description-field">
      <div className="description-field-heading">
        <label htmlFor={fieldId}>{label}</label>
        <button
          type="button"
          className="description-list-button"
          onClick={() => insertText(`${value && !value.endsWith('\n') ? '\n' : ''}1. `, value && !value.endsWith('\n') ? 4 : 3)}
        >
          <ListPlus size={14} /> Numbered list
        </button>
      </div>
      <textarea
        ref={inputRef}
        id={fieldId}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <small>Press Enter after a numbered item to continue the list.</small>
    </div>
  );
}
