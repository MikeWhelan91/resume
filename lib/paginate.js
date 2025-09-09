export function dedupeAtBoundary(prev = [], next = []) {
  if (!Array.isArray(prev) || !Array.isArray(next)) return [prev, next];
  if (!prev.length || !next.length) return [prev, next];
  const last = prev[prev.length - 1];
  const first = next[0];
  const isEqual = last === first;
  const deepEqual = !isEqual &&
    typeof last === 'object' && typeof first === 'object' &&
    JSON.stringify(last) === JSON.stringify(first);
  return isEqual || deepEqual ? [prev, next.slice(1)] : [prev, next];
}
