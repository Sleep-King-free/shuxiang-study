'use client';

import { useState } from 'react';
import { EMPTY_JOURNEY, JOURNEY_KEY, type JourneyState } from './journey-data';

function readJourney(): JourneyState {
  if (typeof window === 'undefined') return EMPTY_JOURNEY;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(JOURNEY_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      const data = raw as Partial<JourneyState>;
      if (data.records && typeof data.records === 'object' && !Array.isArray(data.records)) {
        return { ...EMPTY_JOURNEY, ...data, records: data.records };
      }
    }
  } catch {
    return EMPTY_JOURNEY;
  }
  return EMPTY_JOURNEY;
}

/**
 * Journey state lives under its own key (`heritage.js`), not in the archive.
 * The reader panel only mounts after the workspace restores, so reading the
 * key during the first render cannot clash with the server markup.
 */
export function useJourney() {
  const [state, setState] = useState<JourneyState>(readJourney);
  const [saved, setSaved] = useState(true);

  const commit = (next: JourneyState) => {
    setState(next);
    try {
      window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(next));
      setSaved(true);
      return true;
    } catch {
      setSaved(false);
      return false;
    }
  };

  return { state, saved, commit };
}
