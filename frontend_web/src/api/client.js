const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Detect the API base URL from env vars.
 * - Preferred: REACT_APP_API_BASE
 * - Fallback: REACT_APP_BACKEND_URL
 */
function getApiBaseUrl() {
  const base = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();
  return base.replace(/\/+$/, "");
}

function getWsUrl() {
  const ws = (process.env.REACT_APP_WS_URL || "").trim();
  return ws;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * An API error suitable for UI consumption.
 */
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * In-memory auth token store.
 * This intentionally does NOT persist tokens to localStorage.
 */
const tokenStore = {
  accessToken: null,
  refreshToken: null,
  user: null
};

let refreshInFlight = null;

function isUnauthed() {
  return !tokenStore.accessToken;
}

// PUBLIC_INTERFACE
export function getApiConfig() {
  /** Returns API-related runtime configuration (env-driven). */
  return {
    apiBaseUrl: getApiBaseUrl(),
    wsUrl: getWsUrl()
  };
}

// PUBLIC_INTERFACE
export function getAuthState() {
  /** Returns current auth state. */
  return {
    isAuthenticated: !isUnauthed(),
    accessToken: tokenStore.accessToken,
    refreshToken: tokenStore.refreshToken,
    user: tokenStore.user
  };
}

// PUBLIC_INTERFACE
export function setAuthTokens({ accessToken, refreshToken, user }) {
  /** Sets the in-memory auth tokens and user payload. */
  tokenStore.accessToken = accessToken || null;
  tokenStore.refreshToken = refreshToken || null;
  tokenStore.user = user || null;
}

// PUBLIC_INTERFACE
export function clearAuth() {
  /** Clears auth from memory. */
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
  tokenStore.user = null;
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new ApiError("Request timed out.", { code: "TIMEOUT" });
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function tryParseJson(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function refreshAccessTokenIfPossible() {
  if (!tokenStore.refreshToken) {
    throw new ApiError("Not authenticated.", { status: 401, code: "NO_REFRESH_TOKEN" });
  }

  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError("Backend URL not configured.", { code: "NO_API_BASE" });
  }

  // If refresh already running, await it.
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetchWithTimeout(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: tokenStore.refreshToken })
      });

      const data = await tryParseJson(res);

      if (!res.ok) {
        clearAuth();
        throw new ApiError(
          (data && data.message) || "Session expired. Please sign in again.",
          { status: res.status, code: "REFRESH_FAILED", details: data }
        );
      }

      setAuthTokens({
        accessToken: data?.accessToken,
        refreshToken: data?.refreshToken || tokenStore.refreshToken,
        user: data?.user || tokenStore.user
      });

      return tokenStore.accessToken;
    } finally {
      // Release for subsequent refresh attempts
      await sleep(0);
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Core request function with:
 * - env-based base URL
 * - auth header
 * - 401 refresh retry
 * - consistent ApiError surfaces
 */
async function request(path, { method = "GET", headers, body, auth = true } = {}) {
  const base = getApiBaseUrl();
  if (!base) {
    // Graceful fallback: allow UI to function with local-only demo states.
    throw new ApiError(
      "Backend is not configured. Set REACT_APP_API_BASE (preferred) or REACT_APP_BACKEND_URL to enable API calls.",
      { code: "NO_API_BASE" }
    );
  }

  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const finalHeaders = {
    ...(headers || {})
  };

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders["content-type"] = finalHeaders["content-type"] || "application/json";
  }

  if (auth && tokenStore.accessToken) {
    finalHeaders.authorization = `Bearer ${tokenStore.accessToken}`;
  }

  const res = await fetchWithTimeout(url, {
    method,
    headers: finalHeaders,
    body: body === undefined || body === null ? undefined : finalHeaders["content-type"] === "application/json" ? JSON.stringify(body) : body
  });

  // Attempt refresh on 401 once.
  if (res.status === 401 && auth) {
    try {
      await refreshAccessTokenIfPossible();
      // Retry with new token
      const retryHeaders = { ...(finalHeaders || {}), authorization: tokenStore.accessToken ? `Bearer ${tokenStore.accessToken}` : "" };
      const retryRes = await fetchWithTimeout(url, {
        method,
        headers: retryHeaders,
        body: body === undefined || body === null ? undefined : retryHeaders["content-type"] === "application/json" ? JSON.stringify(body) : body
      });

      if (!retryRes.ok) {
        const data = await tryParseJson(retryRes);
        throw new ApiError((data && data.message) || `Request failed (${retryRes.status}).`, {
          status: retryRes.status,
          code: "REQUEST_FAILED",
          details: data
        });
      }
      const retryData = await tryParseJson(retryRes);
      return retryData ?? (await retryRes.text());
    } catch (e) {
      throw e;
    }
  }

  if (!res.ok) {
    const data = await tryParseJson(res);
    throw new ApiError((data && data.message) || `Request failed (${res.status}).`, {
      status: res.status,
      code: "REQUEST_FAILED",
      details: data
    });
  }

  const data = await tryParseJson(res);
  return data ?? (await res.text());
}

export const apiClient = {
  // PUBLIC_INTERFACE
  async login({ email, password }) {
    /** POST /auth/login -> { accessToken, refreshToken, user } */
    return request("/auth/login", { method: "POST", auth: false, body: { email, password } });
  },

  // PUBLIC_INTERFACE
  async register({ email, password, name }) {
    /** POST /auth/register -> { accessToken, refreshToken, user } */
    return request("/auth/register", { method: "POST", auth: false, body: { email, password, name } });
  },

  // PUBLIC_INTERFACE
  async refresh({ refreshToken }) {
    /** POST /auth/refresh -> { accessToken, refreshToken?, user? } */
    return request("/auth/refresh", { method: "POST", auth: false, body: { refreshToken } });
  },

  // PUBLIC_INTERFACE
  async listNotes() {
    /** GET /notes -> Note[] */
    return request("/notes", { method: "GET" });
  },

  // PUBLIC_INTERFACE
  async createNote(note) {
    /** POST /notes -> Note */
    return request("/notes", { method: "POST", body: note });
  },

  // PUBLIC_INTERFACE
  async getNote(id) {
    /** GET /notes/:id -> Note */
    return request(`/notes/${encodeURIComponent(id)}`, { method: "GET" });
  },

  // PUBLIC_INTERFACE
  async updateNote(id, patch) {
    /** PATCH /notes/:id -> Note */
    return request(`/notes/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
  },

  // PUBLIC_INTERFACE
  async deleteNote(id) {
    /** DELETE /notes/:id -> { ok: true } */
    return request(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // PUBLIC_INTERFACE
  async aiSummarize({ text }) {
    /** POST /ai/summarize -> { summary } */
    return request("/ai/summarize", { method: "POST", body: { text } });
  },

  // PUBLIC_INTERFACE
  async aiExpand({ text }) {
    /** POST /ai/expand -> { text } */
    return request("/ai/expand", { method: "POST", body: { text } });
  },

  // PUBLIC_INTERFACE
  async aiTitle({ text }) {
    /** POST /ai/title -> { title } */
    return request("/ai/title", { method: "POST", body: { text } });
  }
};
