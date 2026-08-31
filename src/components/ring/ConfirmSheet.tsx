interface Props { open: boolean; title: string; body: string; confirmText: string; onConfirm: () => void; onClose: () => void; }
export function ConfirmSheet({ open, title, body, confirmText, onConfirm, onClose }: Props) {
  if (!open) return null;
  return <div className="bottom-sheet-backdrop" role="presentation" onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
    <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h3 id="confirm-title">{title}</h3><p>{body}</p>
      <div className="sheet-actions"><button className="primary-button" type="button" onClick={onConfirm}>{confirmText}</button><button className="secondary-button" type="button" onClick={onClose}>취소</button></div>
    </section>
  </div>;
}
