import type {
  BandProfile,
  BandWidth,
  Boldness,
  ColorLayout,
  DiamondLayout,
  MetalTone,
  Motif,
  PreferenceKey,
  SurfaceFinish,
  WeddingBandFamily,
} from '../../types/weddingBand';

export const familyLabels: Record<WeddingBandFamily, string> = {
  classic: '클래식 밴드',
  point: '포인트 다이아',
  line: '라인 세팅',
  pave: '파베·이터니티',
  structure: '구조·그루브',
  texture: '텍스처·빈티지',
  twoTone: '투톤',
  curve: '곡선·트위스트',
  petiteCenter: '쁘띠 센터',
};

export const preferenceKeyLabels: Record<PreferenceKey, string> = {
  metalTone: '금속 색감',
  bandWidth: '밴드 폭',
  bandProfile: '밴드 단면',
  surfaceFinish: '표면',
  diamondLayout: '스톤 표현',
  motif: '밴드 디테일',
  colorLayout: '색 조합',
};

export const metalToneLabels: Record<MetalTone, string> = {
  silver: '쿨 실버톤',
  champagne: '뉴트럴 샴페인톤',
  yellow: '웜 옐로골드톤',
  rose: '소프트 로즈골드톤',
  twoTone: '투톤',
};
export const bandWidthLabels: Record<BandWidth, string> = { slim: '슬림 폭', medium: '미디엄 폭', wide: '와이드 폭' };
export const bandProfileLabels: Record<BandProfile, string> = {
  domed: '둥근 돔', oval: '편안한 오벌', flat: '깔끔한 플랫', beveled: '베벨 엣지', concave: '오목한 콘케이브', faceted: '다면 패싯',
};
export const surfaceFinishLabels: Record<SurfaceFinish, string> = {
  polished: '미러 유광', satin: '새틴 무광', hairline: '헤어라인', sandblast: '샌드 무광', hammered: '해머드', milgrain: '밀그레인', engraved: '섬세한 인그레이빙', mixed: '유광·무광 믹스',
};
export const diamondLayoutLabels: Record<DiamondLayout, string> = {
  none: '무스톤', singleFlush: '한 점 매립', triple: '세 점 포인트', shortLine: '짧은 다이아 라인', diagonalLine: '사선 다이아 라인', channel: '미니 채널', quarterPave: '쿼터 파베', halfPave: '하프 파베', fullEternity: '풀 이터니티', petiteCenter: '낮은 쁘띠 센터',
};
export const motifLabels: Record<Motif, string> = {
  straight: '곧은 미니멀', centerGroove: '중앙 홈', edgeLine: '엣지 라인', diagonal: '사선 디테일', vLine: 'V 라인', wave: '부드러운 웨이브', twist: '낮은 트위스트', segmented: '리듬감 있는 분절', asymmetric: '비대칭 포인트',
};
export const colorLayoutLabels: Record<ColorLayout, string> = {
  mono: '단색', centerStripe: '센터 스트라이프', edgeContrast: '엣지 투톤', split: '좌우 분할', interwoven: '교차 투톤',
};
export const boldnessLabels: Record<Boldness, string> = { quiet: '차분한', balanced: '균형 잡힌', bold: '볼드한', sparkly: '은은하게 화려한' };

export const valueLabels: Record<PreferenceKey, Record<string, string>> = {
  metalTone: metalToneLabels,
  bandWidth: bandWidthLabels,
  bandProfile: bandProfileLabels,
  surfaceFinish: surfaceFinishLabels,
  diamondLayout: diamondLayoutLabels,
  motif: motifLabels,
  colorLayout: colorLayoutLabels,
};

export const preferenceDomains: Record<PreferenceKey, string[]> = {
  metalTone: ['silver', 'champagne', 'yellow', 'rose', 'twoTone'],
  bandWidth: ['slim', 'medium', 'wide'],
  bandProfile: ['domed', 'oval', 'flat', 'beveled', 'concave', 'faceted'],
  surfaceFinish: ['polished', 'satin', 'hairline', 'sandblast', 'hammered', 'milgrain', 'engraved', 'mixed'],
  diamondLayout: ['none', 'singleFlush', 'triple', 'shortLine', 'diagonalLine', 'channel', 'quarterPave', 'halfPave', 'fullEternity', 'petiteCenter'],
  motif: ['straight', 'centerGroove', 'edgeLine', 'diagonal', 'vLine', 'wave', 'twist', 'segmented', 'asymmetric'],
  colorLayout: ['mono', 'centerStripe', 'edgeContrast', 'split', 'interwoven'],
};
