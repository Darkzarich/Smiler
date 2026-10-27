let isPopPending = false;
let isTraversal = false;
let restoredScrollTop: (() => number | null) | null = null;

/** The history only reports Back and Forward, so its listener marks the
 * navigation that the browser is about to start */
export function markPopState() {
  isPopPending = true;
}

export function startNavigation() {
  isTraversal = isPopPending;
  isPopPending = false;
  restoredScrollTop = null;
}

export function isHistoryTraversal() {
  return isTraversal;
}

/** A view that rebuilt its content on Back says where to scroll: the saved
 * pixel offset lands elsewhere once pictures load at a different pace. */
export function setRestoredScrollTop(top: () => number | null) {
  restoredScrollTop = top;
}

export function getRestoredScrollTop() {
  return restoredScrollTop;
}
