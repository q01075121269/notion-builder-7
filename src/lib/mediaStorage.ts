// src/lib/mediaStorage.ts
// 대용량 미디어 (Base64/Blob) 1계층 IndexedDB 캐시 저장소 헬퍼

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface MediaItem {
  id: string;
  type: MediaType;
  dataUrl: string;
  prompt?: string;
  createdAt: number;
}

const DB_NAME = 'MediaLabDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * 미디어 에셋 저장 (saveMediaItem)
 */
export async function saveMediaItem(item: {
  id?: string;
  type: MediaType;
  dataUrl: string;
  prompt?: string;
  createdAt?: number;
}): Promise<MediaItem> {
  const db = await openDB();
  const mediaItem: MediaItem = {
    id: item.id || `media-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: item.type,
    dataUrl: item.dataUrl,
    prompt: item.prompt || '',
    createdAt: item.createdAt || Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(mediaItem);

    req.onsuccess = () => {
      resolve(mediaItem);
    };

    req.onerror = () => {
      reject(req.error || new Error('Failed to save media item to IndexedDB'));
    };
  });
}

/**
 * 최근 미디어 에셋 목록 조회 (getRecentMediaItems)
 */
export async function getRecentMediaItems(limit = 20): Promise<MediaItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const req = index.openCursor(null, 'prev'); // 최신순 정렬

    const results: MediaItem[] = [];

    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    req.onerror = () => {
      reject(req.error || new Error('Failed to fetch recent media items'));
    };
  });
}

/**
 * 미디어 에셋 삭제 (deleteMediaItem)
 */
export async function deleteMediaItem(id: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      resolve(true);
    };

    req.onerror = () => {
      reject(req.error || new Error(`Failed to delete media item ${id}`));
    };
  });
}
