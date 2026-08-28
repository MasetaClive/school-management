/**
 * Small client-side boundary for same-origin JSON API calls. It keeps API
 * failures from being accidentally rendered as application data while letting
 * individual pages retain control of their UI and domain-specific validation.
 */
export class ApiClientError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type ErrorPayload = { error?: unknown; message?: unknown };

function messageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const { error, message } = payload as ErrorPayload;
    if (typeof error === 'string' && error.trim()) return error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      response.ok ? 'The server returned an invalid response.' : `Request failed (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiClientError(messageFromPayload(payload, `Request failed (${response.status}).`), response.status);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
