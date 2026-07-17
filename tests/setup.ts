// Node 25 ships a built-in `localStorage` global that is broken unless the
// process is started with --localstorage-file (its setItem/getItem are not
// functions). It also shadows jsdom's working implementation under the jsdom
// test environment, so zustand's persist middleware would throw on every
// store write. Install a working in-memory shim before each test file (and
// therefore before the wizardStore module) loads. Mirrors the inline shim in
// tests/store/wizardStore.test.ts, which runs the same guard first and skips.
if (typeof globalThis.localStorage?.setItem !== 'function') {
  const mem = new Map<string, string>();
  const shim = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: shim,
    configurable: true,
    writable: true,
  });
}
