const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

const SESSION_COOKIE = "hutca_sid";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function verifyPassword(password, salt, expectedHash) {
  if (typeof password !== "string" || typeof salt !== "string" || typeof expectedHash !== "string") {
    return false;
  }
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      // 畸形 cookie 不应当让整个请求 500，按原值保留即可。
      out[key] = value;
    }
  }
  return out;
}

function createSessionStore() {
  const sessions = new Map();

  function create(user) {
    const sid = randomBytes(32).toString("hex");
    sessions.set(sid, {
      user: { username: user.username, name: user.name, className: user.className },
      expiresAt: Date.now() + SESSION_TTL_MS
    });
    return sid;
  }

  function get(sid) {
    if (!sid) return null;
    const session = sessions.get(sid);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      sessions.delete(sid);
      return null;
    }
    return session;
  }

  function destroy(sid) {
    if (sid) sessions.delete(sid);
  }

  function cleanup() {
    const now = Date.now();
    for (const [sid, session] of sessions) {
      if (session.expiresAt <= now) sessions.delete(sid);
    }
  }

  const timer = setInterval(cleanup, 10 * 60 * 1000);
  timer.unref();

  return { create, get, destroy, size: () => sessions.size };
}

function sessionCookie(sid) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
}

function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

module.exports = {
  SESSION_COOKIE,
  verifyPassword,
  parseCookies,
  createSessionStore,
  sessionCookie,
  clearCookie
};
