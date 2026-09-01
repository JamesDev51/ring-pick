import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/wedding-band/MobileShell';
import { useWeddingBandSession } from '../features/wedding-band/sessionContext';
import './static.css';

export function LegacyPage() {
  const navigate = useNavigate();
  const { dismissLegacy, startQuick } = useWeddingBandSession();
  function restart() { dismissLegacy(true); startQuick(); navigate('/play'); }
  return (
    <MobileShell><div className="page static-page legacy-page">
      <button className="icon-button static-back" type="button" aria-label="이전 화면" onClick={() => navigate(-1)}>‹</button>
      <span className="large-mark" aria-hidden="true">◇</span>
      <p className="eyebrow">VERSION 2.0</p>
      <h1>이전 반지 결과와<br />새 웨딩밴드 결과는 달라요</h1>
      <p className="lead">이전 버전은 큰 센터 다이아와 스톤 모양을 중심으로 봤어요. 새 버전은 실제로 매일 끼는 밴드의 폭, 표면, 작은 다이아, 투톤과 구조를 중심으로 진단합니다.</p>
      <div className="legacy-compare"><div><strong>이전</strong><span>프로포즈링·솔리테어 중심</span></div><div><strong>지금</strong><span>한국형 데일리 웨딩밴드 중심</span></div></div>
      <button className="primary-button" type="button" onClick={restart}>새 웨딩밴드 테스트 시작</button>
      <button className="link-button" type="button" onClick={() => { dismissLegacy(); navigate('/'); }}>나중에 할게요</button>
    </div></MobileShell>
  );
}
