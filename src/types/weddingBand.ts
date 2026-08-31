export type WeddingBandFamily =
  | 'classic'
  | 'point'
  | 'line'
  | 'pave'
  | 'structure'
  | 'texture'
  | 'twoTone'
  | 'curve'
  | 'petiteCenter';

export type MetalTone = 'silver' | 'champagne' | 'yellow' | 'rose' | 'twoTone';
export type BandWidth = 'slim' | 'medium' | 'wide';
export type BandProfile = 'domed' | 'oval' | 'flat' | 'beveled' | 'concave' | 'faceted';
export type SurfaceFinish =
  | 'polished'
  | 'satin'
  | 'hairline'
  | 'sandblast'
  | 'hammered'
  | 'milgrain'
  | 'engraved'
  | 'mixed';
export type DiamondLayout =
  | 'none'
  | 'singleFlush'
  | 'triple'
  | 'shortLine'
  | 'diagonalLine'
  | 'channel'
  | 'quarterPave'
  | 'halfPave'
  | 'fullEternity'
  | 'petiteCenter';
export type Motif =
  | 'straight'
  | 'centerGroove'
  | 'edgeLine'
  | 'diagonal'
  | 'vLine'
  | 'wave'
  | 'twist'
  | 'segmented'
  | 'asymmetric';
export type ColorLayout = 'mono' | 'centerStripe' | 'edgeContrast' | 'split' | 'interwoven';
export type Boldness = 'quiet' | 'balanced' | 'bold' | 'sparkly';

export interface WeddingBandAttributes {
  metalTone: MetalTone;
  bandWidth: BandWidth;
  bandProfile: BandProfile;
  surfaceFinish: SurfaceFinish;
  diamondLayout: DiamondLayout;
  motif: Motif;
  colorLayout: ColorLayout;
  boldness: Boldness;
}

export type PreferenceKey = Exclude<keyof WeddingBandAttributes, 'boldness'>;
export type PreferenceValue = WeddingBandAttributes[PreferenceKey];

export type PartnerRule =
  | 'sameMotifWiderLessStone'
  | 'sameTonePlainWider'
  | 'sameColorLayoutLessStone'
  | 'sameTextureDifferentEdge';

export interface WeddingBandAssets {
  pack384: string;
  pack768: string;
  worn384: string;
  worn768: string;
  fallback: string;
  detailCrop: { x: number; y: number; scale: number };
}

export interface WeddingBandCandidate {
  id: `WB${string}`;
  family: WeddingBandFamily;
  title: string;
  description: string;
  attributes: WeddingBandAttributes;
  renderHints: Record<string, unknown>;
  assets: WeddingBandAssets;
  partnerRule: PartnerRule;
  enabled: boolean;
  assetVersion: 2;
}

export interface DiagnosticAsset {
  id: `DA-${string}`;
  axis: PreferenceKey;
  value: string;
  attributes: WeddingBandAttributes;
  renderHints: Record<string, unknown>;
  assets: { image384: string; image768: string; fallback: string };
}

export interface DiagnosticQuestion {
  id: `D${string}`;
  attribute: PreferenceKey;
  aValue: string;
  bValue: string;
  assetA: string;
  assetB: string;
  prompt: string;
}

export type DiagnosticChoice = 'a' | 'b' | 'neutral';
export interface DiagnosticAnswer {
  questionId: string;
  choice: DiagnosticChoice;
  answeredAt: string;
}

export interface ValuePreference {
  value: string;
  score: number;
  exposures: number;
  wins: number;
  losses: number;
  neutrals: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export interface AxisPreference {
  key: PreferenceKey;
  values: ValuePreference[];
  topValue: string;
  secondValue: string;
  score: number;
  confidence: ConfidenceLevel;
}
export type PreferenceProfile = Record<PreferenceKey, AxisPreference>;

export interface CandidateScore {
  id: string;
  score: number;
  origin: 'fit' | 'explore' | 'wildcard' | 'fill';
}

export interface TournamentMatch {
  roundSize: number;
  matchIndex: number;
  leftId: string;
  rightId: string;
  winnerId: string;
  loserId: string;
  answeredAt: string;
}

export interface TournamentSnapshot {
  roundSize: number;
  currentRoundIds: string[];
  currentMatchIndex: number;
  nextRoundIds: string[];
}

export interface TournamentState {
  roundSize: number;
  currentRoundIds: string[];
  currentMatchIndex: number;
  nextRoundIds: string[];
  history: TournamentMatch[];
  undoStack: TournamentSnapshot[];
}

export interface ResultAlternative {
  id: string;
  reason: string;
}

export interface WeddingBandResult {
  schemaVersion: 2;
  winnerId: string;
  winnerFamily: WeddingBandFamily;
  persona: string;
  description: string;
  mode: 'quick' | 'full';
  preferences: PreferenceProfile;
  topTags: string[];
  strongDislikes: string[];
  storeSentence: string;
  partnerSentence: string;
  alternatives: ResultAlternative[];
  createdAt: string;
}

export interface CampaignInfo {
  source?: string;
  medium?: string;
  name?: string;
}

export interface WeddingBandSessionV2 {
  schemaVersion: 2;
  manifestVersion: '2.0.0';
  sessionId: string;
  seed: number;
  mode: 'quick' | 'full';
  phase: 'diagnostic' | 'selecting' | 'tournament' | 'result';
  diagnostic?: { index: number; answers: DiagnosticAnswer[] };
  selectedCandidates?: CandidateScore[];
  tournament: TournamentState;
  result?: WeddingBandResult;
  startedAt: string;
  updatedAt: string;
  campaign?: CampaignInfo;
}

export interface SharePayloadV2 {
  v: 2;
  w: string;
  f: WeddingBandFamily;
  tone: MetalTone;
  tags: string[];
  p: Partial<Record<PreferenceKey, string>>;
  m: 'quick' | 'full';
}

export type RingView = 'pack' | 'worn';
