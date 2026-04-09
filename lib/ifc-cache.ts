/**
 * IndexedDB cache for IFC model files.
 * Stores downloaded IFC ArrayBuffers keyed by URL, so subsequent
 * loads of the same model skip the network entirely.
 */

const DB_NAME = 'bimus-ifc-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve a cached IFC model ArrayBuffer by its URL key.
 */
export async function getCachedModel(url: string): Promise<ArrayBuffer | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(url);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

/**
 * Store an IFC model ArrayBuffer in the cache.
 */
export async function cacheModel(url: string, data: ArrayBuffer): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(data, url);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // Silently fail — caching is best-effort
        console.warn('[IFC Cache] Failed to write to cache');
    }
}

/**
 * Fetch an IFC file with a cache-first strategy.
 * 1. Check IndexedDB for cached copy
 * 2. If not found, download via fetch() and store in cache
 * 
 * @param url - The URL of the IFC file
 * @param onProgress - Optional progress callback (loaded, total)
 * @returns ArrayBuffer of the IFC file
 */
export async function fetchIfcWithCache(
    url: string,
    onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
    // 1. Try cache first
    const cached = await getCachedModel(url);
    if (cached) {
        onProgress?.(cached.byteLength, cached.byteLength);
        return cached;
    }

    // 2. Download from network
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download IFC: ${response.status} ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
        // Fallback: no streaming support
        const buffer = await response.arrayBuffer();
        await cacheModel(url, buffer);
        return buffer;
    }

    // Stream download with progress
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.byteLength;
        onProgress?.(loaded, contentLength || loaded);
    }

    // Combine chunks into single ArrayBuffer
    const combined = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }

    const buffer = combined.buffer;

    // 3. Store in cache (async, don't block)
    cacheModel(url, buffer).catch(() => {});

    return buffer;
}

/**
 * Clear all cached IFC models.
 */
export async function clearIfcCache(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        console.warn('[IFC Cache] Failed to clear cache');
    }
}
