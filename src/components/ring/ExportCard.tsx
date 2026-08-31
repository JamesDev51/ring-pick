import { forwardRef } from 'react';
import type { Ring, RingResult } from '../../types/ring';
export const ExportCard=forwardRef<HTMLDivElement,{ring:Ring;result:RingResult}>(({ring,result},ref)=><div ref={ref} className="export-card" aria-hidden="true"><div className="export-brand">RING PICK · 밍정커플</div><div><p className="export-kicker">MY WEDDING RING STYLE</p><h2>{result.persona}</h2></div><div className="export-ring"><img src={ring.assets.packshot} alt=""/></div><div className="export-chips">{result.topAttributes.map(x=><span key={x.attribute}>{x.label}</span>)}</div><p className="export-sentence">“{result.storeSentence}”</p><div className="export-footer"><strong>내 반지 취향 찾기</strong><span>@mmingjjung.couple</span></div></div>);
ExportCard.displayName='ExportCard';
