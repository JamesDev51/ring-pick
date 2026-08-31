import { useRef, useState } from 'react';
import type { Ring, RingResult } from '../../types/ring';
import { buildResultUrl } from '../../features/ring/shareCodec';
import { exportResultCard, saveBlob } from '../../features/ring/exportAdapter';
import { track } from '../../features/ring/analytics';
import { ExportCard } from './ExportCard';
import './result.css';
export function ShareActions({ring,result,onToast}:{ring:Ring;result:RingResult;onToast:(m:string)=>void}){
  const ref=useRef<HTMLDivElement>(null); const [busy,setBusy]=useState(false);
  async function makeBlob(){if(!ref.current)throw new Error('export card missing');setBusy(true);try{return await exportResultCard(ref.current);}finally{setBusy(false)}}
  async function fallbackCopy(message:string){try{await navigator.clipboard?.writeText(buildResultUrl(ring));onToast(message)}catch{onToast('공유가 어려워요. 화면을 캡처해 주세요.')}}
  async function download(){try{const blob=await makeBlob();saveBlob(blob);track('result_save',{method:'png'});onToast('결과 이미지를 저장했어요.');}catch{track('error_view',{code:'export_failed'});await fallbackCopy('이미지 저장이 어려워 결과 링크를 복사했어요.')}}
  async function share(){try{const blob=await makeBlob();const file=new File([blob],'my-ring-style.png',{type:'image/png'});const url=buildResultUrl(ring);const data={title:'내 웨딩링 취향',text:result.persona,url,files:[file]};if(navigator.share&&(!navigator.canShare||navigator.canShare(data))){await navigator.share(data);track('result_share',{method:'file'});return;}saveBlob(blob);track('result_save',{method:'png-fallback'});await fallbackCopy('이미지를 저장하고 결과 링크를 복사했어요.');track('result_share',{method:'url'});}catch(e){if((e as Error)?.name==='AbortError')return;track('error_view',{code:'share_failed'});await fallbackCopy('결과 링크를 복사했어요.')}}
  return <><section className="share-actions"><button className="primary-button" onClick={download} disabled={busy} type="button">{busy?'이미지 만드는 중…':'결과 이미지 저장'}</button><button className="secondary-button" onClick={share} disabled={busy} type="button">공유하기</button></section><div className="export-offscreen"><ExportCard ref={ref} ring={ring} result={result}/></div></>;
}
