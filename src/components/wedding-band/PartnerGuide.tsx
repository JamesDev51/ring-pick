export function PartnerGuide({ sentence }: { sentence: string }) {
  return (
    <section className="result-section" aria-labelledby="partner-guide-title">
      <div className="section-heading">
        <h2 id="partner-guide-title">파트너 링은 이렇게 맞춰보세요</h2>
        <p>두 반지가 완전히 같지 않아도 한 쌍처럼 보일 수 있어요.</p>
      </div>
      <div className="partner-guide card">
        <span className="partner-icon" aria-hidden="true">◇◇</span>
        <p>{sentence}</p>
      </div>
    </section>
  );
}
