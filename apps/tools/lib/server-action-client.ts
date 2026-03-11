import {
  SERVER_ACTION_CLIENT_ID_HEADER,
  SERVER_ACTION_CLIENT_ID_STORAGE_KEY,
} from "./server-action-contract.js";

export {
  SERVER_ACTION_CLIENT_ID_HEADER,
  SERVER_ACTION_CLIENT_ID_STORAGE_KEY,
} from "./server-action-contract.js";

function createServerActionClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateServerActionClientId(
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): string {
  if (!storage) {
    return createServerActionClientId();
  }

  try {
    const existing = storage.getItem(SERVER_ACTION_CLIENT_ID_STORAGE_KEY)?.trim();
    if (existing) {
      return existing;
    }
  } catch {
    return createServerActionClientId();
  }

  const nextId = createServerActionClientId();

  try {
    storage.setItem(SERVER_ACTION_CLIENT_ID_STORAGE_KEY, nextId);
  } catch {
    return nextId;
  }

  return nextId;
}

export function createServerActionRequestHeaders(
  init?: HeadersInit,
): Headers {
  const headers = new Headers(init);
  headers.set(SERVER_ACTION_CLIENT_ID_HEADER, getOrCreateServerActionClientId());
  return headers;
}
