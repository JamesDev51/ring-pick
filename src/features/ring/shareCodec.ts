import type { Ring, RingAttributes } from '../../types/ring';
import { ATTRIBUTE_ORDER, SHARE_TOKEN, VALUE_DOMAINS } from './constants';
import { ringById } from '../../data/ring';
const reverse=Object.fromEntries(ATTRIBUTE_ORDER.map(k=>[k,Object.fromEntries(Object.entries(SHARE_TOKEN[k]).map(([v,t])=>[t,v]))])) as Record<keyof RingAttributes,Record<string,string>>;
export function encodePreference(attrs:RingAttributes){return ATTRIBUTE_ORDER.map(k=>SHARE_TOKEN[k][attrs[k]]!).join('.');}
export function buildResultUrl(ring:Ring){const u=new URL('/result',window.location.origin);u.searchParams.set('v','1');u.searchParams.set('w',ring.id);u.searchParams.set('p',encodePreference(ring.attributes));return u.toString();}
export function decodeShared(search:string):Ring|undefined{const q=new URLSearchParams(search);if(q.get('v')!=='1')return;const ring=ringById.get(q.get('w')||'');const p=q.get('p')?.split('.');if(!ring||!p||p.length!==ATTRIBUTE_ORDER.length)return;const attrs={} as RingAttributes;for(let i=0;i<ATTRIBUTE_ORDER.length;i++){const k=ATTRIBUTE_ORDER[i]!;const token=p[i]!;const v=reverse[k][token];if(!v||!VALUE_DOMAINS[k].includes(v))return;attrs[k]=v as never;} if(ATTRIBUTE_ORDER.some(k=>attrs[k]!==ring.attributes[k]))return;return ring;}
