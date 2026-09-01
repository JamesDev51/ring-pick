import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmSheet({ open, title, body, confirmLabel, onConfirm, onCancel, danger = false }: Props) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="bottom-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="sheet-handle" aria-hidden="true" />
        <h3 id="confirm-title">{title}</h3>
        <p>{body}</p>
        <div className="sheet-actions">
          <button ref={first} className={danger ? 'primary-button danger' : 'primary-button'} type="button" onClick={onConfirm}>{confirmLabel}</button>
          <button className="secondary-button" type="button" onClick={onCancel}>취소</button>
        </div>
      </section>
    </div>
  );
}
