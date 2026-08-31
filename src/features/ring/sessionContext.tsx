import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type PropsWithChildren } from 'react';
import type { DiagnosticChoice, Mode, RingResult, RingSessionV1, TournamentState } from '../../types/ring';
import { MANIFEST_VERSION, questions, rings } from '../../data/ring';
import { buildBracket, recordMatch, undoLastMatch } from './bracketEngine';
import { createSeed } from './prng';
import { clearSession, loadSession, saveSession } from './storage';
import { scoreDiagnostic } from './preferenceEngine';
import { selectQuickCandidates } from './candidateSelector';

type Action =
  | { type:'START'; mode:Mode; seed:number }
  | { type:'ANSWER'; choice:DiagnosticChoice }
  | { type:'UNDO_DIAG' }
  | { type:'BEGIN_TOURNAMENT'; state:TournamentState }
  | { type:'MATCH'; winnerId:string }
  | { type:'UNDO_MATCH' }
  | { type:'RESULT'; result:RingResult }
  | { type:'RESET' }
  | { type:'RESTORE'; session:RingSessionV1 }
  | { type:'STORAGE_LIMITED' };

interface State { session?:RingSessionV1; storageLimited:boolean }

function quickTournamentPlaceholder(seed:number):TournamentState {
  return {
    roundSize:16,
    currentMatchIndex:0,
    currentRoundIds:[],
    nextRoundIds:[],
    history:[],
    initialIds:[],
    startedMatchAt:Date.now(),
  };
}

function newSession(mode:Mode, seed:number):RingSessionV1 {
  const now=new Date().toISOString();
  const campaign=typeof window!=='undefined' ? (()=>{const p=new URLSearchParams(window.location.search);return{source:p.get('utm_source')||undefined,medium:p.get('utm_medium')||undefined,name:p.get('utm_campaign')||undefined}})() : undefined;
  return {
    schemaVersion:1, manifestVersion:MANIFEST_VERSION,
    sessionId:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${seed}`, seed, mode,
    phase:mode==='quick'?'diagnostic':'tournament', startedAt:now, updatedAt:now, campaign,
    diagnostic:mode==='quick'?{index:0,answers:[]}:undefined,
    tournament:mode==='full'?buildBracket(rings.map(r=>r.id),seed):quickTournamentPlaceholder(seed),
  };
}

function reducer(state:State, action:Action):State {
  const s=state.session;
  switch(action.type){
    case 'START': return {...state,session:newSession(action.mode,action.seed)};
    case 'RESTORE': return {...state,session:action.session};
    case 'STORAGE_LIMITED': return {...state,storageLimited:true};
    case 'ANSWER': {
      if(!s?.diagnostic) return state; const q=questions[s.diagnostic.index]; if(!q) return state;
      const answers=[...s.diagnostic.answers.filter(a=>a.questionId!==q.id),{questionId:q.id,choice:action.choice,answeredAt:new Date().toISOString()}];
      return {...state,session:{...s,diagnostic:{index:Math.min(s.diagnostic.index+1,questions.length),answers},updatedAt:new Date().toISOString()}};
    }
    case 'UNDO_DIAG': {
      if(!s?.diagnostic?.answers.length) return state;
      return {...state,session:{...s,diagnostic:{index:Math.max(0,s.diagnostic.index-1),answers:s.diagnostic.answers.slice(0,-1)},updatedAt:new Date().toISOString()}};
    }
    case 'BEGIN_TOURNAMENT': return s?{...state,session:{...s,phase:'tournament',tournament:action.state,updatedAt:new Date().toISOString()}}:state;
    case 'MATCH': return s?{...state,session:{...s,tournament:recordMatch(s.tournament,action.winnerId,s.mode),updatedAt:new Date().toISOString()}}:state;
    case 'UNDO_MATCH': return s?{...state,session:{...s,tournament:undoLastMatch(s.tournament,s.mode),updatedAt:new Date().toISOString()}}:state;
    case 'RESULT': return s?{...state,session:{...s,phase:'result',result:action.result,updatedAt:new Date().toISOString()}}:state;
    case 'RESET': return {storageLimited:state.storageLimited};
    default: return state;
  }
}

interface Ctx {
  state:State; start:(m:Mode)=>void; answer:(c:DiagnosticChoice)=>void; undoDiagnostic:()=>void; beginQuickTournament:()=>void;
  chooseWinner:(id:string)=>void; undoMatch:()=>void; finish:(r:RingResult)=>void; reset:()=>void; restore:()=>RingSessionV1|undefined;
  toast?:string; showToast:(m:string)=>void;
}
const Context=createContext<Ctx|null>(null);

export function RingSessionProvider({children}:PropsWithChildren){
  const [state,dispatch]=useReducer(reducer,undefined,()=>({session:loadSession(),storageLimited:false})); const [toast,setToast]=useState<string>(); const toastTimer=useRef<number | undefined>(undefined); const storageWarned=useRef(false);
  const showToast=useCallback((m:string)=>{setToast(m);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(undefined),3000)},[]);
  useEffect(()=>()=>{if(toastTimer.current)window.clearTimeout(toastTimer.current)},[]);
  useEffect(()=>{if(!state.session)return;try{saveSession(state.session)}catch{dispatch({type:'STORAGE_LIMITED'});if(!storageWarned.current){storageWarned.current=true;showToast('이 기기에서는 이어하기가 제한돼요. 지금 테스트는 계속할 수 있어요.')}}},[state.session,showToast]);
  const start=useCallback((mode:Mode)=>dispatch({type:'START',mode,seed:createSeed()}),[]);
  const answer=useCallback((choice:DiagnosticChoice)=>dispatch({type:'ANSWER',choice}),[]);
  const undoDiagnostic=useCallback(()=>dispatch({type:'UNDO_DIAG'}),[]);
  const beginQuickTournament=useCallback(()=>{const s=state.session;if(!s?.diagnostic)return;const ids=selectQuickCandidates(rings,scoreDiagnostic(s.diagnostic.answers),s.seed);dispatch({type:'BEGIN_TOURNAMENT',state:buildBracket(ids,s.seed,true)});},[state.session]);
  const chooseWinner=useCallback((id:string)=>dispatch({type:'MATCH',winnerId:id}),[]);
  const undoMatch=useCallback(()=>dispatch({type:'UNDO_MATCH'}),[]);
  const finish=useCallback((result:RingResult)=>dispatch({type:'RESULT',result}),[]);
  const reset=useCallback(()=>{clearSession();dispatch({type:'RESET'})},[]);
  const restore=useCallback(()=>{const s=loadSession();if(s){dispatch({type:'RESTORE',session:s});return s}},[]);
  const value=useMemo(()=>({state,start,answer,undoDiagnostic,beginQuickTournament,chooseWinner,undoMatch,finish,reset,restore,toast,showToast}),[state,start,answer,undoDiagnostic,beginQuickTournament,chooseWinner,undoMatch,finish,reset,restore,toast,showToast]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// This hook intentionally shares the Provider module so reducer/context internals remain private.
// eslint-disable-next-line react-refresh/only-export-components
export function useRingSession(){const c=useContext(Context);if(!c)throw new Error('RingSessionProvider missing');return c;}
