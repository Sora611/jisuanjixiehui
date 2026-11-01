const http = require("node:http");
const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");
const { URL } = require("node:url");

const { loadData, publicPayload, homeworkForClass, publicMember } = require("./lib/data");
const {
  SESSION_COOKIE,
  verifyPassword,
  parseCookies,
  createSessionStore,
  sessionCookie,
  clearCookie
} = require("./lib/auth");

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 8 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ")
};

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(body);
}

function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

function sendText(res, status, text, extraHeaders = {}) {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(text);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("body too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return reject(Object.assign(new Error("invalid json"), { status: 400 }));
        }
        resolve(parsed);
      } catch {
        reject(Object.assign(new Error("invalid json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function createLoginLimiter() {
  const attempts = new Map();
  const WINDOW_MS = 60 * 1000;
  const MAX_ATTEMPTS = 6;

  function entry(ip) {
    const now = Date.now();
    const current = attempts.get(ip);
    if (!current || current.resetAt <= now) {
      const fresh = { count: 0, resetAt: now + WINDOW_MS };
      attempts.set(ip, fresh);
      return fresh;
    }
    return current;
  }

  return {
    canTry(ip) {
      return entry(ip).count < MAX_ATTEMPTS;
    },
    fail(ip) {
      entry(ip).count += 1;
    },
    clear(ip) {
      attempts.delete(ip);
    }
  };
}

async function serveStatic(req, res, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return sendText(res, 400, "Bad Request");
  }

  if (pathname === "/") pathname = "/index.html";
  const relative = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(PUBLIC_DIR, relative);

  if (candidate !== PUBLIC_DIR && !candidate.startsWith(PUBLIC_DIR + path.sep)) {
    return sendText(res, 403, "Forbidden");
  }

  let stat;
  try {
    stat = await fsp.stat(candidate);
  } catch {
    // SPA 路由：没有扩展名的路径回退到 index.html，静态资源缺失则 404。
    if (path.extname(pathname) === "") {
      return serveFile(req, res, path.join(PUBLIC_DIR, "index.html"), true);
    }
    return sendText(res, 404, "Not Found");
  }

  if (stat.isDirectory()) {
    return serveFile(req, res, path.join(candidate, "index.html"), true);
  }

  return serveFile(req, res, candidate, false);
}

async function serveFile(req, res, filePath, isHtml) {
  let data;
  try {
    data = await fsp.readFile(filePath);
  } catch {
    return sendText(res, 404, "Not Found");
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const cache = isHtml
    ? "no-cache"
    : ext === ".js" || ext === ".css"
      ? "no-cache"
      : "public, max-age=3600";
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    "Content-Type": type,
    "Content-Length": data.length,
    "Cache-Control": cache
  });
  if (req.method === "HEAD") {
    res.end();
  } else {
    res.end(data);
  }
}

function createAppServer() {
  const { db, users } = loadData();
  const sessions = createSessionStore();
  const limiter = createLoginLimiter();
  const publicData = publicPayload(db);

  async function handleApi(req, res, url) {
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, service: "hutca-platform" });
    }

    if (req.method === "GET" && pathname === "/api/public") {
      return sendJson(res, 200, publicData);
    }

    if (req.method === "GET" && pathname === "/api/me") {
      const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const session = sessions.get(sid);
      return sendJson(res, 200, {
        member: session ? publicMember(session.user) : null
      });
    }

    if (req.method === "POST" && pathname === "/api/login") {
      const ip = getClientIp(req);
      if (!limiter.canTry(ip)) {
        return sendError(res, 429, "TOO_MANY_ATTEMPTS", "尝试次数过多，请一分钟后再试");
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        return sendError(res, error.status || 400, "INVALID_BODY", "请求格式不正确");
      }

      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!username || !password) {
        return sendError(res, 400, "MISSING_CREDENTIALS", "请输入学号和密码");
      }

      const user = users.find((item) => item.username === username);
      if (!user || !verifyPassword(password, user.salt, user.hash)) {
        limiter.fail(ip);
        return sendError(res, 401, "INVALID_CREDENTIALS", "学号或密码不正确");
      }

      limiter.clear(ip);
      const sid = sessions.create(user);
      return sendJson(
        res,
        200,
        { member: publicMember(user) },
        { "Set-Cookie": sessionCookie(sid) }
      );
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      sessions.destroy(sid);
      return sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookie() });
    }

    if (req.method === "GET" && pathname === "/api/homework") {
      const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const session = sessions.get(sid);
      if (!session) {
        return sendError(res, 401, "AUTH_REQUIRED", "请先登录后查看作业");
      }
      return sendJson(res, 200, {
        member: publicMember(session.user),
        homeworks: homeworkForClass(db, session.user.className)
      });
    }

    return sendError(res, 404, "API_NOT_FOUND", "接口不存在");
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");

      if (url.pathname.startsWith("/api/")) {
        return await handleApi(req, res, url);
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        return sendText(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
      }

      return await serveStatic(req, res, url);
    } catch (error) {
      console.error("[server]", error);
      if (!res.headersSent) {
        sendError(res, 500, "INTERNAL_ERROR", "服务器开小差了，请稍后重试");
      } else {
        res.end();
      }
    }
  });

  return server;
}

if (require.main === module) {
  const server = createAppServer();
  server.listen(PORT, () => {
    console.log(`HUTCA platform: http://localhost:${PORT}`);
    console.log("Demo accounts: 2023010101 / 2023020202 / 2023030303  (password: demo123)");
  });
}

module.exports = { createAppServer };
