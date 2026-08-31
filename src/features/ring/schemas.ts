import { z } from 'zod';

const attr = z.object({
  metal: z.enum(['white', 'yellow', 'rose']),
  shape: z.enum(['round', 'oval', 'emerald', 'pear', 'cushion']),
  size: z.enum(['small', 'medium', 'large']),
  width: z.enum(['thin', 'medium', 'thick']),
  finish: z.enum(['plain', 'pave']),
  setting: z.enum(['prong', 'bezel']),
  halo: z.enum(['none', 'halo']),
  profile: z.enum(['low', 'high'])
});

export const ringSchema = z.object({
  id: z.string().regex(/^R\d{3}$/), title: z.string(), attributes: attr,
  assets: z.object({ packshot: z.string(), worn: z.string(), thumb: z.string() }),
  enabled: z.boolean(), assetVersion: z.number().int().positive()
});

const matchRecordSchema = z.object({
  roundSize: z.union([z.literal(64), z.literal(32), z.literal(16), z.literal(8), z.literal(4), z.literal(2)]),
  matchIndex: z.number().int().nonnegative(), leftId: z.string(), rightId: z.string(), winnerId: z.string(), loserId: z.string(),
  weight: z.number(), latencyMs: z.number().nonnegative(), selectedAt: z.string()
});

const prefSchema = z.object({
  attribute: z.enum(['metal', 'shape', 'size', 'width', 'finish', 'setting', 'halo', 'profile']),
  topValue: z.string(), secondValue: z.string().optional(), score: z.number(), secondScore: z.number(),
  confidence: z.enum(['high', 'medium', 'low']), exposure: z.number()
});

const resultSchema = z.object({
  winnerId: z.string(), persona: z.string(), preferences: z.array(prefSchema),
  topAttributes: z.array(z.object({ attribute: prefSchema.shape.attribute, value: z.string(), label: z.string(), score: z.number(), confidence: prefSchema.shape.confidence })),
  storeSentence: z.string(), exclusionSentence: z.string().optional(),
  alternatives: z.array(z.object({ ringId: z.string(), reason: z.string() })), generatedAt: z.string()
});

export const sessionSchema = z.object({
  schemaVersion: z.literal(1), manifestVersion: z.string(), sessionId: z.string(), seed: z.number().int(),
  mode: z.enum(['quick', 'full']), phase: z.enum(['diagnostic', 'tournament', 'result']), startedAt: z.string(), updatedAt: z.string(),
  campaign: z.object({ source: z.string().optional(), medium: z.string().optional(), name: z.string().optional() }).optional(),
  diagnostic: z.object({ index: z.number().int().nonnegative(), answers: z.array(z.object({ questionId: z.string(), choice: z.enum(['a', 'b', 'neutral']), answeredAt: z.string() })) }).optional(),
  tournament: z.object({
    roundSize: matchRecordSchema.shape.roundSize, currentMatchIndex: z.number().int().nonnegative(), currentRoundIds: z.array(z.string()),
    nextRoundIds: z.array(z.string()), history: z.array(matchRecordSchema), initialIds: z.array(z.string()), startedMatchAt: z.number()
  }),
  result: resultSchema.optional()
});

export const sharedQuerySchema = z.object({
  v: z.literal('1'), w: z.string().regex(/^R\d{3}$/), p: z.string().min(1)
});
