interface Props {
  title: string;
  current: number;
  total: number;
  onBack: () => void;
}

export function ProgressHeader({ title, current, total, onBack }: Props) {
  const percentage = total ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <header className="sticky-header">
      <div className="header-row">
        <button className="icon-button" type="button" aria-label="이전 선택으로 돌아가기" onClick={onBack}>‹</button>
        <div className="header-title">{title} · {current}/{total}</div>
        <span aria-hidden="true" />
      </div>
      <div className="progress-track" role="progressbar" aria-label="진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </header>
  );
}
