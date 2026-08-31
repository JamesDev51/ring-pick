export type RingEventName = 'landing_view'|'test_start'|'diagnostic_answer'|'round_start'|'match_answer'|'result_view'|'result_save'|'result_share'|'session_resume'|'error_view';
export function track(_name:RingEventName,_payload:Record<string,unknown>={}) {
  // Deliberate no-op for MVP. This is the only analytics boundary; no selection history or identifiers leave the browser.
}
