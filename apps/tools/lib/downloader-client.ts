import {
  DOWNLOADER_CLIENT_ID_HEADER,
  DOWNLOADER_CLIENT_ID_STORAGE_KEY,
} from "./downloader-contract.js";

function createDownloaderClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateDownloaderClientId(
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): string {
  if (!storage) {
    return createDownloaderClientId();
  }

  try {
    const existing = storage.getItem(DOWNLOADER_CLIENT_ID_STORAGE_KEY)?.trim();
    if (existing) {
      return existing;
    }
  } catch {
    return createDownloaderClientId();
  }

  const nextId = createDownloaderClientId();

  try {
    storage.setItem(DOWNLOADER_CLIENT_ID_STORAGE_KEY, nextId);
  } catch {
    return nextId;
  }

  return nextId;
}

export function createDownloaderRequestHeaders(
  init?: HeadersInit,
): Headers {
  const headers = new Headers(init);
  headers.set("Content-Type", "application/json");
  headers.set(DOWNLOADER_CLIENT_ID_HEADER, getOrCreateDownloaderClientId());
  return headers;
}
