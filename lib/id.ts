export function createId(prefix = 'id'): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (cryptoObj?.randomUUID) {
    try {
      return `${prefix}_${cryptoObj.randomUUID()}`;
    } catch {
      // fall through
    }
  }
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${random}`;
}

export function shortCode(seed = Math.random()): string {
  return Math.floor(seed * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6);
}
