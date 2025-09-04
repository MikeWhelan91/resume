const store = new Map();
export function cacheGet(k) {
  const v = store.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { store.delete(k); return null; }
  return v.val;
}
export function cacheSet(k, val, ttlMs = 6 * 60 * 60 * 1000) {
  store.set(k, { val, exp: Date.now() + ttlMs });
}
