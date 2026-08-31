export function StoreSentence({ sentence, dislikes, onCopy }: { sentence: string; dislikes: string[]; onCopy: () => void }) {
  return (
    <section className="result-section" aria-labelledby="store-sentence-title">
      <div className="section-heading">
        <h2 id="store-sentence-title">반지샵에서는 이렇게 말해보세요</h2>
        <p>그대로 복사해서 상담할 때 보여줘도 돼요.</p>
      </div>
      <div className="store-sentence card">
        <p>“{sentence}”</p>
        {dislikes.length > 0 && <div className="dislike-box"><strong>강하게 끌리지 않았던 요소</strong><span>{dislikes.join(' · ')}</span></div>}
        <button className="secondary-button" type="button" onClick={onCopy}>문장 복사</button>
      </div>
    </section>
  );
}
