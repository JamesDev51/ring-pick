import ringTuplesJson from './rings.v1.json';
import questionsJson from './questions.v1.json';
import diagnosticAssetsJson from './diagnostic-assets.v1.json';
import copyJson from './copy.ko.json';
import type { DiagnosticAsset, DiagnosticQuestion, Ring, RingAttributes } from '../../types/ring';

export const MANIFEST_VERSION = '1.1.0';
const attributeKeys = ['metal','shape','size','width','finish','setting','halo','profile'] as const;
type RingTuple = [RingAttributes['metal'],RingAttributes['shape'],RingAttributes['size'],RingAttributes['width'],RingAttributes['finish'],RingAttributes['setting'],RingAttributes['halo'],RingAttributes['profile']];
function buildRing(tuple: RingTuple, index: number): Ring {
  const id=`R${String(index+1).padStart(3,'0')}`;
  const attributes=Object.fromEntries(attributeKeys.map((key,i)=>[key,tuple[i]])) as unknown as RingAttributes;
  return {id,title:tuple.join('-'),attributes,assets:{packshot:`/images/rings/candidates/${id}-pack-v1.svg`,worn:`/images/rings/candidates/${id}-worn-v1.svg`,thumb:`/images/rings/candidates/${id}-pack-v1.svg`},enabled:true,assetVersion:1};
}
export const rings = (ringTuplesJson as RingTuple[]).map(buildRing);
export const questions = questionsJson as DiagnosticQuestion[];
export const diagnosticAssets = diagnosticAssetsJson as DiagnosticAsset[];
export const copy = copyJson;
export const ringById = new Map(rings.map((ring) => [ring.id, ring]));
export const diagnosticAssetById = new Map(diagnosticAssets.map((asset) => [asset.id, asset]));
