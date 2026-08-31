import type { MatchRecord, Mode, TournamentState } from '../../types/ring';
import { seededShuffle } from './prng';

const quickWeights:Record<number,number>={16:1,8:1.15,4:1.3,2:1.5};
const fullWeights:Record<number,number>={64:1,32:1.05,16:1.1,8:1.2,4:1.35,2:1.5};
export function roundWeight(mode:Mode,size:number){return (mode==='quick'?quickWeights:fullWeights)[size]??1;}

export function buildBracket(ids:string[],seed:number,alreadySeeded=false):TournamentState{
  const initial=alreadySeeded?[...ids]:seededShuffle(ids,seed);
  return {roundSize:initial.length as TournamentState['roundSize'],currentMatchIndex:0,currentRoundIds:initial,nextRoundIds:[],history:[],initialIds:initial,startedMatchAt:Date.now()};
}
export function currentPair(s:TournamentState){const i=s.currentMatchIndex*2;return [s.currentRoundIds[i],s.currentRoundIds[i+1]] as const;}
export function totalMatchesForRound(size:number){return size/2;}
export function recordMatch(s:TournamentState,winnerId:string,mode:Mode,now=Date.now()):TournamentState{
  const [leftId,rightId]=currentPair(s); if(!leftId||!rightId||![leftId,rightId].includes(winnerId)) return s; const loserId=winnerId===leftId?rightId:leftId;
  const rec:MatchRecord={roundSize:s.roundSize,matchIndex:s.currentMatchIndex,leftId,rightId,winnerId,loserId,weight:roundWeight(mode,s.roundSize),latencyMs:Math.max(0,now-s.startedMatchAt),selectedAt:new Date(now).toISOString()};
  const next=[...s.nextRoundIds,winnerId], history=[...s.history,rec]; const roundMatches=s.currentRoundIds.length/2;
  if(s.currentMatchIndex+1<roundMatches) return {...s,currentMatchIndex:s.currentMatchIndex+1,nextRoundIds:next,history,startedMatchAt:now};
  if(s.roundSize===2) return {...s,currentMatchIndex:1,nextRoundIds:next,history,startedMatchAt:now};
  return {roundSize:(s.roundSize/2) as TournamentState['roundSize'],currentMatchIndex:0,currentRoundIds:next,nextRoundIds:[],history,initialIds:s.initialIds,startedMatchAt:now};
}
export function tournamentWinner(s:TournamentState){return s.roundSize===2&&s.currentMatchIndex>=1?s.nextRoundIds[0]:undefined;}
export function replayBracket(initialIds:string[],history:MatchRecord[],mode:Mode):TournamentState{
  let state=buildBracket(initialIds,1,true); for(const h of history){state=recordMatch(state,h.winnerId,mode,new Date(h.selectedAt).getTime());} return state;
}
export function undoLastMatch(s:TournamentState,mode:Mode):TournamentState{if(!s.history.length)return s;return replayBracket(s.initialIds,s.history.slice(0,-1),mode);}
