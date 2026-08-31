import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/ring/MobileShell';
import { ConfirmSheet } from '../components/ring/ConfirmSheet';
import { Toast } from '../components/ring/Toast';
import { copy, ringById } from '../data/ring';
import { track } from '../features/ring/analytics';
import { useRingSession } from '../features/ring/sessionContext';
import './landing.css';

export function LandingPage(){
  const nav=useNavigate(); const {state,start,reset,toast}=useRingSession(); const [confirm,setConfirm]=useState(false); const session=state.session; const preview=ringById.get('R034')!;
  useEffect(()=>{const p=new URLSearchParams(window.location.search);track('landing_view',{utm_source:p.get('utm_source')||undefined,campaign:p.get('utm_campaign')||undefined})},[]);
  const primary=useMemo(()=>{if(!session)return copy.landing.quick;if(session.phase==='result')return '지난 결과 보기';if(session.phase==='diagnostic')return `이어서 하기 · 취향 탐색 ${session.diagnostic?.index??0}/17`;return `이어서 하기 · ${session.tournament.roundSize}강`;},[session]);
  function goPrimary(){if(session){track('session_resume',{phase:session.phase});nav(session.phase==='result'?'/result':'/play');return;}track('test_start',{mode:'quick'});start('quick');nav('/play');}
  function startFull(){track('test_start',{mode:'full'});start('full');nav('/play');}
  function restartQuick(){reset();setConfirm(false);track('test_start',{mode:'quick'});start('quick');nav('/play');}
  return <MobileShell><div className="page landing-page">
    <div className="landing-top"><div className="wordmark"><span className="wordmark-mark">◇</span>RING PICK</div><p className="landing-source">by 밍정커플</p></div>
    <section className="landing-hero"><p className="eyebrow">반지 보러 가기 전</p><h1 className="h1">반지 보러 가기 전,<br/>내 취향부터</h1><p className="body">둘 중 더 끌리는 반지를 고르면<br/>금속·스톤·밴드 취향을 정리해드려요.</p><div className="trust-row"><span>로그인 없이</span><span>약 2~3분</span><span>결과 저장</span></div></section>
    <section className="preview-card card" aria-label="결과 예시"><div className="preview-copy"><span>RESULT PREVIEW</span><strong>깔끔한 클래식<br/>솔리테어파</strong><div className="mini-chips"><i>화이트골드</i><i>오벌</i><i>얇은 밴드</i></div></div><img src={preview.assets.packshot} alt="결과 카드 예시 반지"/></section>
    <section className="landing-actions"><button className="primary-button" type="button" onClick={goPrimary}>{primary}</button>{session?<button className="secondary-button" type="button" onClick={()=>setConfirm(true)}>새로 취향 찾기</button>:<button className="secondary-button" type="button" onClick={startFull}>{copy.landing.full}</button>}</section>
    <p className="landing-note">생성 이미지를 활용한 시각 취향 테스트예요.<br/>실제 제품의 색·크기·착용감과 차이가 날 수 있어요.</p><a className="privacy-link" href="/privacy">개인정보 및 이용 안내</a>
    <ConfirmSheet open={confirm} title="처음부터 다시 할까요?" body="지금까지의 선택 기록은 이 기기에서 지워져요. 새로 시작하면 되돌릴 수 없어요." confirmText="새로 시작하기" onClose={()=>setConfirm(false)} onConfirm={restartQuick}/><Toast message={toast}/>
  </div></MobileShell>;
}
