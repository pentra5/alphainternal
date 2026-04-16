/**
 * Storage abstraction that uses Tauri's LazyStore when available,
 * and falls back to localStorage when running in a plain browser.
 */

let tauriStore: any = null;
let useFallback = false;

async function getTauriStore() {
  if (useFallback) return null;
  if (tauriStore) return tauriStore;
  try {
    const { LazyStore } = await import('@tauri-apps/plugin-store');
    tauriStore = new LazyStore('store.bin');
    return tauriStore;
  } catch {
    useFallback = true;
    return null;
  }
}

export async function getItem<T>(key: string): Promise<T | null> {
  const s = await getTauriStore();
  if (s) {
    try {
      return await s.get(key) as T;
    } catch {
      useFallback = true;
    }
  }
  // localStorage fallback
  const val = localStorage.getItem(key);
  if (val === null) return null;
  try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
}

export async function setItem(key: string, value: any): Promise<void> {
  const s = await getTauriStore();
  if (s) {
    try {
      await s.set(key, value);
      await s.save();
      return;
    } catch {
      useFallback = true;
    }
  }
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  const s = await getTauriStore();
  if (s) {
    try {
      await s.delete(key);
      await s.save();
      return;
    } catch {
      useFallback = true;
    }
  }
  localStorage.removeItem(key);
}
