import type { StoryVisualSeries } from "./story-series";

const DATABASE_NAME = "myfit-story-media";
const STORE_NAME = "story-series";
const SERIES_ID = "story-soukromi";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME))
        database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStoryVisualSeries() {
  const database = await openDatabase();
  return new Promise<StoryVisualSeries>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(SERIES_ID);
    request.onsuccess = () =>
      resolve((request.result as StoryVisualSeries | undefined) ?? {});
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveStoryVisualSeries(visuals: StoryVisualSeries) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(visuals, SERIES_ID);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
