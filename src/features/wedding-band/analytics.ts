type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: string, payload: AnalyticsPayload = {}) {
  const detail = { event, ...payload, at: new Date().toISOString() };
  window.dispatchEvent(new CustomEvent('ringpick:analytics', { detail }));
  window.dataLayer?.push(detail);
}
