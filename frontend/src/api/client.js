/**
 * Centralized API client.
 *
 * Single source of truth for:
 * - The auth token (set by AuthContext on login/logout)
 * - Auth headers on every request
 * - 401 response handling (calls onAuthExpired once, not per-request)
 *
 * This module is intentionally a simple singleton so it's easy to adapt
 * for service worker interception in a future PWA phase.
 */

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}`;

let _token = null;
let _onAuthExpired = null;
let _isHandlingExpired = false;

/**
 * Called by AuthContext whenever the token changes (login, logout, refresh).
 */
export function setAuthToken(token) {
  _token = token;
}

/**
 * Called by AuthContext to register the logout handler.
 * Only one handler is active at a time.
 */
export function setOnAuthExpired(handler) {
  _onAuthExpired = handler;
}

/**
 * Internal: handle a 401/403 response by invoking the expired callback once.
 */
function handleAuthExpired() {
  if (_isHandlingExpired) return; // debounce concurrent 401s
  _isHandlingExpired = true;
  _token = null;
  if (_onAuthExpired) {
    _onAuthExpired();
  }
}

/**
 * Resets the debounce flag. Called after logout completes.
 */
export function resetAuthExpiredFlag() {
  _isHandlingExpired = false;
}

/**
 * Authenticated fetch wrapper.
 * - Adds Authorization header automatically
 * - Intercepts 401/403 and triggers centralized logout
 * - Returns the raw Response for non-401 errors
 */
export async function authFetch(url, options = {}) {
  const headers = { ...options.headers };

  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    handleAuthExpired();
    throw new Error("AUTH_EXPIRED");
  }

  return response;
}

export { BASE_URL };
