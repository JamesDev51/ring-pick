import type { RingSessionV1 } from '../../types/ring';
import { MANIFEST_VERSION } from '../../data/ring';
import { sessionSchema } from './schemas';
export const STORAGE_KEY='ringpick.session.v1'; const MAX_AGE=90*24*60*60*1000;
export function loadSession():RingSessionV1|undefined{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;const parsed=sessionSchema.safeParse(JSON.parse(raw));if(!parsed.success){localStorage.removeItem(STORAGE_KEY);return;}const s=parsed.data as RingSessionV1;if(s.manifestVersion!==MANIFEST_VERSION||Date.now()-new Date(s.updatedAt).getTime()>MAX_AGE){localStorage.removeItem(STORAGE_KEY);return;}return s;}catch{return;}}
export function saveSession(s:RingSessionV1){localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}
export function clearSession(){try{localStorage.removeItem(STORAGE_KEY);}catch{/* memory-only fallback */}}
