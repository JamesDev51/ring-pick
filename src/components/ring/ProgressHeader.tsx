import type { ReactNode } from 'react';
interface Props { title: string; current: number; total: number; onBack?: () => void; right?: ReactNode; }
export function ProgressHeader({ title, current, total, onBack, right }: Props) {
  const value = Math.max(0, Math.min(current, total));
  return <header className="sticky-header">
    <div className="header-row">
      {onBack ? <button className="icon-button" type="button" aria-label="이전 선택으로 돌아가기" onClick={onBack}>‹</button> : <span />}
      <div className="header-title">{title} · {value}/{total}</div>
      <div>{right}</div>
    </div>
    <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={`${title} 진행률`}><div className="progress-fill" style={{ width: `${total ? value / total * 100 : 0}%` }} /></div>
  </header>;
}
