import { metalToneLabels, motifLabels, surfaceFinishLabels } from '../../data/wedding-band/labels';
import type { WeddingBandCandidate } from '../../types/weddingBand';

export function buildPartnerSentence(candidate: WeddingBandCandidate) {
  const tone = metalToneLabels[candidate.attributes.metalTone];
  const motif = motifLabels[candidate.attributes.motif];
  switch (candidate.partnerRule) {
    case 'sameTonePlainWider':
      return `파트너 링은 ${tone}과 ${motif} 느낌은 유지하고, 폭을 한 단계 넓히면서 스톤을 빼면 자연스러운 한 쌍이 돼요.`;
    case 'sameColorLayoutLessStone':
      return `투톤 배치는 그대로 맞추고 파트너 링의 다이아만 줄이면, 서로 달라도 같은 세트처럼 보여요.`;
    case 'sameTextureDifferentEdge':
      return `${surfaceFinishLabels[candidate.attributes.surfaceFinish]} 질감은 같이 가져가고, 파트너 링은 유광 엣지 비율이나 폭을 다르게 조절해보세요.`;
    default:
      return `${tone}과 ${motif} 모티프는 같이 두고, 파트너 링은 폭을 조금 넓히고 스톤을 줄이면 데일리로 맞추기 좋아요.`;
  }
}
