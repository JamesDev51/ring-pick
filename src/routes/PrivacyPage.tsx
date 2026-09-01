import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/wedding-band/MobileShell';
import './static.css';

export function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <MobileShell><div className="page static-page">
      <button className="icon-button static-back" type="button" aria-label="이전 화면" onClick={() => navigate(-1)}>‹</button>
      <p className="eyebrow">PRIVACY</p>
      <h1>저장 및 개인정보 안내</h1>
      <section><h2>서버로 보내지 않아요</h2><p>선택 내역과 결과는 이 브라우저의 로컬 저장소에만 보관됩니다. 로그인, 이름, 연락처, 사진 업로드는 요구하지 않아요.</p></section>
      <section><h2>90일 후 자동 만료</h2><p>마지막 이용일로부터 90일이 지난 세션은 다음 방문 시 자동 삭제됩니다. ‘처음부터 다시 시작’을 누르면 즉시 지울 수 있어요.</p></section>
      <section><h2>공유 링크</h2><p>공유 링크에는 우승 후보 ID와 요약된 취향 값만 들어갑니다. 개인을 식별할 수 있는 정보는 포함하지 않아요.</p></section>
      <section><h2>제품 안내</h2><p>이미지는 취향 탐색을 위한 비브랜드 예시입니다. 화면 색과 실제 합금 색, 착용감과 제작 가능 여부는 매장에서 확인해주세요.</p></section>
      <button className="primary-button" type="button" onClick={() => navigate(-1)}>확인했어요</button>
    </div></MobileShell>
  );
}
