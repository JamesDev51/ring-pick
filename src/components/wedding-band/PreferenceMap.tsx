import { preferenceKeyLabels, valueLabels } from '../../data/wedding-band/labels';
import type { PreferenceKey, PreferenceProfile } from '../../types/weddingBand';

const keys: PreferenceKey[] = ['diamondLayout','bandWidth','bandProfile','surfaceFinish','motif','metalTone','colorLayout'];

export function PreferenceMap({ profile }: { profile: PreferenceProfile }) {
  return (
    <section className="result-section" aria-labelledby="preference-map-title">
      <div className="section-heading">
        <h2 id="preference-map-title">내 취향 맵</h2>
        <p>선택 과정에서 반복해서 고른 요소를 정리했어요.</p>
      </div>
      <div className="preference-list">
        {keys.map((key) => {
          const axis = profile[key];
          const percent = Math.round(axis.score * 100);
          return (
            <article className="preference-row" key={key}>
              <div className="preference-copy">
                <strong>{preferenceKeyLabels[key]}</strong>
                <span>{valueLabels[key][axis.topValue] ?? axis.topValue}</span>
              </div>
              <div className="preference-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
              <b>{percent}%</b>
              <p className="confidence-copy">확신도 {axis.confidence === 'high' ? '높음' : axis.confidence === 'medium' ? '보통' : '탐색 중'}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
