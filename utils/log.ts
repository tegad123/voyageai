export const VERBOSE_LOGS = false; // toggle this flag to enable verbose component logging

export function log(...args: any[]) {
  if (__DEV__ && VERBOSE_LOGS) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function warn(...args: any[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

export function error(...args: any[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
} 