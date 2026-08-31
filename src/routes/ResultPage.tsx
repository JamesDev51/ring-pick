import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/ring/MobileShell';
import { ResultHero } from '../components/ring/ResultHero';
import { PreferenceBars } from '../components/ring/PreferenceBars';
import { StoreSentence } from '../components/ring/StoreSentence';
import { AlternativeRingList } from '../components/ring/AlternativeRingList';
import { ShareActions } from '../components/ring/ShareActions';
import { ConfirmSheet } from '../components/ring/ConfirmSheet';
import { Toast } from '../components/ring/Toast';
import { ringById, rings } from '../data/ring';
import { decodeShared } from '../features/ring/shareCodec';
import { buildResult } from '../features/ring/resultBuilder';
import { emptyScores } from '../features/ring/preferenceEngine';
import { ATTRIBUTE_ORDER } from '../features/ring/constants';
import { useRingSession } from '../features/ring/sessionContext';
import { track } from '../features/ring/analytics';
import './result-page.css';

export function ResultPage(){
  const {search}=useLocation(); const nav=useNavigate();
  const {state,reset,start,toast,showToast}=useRingSession(); const [confirm,setConfirm]=useState(false);
  const shared=useMemo(()=>search?decodeShared(search):undefined,[search]);
  const sessionResult=state.session?.phase==='result'?state.session.result:undefined;
  const result=useMemo(()=>{
    if (search && shared) {
      const scores=emptyScores();
      for (const key of ATTRIBUTE_ORDER) { const value=shared.attributes[key]; const stat=scores[key][value]; if(stat){stat.score=.72;stat.comparisons=2;} }
      return buildResult(scores,shared,rings);
    }
    return sessionResult;
  },[search,shared,sessionResult]);
  const winner=result?ringById.get(result.winnerId):undefined;
  useEffect(()=>{if(result){track('result_view',{mode:state.session?.mode??'shared',winnerId:result.winnerId})}else if(search){track('error_view',{code:'invalid_result_query'})}},[result,search,state.session?.mode]);

  if(search&&!shared)return <MobileShell><div className="page invalid-result"><div className="wordmark"><span className="wordmark-mark">◇</span>RING PICK</div><div><p className="eyebrow">링크를 확인해 주세요</p><h1 className="h2">이 결과 링크는 열 수 없어요.</h1><p className="body">링크가 잘렸거나 오래된 형식일 수 있어요. 직접 테스트하면 새로운 결과를 만들 수 있어요.</p></div><button className="primary-button" onClick={()=>nav('/')} type="button">나도 해보기</button></div></MobileShell>;
  if(!result||!winner)return <Navigate to="/" replace/>;

  return <MobileShell><div className="page result-page">
    <div className="result-top"><button className="icon-button" onClick={()=>nav('/')} aria-label="홈으로" type="button">‹</button><div className="wordmark">RING PICK</div><span className="top-spacer"/></div>
    <ResultHero ring={winner} result={result}/><PreferenceBars preferences={result.preferences}/>
    <StoreSentence sentence={result.storeSentence} exclusion={result.exclusionSentence} onCopied={()=>showToast('매장용 문장을 복사했어요.')}/>
    <AlternativeRingList alternatives={result.alternatives}/><ShareActions ring={winner} result={result} onToast={showToast}/>
    <button className="ghost-restart" type="button" onClick={()=>setConfirm(true)}>다시 취향 찾기</button>
    <p className="result-disclaimer">실제 착용감·크기·색은 조명, 손 크기, 제작 방식에 따라 달라질 수 있어요.<br/>이 결과는 구매 결정을 대신하지 않는 시각 취향 참고 자료예요.</p>
    <ConfirmSheet open={confirm} title="새로 취향을 찾아볼까요?" body="현재 결과는 이 기기의 이어하기 기록에서 지워져요. 저장한 이미지는 그대로 남아 있어요." confirmText="처음부터 다시 하기" onClose={()=>setConfirm(false)} onConfirm={()=>{reset();start('quick');nav('/play')}}/><Toast message={toast}/>
  </div></MobileShell>;
}
