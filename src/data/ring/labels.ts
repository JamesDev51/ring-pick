import type { AttributeKey, Confidence } from '../../types/ring';

export const attributeLabels: Record<AttributeKey, string> = {
  metal: '금속', shape: '센터 스톤', size: '스톤 크기', width: '밴드 두께',
  finish: '밴드 표면', setting: '세팅', halo: '주변 장식', profile: '세팅 높이'
};

export const valueLabels: Record<AttributeKey, Record<string, string>> = {
  metal: { white: '화이트골드', yellow: '옐로골드', rose: '로즈골드' },
  shape: { round: '라운드', oval: '오벌', emerald: '에메랄드', pear: '페어', cushion: '쿠션' },
  size: { small: '작은', medium: '중간', large: '큰' },
  width: { thin: '얇은', medium: '중간', thick: '두꺼운' },
  finish: { plain: '플레인', pave: '파베' },
  setting: { prong: '프롱', bezel: '베젤' },
  halo: { none: '헤일로 없음', halo: '헤일로' },
  profile: { low: '낮은', high: '높은' }
};

export const confidenceLabels: Record<Confidence, string> = {
  high: '확실해요', medium: '비교해볼 만해요', low: '아직 탐색 중'
};

export const compactValueLabels: Record<AttributeKey, Record<string, string>> = {
  metal: { white: '화이트', yellow: '옐로', rose: '로즈' },
  shape: valueLabels.shape,
  size: { small: '작은 스톤', medium: '중간 스톤', large: '큰 스톤' },
  width: { thin: '얇은 밴드', medium: '중간 밴드', thick: '두꺼운 밴드' },
  finish: valueLabels.finish,
  setting: valueLabels.setting,
  halo: valueLabels.halo,
  profile: { low: '낮은 세팅', high: '높은 세팅' }
};
