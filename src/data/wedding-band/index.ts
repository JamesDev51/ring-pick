import candidatesJson from './candidates.v2.json';
import diagnosticAssetsJson from './diagnostic-assets.v2.json';
import diagnosticQuestionsJson from './diagnostic-questions.v2.json';
import copyJson from './copy.ko.v2.json';
import valueSimilarityJson from './value-similarity.v2.json';
import { candidateSchema, diagnosticAssetSchema, diagnosticQuestionSchema } from '../../features/wedding-band/schemas';
import type { DiagnosticAsset, DiagnosticQuestion, WeddingBandCandidate } from '../../types/weddingBand';

export const MANIFEST_VERSION = '2.0.0' as const;

export const candidates = candidateSchema.array().parse(candidatesJson) as WeddingBandCandidate[];
export const diagnosticAssets = diagnosticAssetSchema.array().parse(diagnosticAssetsJson) as DiagnosticAsset[];
export const diagnosticQuestions = diagnosticQuestionSchema.array().parse(diagnosticQuestionsJson) as DiagnosticQuestion[];
export const copy = copyJson;
export const valueSimilarity = valueSimilarityJson as Record<string, Record<string, Record<string, number>>>;

export const candidateById: Map<string, WeddingBandCandidate> = new Map(candidates.map((item) => [item.id, item]));
export const diagnosticAssetById: Map<string, DiagnosticAsset> = new Map(diagnosticAssets.map((item) => [item.id, item]));

if (candidates.length !== 64) throw new Error(`Expected 64 wedding bands, got ${candidates.length}`);
if (diagnosticAssets.length !== 25) throw new Error(`Expected 25 diagnostic assets, got ${diagnosticAssets.length}`);
if (diagnosticQuestions.length !== 18) throw new Error(`Expected 18 diagnostic questions, got ${diagnosticQuestions.length}`);
