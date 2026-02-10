// ─── Error Handling Utilities ───

/**
 * Maps raw Tauri invoke / fetch errors into user-friendly messages.
 */
export function handleTauriError(error: unknown, context: string): string {
  const raw = error instanceof Error ? error.message : String(error);

  // Network-level errors
  if (/failed to fetch|networkerror|network request/i.test(raw)) {
    return "Check your internet connection and try again.";
  }
  if (/timeout|timed out|aborted/i.test(raw)) {
    return `${context} took too long. Please try again.`;
  }

  // Auth / API key errors
  if (/401|unauthorized|invalid.*key|invalid.*token/i.test(raw)) {
    return "Your API key may be expired or invalid. Check Accounts → Settings.";
  }
  if (/403|forbidden/i.test(raw)) {
    return "Access denied. Make sure your account has the right permissions.";
  }
  if (/404|not found/i.test(raw)) {
    return `${context}: resource not found. Check your configuration.`;
  }

  // Rate limiting
  if (/429|rate.?limit|too many requests/i.test(raw)) {
    return "Rate limited — wait a moment, then try again.";
  }

  // Server errors
  if (/5\d{2}|internal server|server error/i.test(raw)) {
    return "The remote server had an error. Try again in a few seconds.";
  }

  // Tauri-specific
  if (/invoke.*not found|plugin.*not found/i.test(raw)) {
    return "This feature requires the native desktop app.";
  }

  // Fallback: truncate overly long messages
  if (raw.length > 200) {
    return `${context} failed. ${raw.slice(0, 120)}…`;
  }

  return `${context} failed: ${raw}`;
}

/**
 * Generic retry wrapper with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 800,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await sleep(delay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Check if the browser is offline.
 */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * Creates an AbortController that auto-cancels after `ms` milliseconds.
 * Useful for streaming requests that may hang.
 */
export function createTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

// ─── Helpers ───

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
