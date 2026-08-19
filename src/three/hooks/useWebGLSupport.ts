'use client';

import { useSyncExternalStore } from 'react';

let cached: boolean | null = null;

/**
 * Probing allocates a context, so the result is memoised for the page's
 * lifetime. Support does not change while the tab is open.
 */
function getSnapshot(): boolean {
  if (cached !== null) return cached;

  const canvas = document.createElement('canvas');
  cached = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  return cached;
}

/** Support cannot change, so there is nothing to subscribe to. */
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): boolean {
  return false;
}

export function useWebGLSupport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
