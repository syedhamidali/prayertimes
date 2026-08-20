import { supabase } from '@/integrations/supabase/client';

interface VisitPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

let logged = false;

/**
 * Logs the current visit (once per page load) to the backend.
 * Coordinates are only included when the visitor granted location access.
 */
export async function logVisit(coords?: VisitPayload) {
  if (logged) return;
  logged = true;

  try {
    await supabase.functions.invoke('log-visit', {
      body: {
        referrer: document.referrer || null,
        pagePath: window.location.pathname + window.location.hash,
        language: navigator.language,
        screenWidth: window.screen?.width,
        screenHeight: window.screen?.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...coords,
      },
    });
  } catch (e) {
    console.warn('visit logging failed', e);
  }
}

/** Allows a second log once precise coordinates become available. */
export function resetVisitLog() {
  logged = false;
}
