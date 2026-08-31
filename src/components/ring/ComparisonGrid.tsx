import type { RingAttributes } from '../../types/ring';
import { RingCard } from './RingCard';
import './comparison-grid.css';
interface Candidate { src: string; attributes: RingAttributes; }
interface Props { a: Candidate; b: Candidate; onA: () => void; onB: () => void; selected?: 'a'|'b'; disabled?: boolean; }
export function ComparisonGrid({ a,b,onA,onB,selected,disabled }: Props) { return <div className="comparison-grid"><RingCard testId="choice-a" {...a} onSelect={onA} selected={selected==='a'} disabled={disabled}/><RingCard testId="choice-b" {...b} onSelect={onB} selected={selected==='b'} disabled={disabled}/></div>; }
