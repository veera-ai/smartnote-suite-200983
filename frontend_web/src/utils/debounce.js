/**
 * Creates a debounced function that delays invoking fn until after waitMs have elapsed.
 */
// PUBLIC_INTERFACE
export function debounce(fn, waitMs) {
  /** Debounce utility to reduce frequency of expensive actions. */
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}
