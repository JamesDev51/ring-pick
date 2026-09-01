import { z } from 'zod';

export const familySchema = z.enum(['classic','point','line','pave','structure','texture','twoTone','curve','petiteCenter']);
export const metalToneSchema = z.enum(['silver','champagne','yellow','rose','twoTone']);
export const bandWidthSchema = z.enum(['slim','medium','wide']);
export const bandProfileSchema = z.enum(['domed','oval','flat','beveled','concave','faceted']);
export const surfaceFinishSchema = z.enum(['polished','satin','hairline','sandblast','hammered','milgrain','engraved','mixed']);
export const diamondLayoutSchema = z.enum(['none','singleFlush','triple','shortLine','diagonalLine','channel','quarterPave','halfPave','fullEternity','petiteCenter']);
export const motifSchema = z.enum(['straight','centerGroove','edgeLine','diagonal','vLine','wave','twist','segmented','asymmetric']);
export const colorLayoutSchema = z.enum(['mono','centerStripe','edgeContrast','split','interwoven']);
export const boldnessSchema = z.enum(['quiet','balanced','bold','sparkly']);
export const preferenceKeySchema = z.enum(['metalTone','bandWidth','bandProfile','surfaceFinish','diamondLayout','motif','colorLayout']);

export const attributesSchema = z.object({
  metalTone: metalToneSchema,
  bandWidth: bandWidthSchema,
  bandProfile: bandProfileSchema,
  surfaceFinish: surfaceFinishSchema,
  diamondLayout: diamondLayoutSchema,
  motif: motifSchema,
  colorLayout: colorLayoutSchema,
  boldness: boldnessSchema,
});

export const candidateSchema = z.object({
  id: z.string().regex(/^WB\d{3}$/),
  family: familySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  attributes: attributesSchema,
  renderHints: z.record(z.string(), z.unknown()),
  partnerRule: z.enum(['sameMotifWiderLessStone','sameTonePlainWider','sameColorLayoutLessStone','sameTextureDifferentEdge']),
  enabled: z.boolean(),
  assetVersion: z.literal(2),
  assets: z.object({
    pack384: z.string(), pack768: z.string(), worn384: z.string(), worn768: z.string(), fallback: z.string(),
    detailCrop: z.object({ x: z.number(), y: z.number(), scale: z.number() }),
  }),
});

export const diagnosticAssetSchema = z.object({
  id: z.string().regex(/^DA-/),
  axis: preferenceKeySchema,
  value: z.string(),
  attributes: attributesSchema,
  renderHints: z.record(z.string(), z.unknown()),
  assets: z.object({ image384: z.string(), image768: z.string(), fallback: z.string() }),
});

export const diagnosticQuestionSchema = z.object({
  id: z.string().regex(/^D\d{2}$/),
  attribute: preferenceKeySchema,
  aValue: z.string(), bValue: z.string(), assetA: z.string(), assetB: z.string(), prompt: z.string().min(1),
});

const valuePreferenceSchema = z.object({
  value: z.string(), score: z.number(), exposures: z.number(), wins: z.number(), losses: z.number(), neutrals: z.number(),
});
const axisPreferenceSchema = z.object({
  key: preferenceKeySchema,
  values: z.array(valuePreferenceSchema),
  topValue: z.string(), secondValue: z.string(), score: z.number(), confidence: z.enum(['high','medium','low']),
});
const preferenceProfileSchema = z.object({
  metalTone: axisPreferenceSchema,
  bandWidth: axisPreferenceSchema,
  bandProfile: axisPreferenceSchema,
  surfaceFinish: axisPreferenceSchema,
  diamondLayout: axisPreferenceSchema,
  motif: axisPreferenceSchema,
  colorLayout: axisPreferenceSchema,
});

export const resultSchema = z.object({
  schemaVersion: z.literal(2), winnerId: z.string().regex(/^WB\d{3}$/), winnerFamily: familySchema,
  persona: z.string(), description: z.string(), mode: z.enum(['quick','full']), preferences: preferenceProfileSchema,
  topTags: z.array(z.string()), strongDislikes: z.array(z.string()), storeSentence: z.string(), partnerSentence: z.string(),
  alternatives: z.array(z.object({ id: z.string(), reason: z.string() })), createdAt: z.string(),
});

const tournamentSchema = z.object({
  roundSize: z.number(), currentRoundIds: z.array(z.string()), currentMatchIndex: z.number(), nextRoundIds: z.array(z.string()),
  history: z.array(z.object({
    roundSize: z.number(), matchIndex: z.number(), leftId: z.string(), rightId: z.string(), winnerId: z.string(), loserId: z.string(), answeredAt: z.string(),
  })),
  undoStack: z.array(z.object({ roundSize: z.number(), currentRoundIds: z.array(z.string()), currentMatchIndex: z.number(), nextRoundIds: z.array(z.string()) })),
});

export const sessionSchema = z.object({
  schemaVersion: z.literal(2), manifestVersion: z.literal('2.0.0'), sessionId: z.string(), seed: z.number(), mode: z.enum(['quick','full']),
  phase: z.enum(['diagnostic','selecting','tournament','result']),
  diagnostic: z.object({ index: z.number(), answers: z.array(z.object({ questionId: z.string(), choice: z.enum(['a','b','neutral']), answeredAt: z.string() })) }).optional(),
  selectedCandidates: z.array(z.object({ id: z.string(), score: z.number(), origin: z.enum(['fit','explore','wildcard','fill']) })).optional(),
  tournament: tournamentSchema, result: resultSchema.optional(), startedAt: z.string(), updatedAt: z.string(),
  campaign: z.object({ source: z.string().optional(), medium: z.string().optional(), name: z.string().optional() }).optional(),
});

export const sharePayloadSchema = z.object({
  v: z.literal(2), w: z.string().regex(/^WB\d{3}$/), f: familySchema, tone: metalToneSchema,
  tags: z.array(z.string()).max(4), p: z.record(z.string(), z.string()), m: z.enum(['quick','full']),
});
