export type Metal = 'white' | 'yellow' | 'rose';
export type Shape = 'round' | 'oval' | 'emerald' | 'pear' | 'cushion';
export type Size = 'small' | 'medium' | 'large';
export type Width = 'thin' | 'medium' | 'thick';
export type Finish = 'plain' | 'pave';
export type Setting = 'prong' | 'bezel';
export type Halo = 'none' | 'halo';
export type Profile = 'low' | 'high';
export type Mode = 'quick' | 'full';
export type Phase = 'diagnostic' | 'tournament' | 'result';
export type Confidence = 'high' | 'medium' | 'low';
export type DiagnosticChoice = 'a' | 'b' | 'neutral';

export interface RingAttributes {
  metal: Metal;
  shape: Shape;
  size: Size;
  width: Width;
  finish: Finish;
  setting: Setting;
  halo: Halo;
  profile: Profile;
}

export type AttributeKey = keyof RingAttributes;
export type AttributeValue = RingAttributes[AttributeKey];

export interface Ring {
  id: string;
  title: string;
  attributes: RingAttributes;
  assets: { packshot: string; worn: string; thumb: string };
  enabled: boolean;
  assetVersion: number;
}

export interface DiagnosticAsset {
  id: string;
  attribute: AttributeKey;
  value: string;
  attributes: RingAttributes;
  src: string;
}

export interface DiagnosticQuestion {
  id: string;
  attribute: AttributeKey;
  a: string;
  b: string;
  prompt: string;
  assetA: string;
  assetB: string;
}

export interface DiagnosticAnswer {
  questionId: string;
  choice: DiagnosticChoice;
  answeredAt: string;
}

export interface ValueStats {
  wins: number;
  losses: number;
  neutrals: number;
  comparisons: number;
  score: number;
}

export type AttributeScores = Record<AttributeKey, Record<string, ValueStats>>;

export interface AttributePreference {
  attribute: AttributeKey;
  topValue: string;
  secondValue?: string;
  score: number;
  secondScore: number;
  confidence: Confidence;
  exposure: number;
}

export interface MatchRecord {
  roundSize: 64 | 32 | 16 | 8 | 4 | 2;
  matchIndex: number;
  leftId: string;
  rightId: string;
  winnerId: string;
  loserId: string;
  weight: number;
  latencyMs: number;
  selectedAt: string;
}

export interface TournamentState {
  roundSize: 64 | 32 | 16 | 8 | 4 | 2;
  currentMatchIndex: number;
  currentRoundIds: string[];
  nextRoundIds: string[];
  history: MatchRecord[];
  initialIds: string[];
  startedMatchAt: number;
}

export interface ResultAlternative {
  ringId: string;
  reason: string;
}

export interface RingResult {
  winnerId: string;
  persona: string;
  preferences: AttributePreference[];
  topAttributes: { attribute: AttributeKey; value: string; label: string; score: number; confidence: Confidence }[];
  storeSentence: string;
  exclusionSentence?: string;
  alternatives: ResultAlternative[];
  generatedAt: string;
}

export interface RingSessionV1 {
  schemaVersion: 1;
  manifestVersion: string;
  sessionId: string;
  seed: number;
  mode: Mode;
  phase: Phase;
  startedAt: string;
  updatedAt: string;
  campaign?: { source?: string; medium?: string; name?: string };
  diagnostic?: { index: number; answers: DiagnosticAnswer[] };
  tournament: TournamentState;
  result?: RingResult;
}
