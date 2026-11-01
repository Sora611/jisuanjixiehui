const test = require("node:test");
const assert = require("node:assert/strict");
const { createAppServer } = require("../server");

let server;
let base;

test.before(async () => {
  server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  base = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function login(username = "2023010101", password = "demo123") {
  const response = await fetch(base + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const payload = await response.json();
  const rawCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  const cookie = rawCookies.map((item) => item.split(";")[0]).find((item) => item.startsWith("hutca_sid="));
  return { response, payload, cookie };
}

test("health endpoint is available", async () => {
  const response = await fetch(base + "/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "hutca-platform" });
});

test("public payload exposes exactly name + className for members", async () => {
  const response = await fetch(base + "/api/public");
  assert.equal(response.status, 200);
  const payload = await response.json();

  assert.equal(payload.members.length, 24);
  for (const member of payload.members) {
    assert.deepEqual(Object.keys(member).sort(), ["className", "name"]);
  }
  assert.equal(payload.users, undefined);
  assert.equal(payload.homeworks, undefined);
  assert.ok(!JSON.stringify(payload).includes("hash"));
  assert.ok(!JSON.stringify(payload).includes("salt"));
});

test("homework requires login", async () => {
  const response = await fetch(base + "/api/homework");
  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.error.code, "AUTH_REQUIRED");
});

test("invalid password is rejected with a generic message", async () => {
  const { response, payload } = await login("2023010101", "wrong-password");
  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "INVALID_CREDENTIALS");
  assert.equal(payload.error.message, "学号或密码不正确");
});

test("student sees only homework for their own class", async () => {
  const { response, payload, cookie } = await login("2023010101", "demo123");
  assert.equal(response.status, 200);
  assert.deepEqual(payload.member, { name: "张晨", className: "计科2301" });
  assert.ok(cookie);

  const homeworkResponse = await fetch(base + "/api/homework", {
    headers: { Cookie: cookie }
  });
  assert.equal(homeworkResponse.status, 200);
  const homework = await homeworkResponse.json();

  assert.equal(homework.member.className, "计科2301");
  assert.equal(homework.homeworks.length, 2);
  assert.ok(homework.homeworks.every((item) => item.className === "计科2301"));
  assert.ok(homework.homeworks.every((item) => ["open", "soon", "closed"].includes(item.status)));
});

test("another class gets a different homework set", async () => {
  const { cookie } = await login("2023020202", "demo123");
  const response = await fetch(base + "/api/homework", {
    headers: { Cookie: cookie }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.member.className, "软工2302");
  assert.equal(payload.homeworks.length, 2);
  assert.ok(payload.homeworks.every((item) => item.className === "软工2302"));
  assert.ok(!payload.homeworks.some((item) => item.className === "计科2301"));
});

test("logout invalidates the session", async () => {
  const { cookie } = await login("2023030303", "demo123");
  const logoutResponse = await fetch(base + "/api/logout", {
    method: "POST",
    headers: { Cookie: cookie }
  });
  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers.get("set-cookie") || "", /Max-Age=0/);

  const response = await fetch(base + "/api/homework", {
    headers: { Cookie: cookie }
  });
  assert.equal(response.status, 401);
});

test("SPA entry is served with security headers", async () => {
  const response = await fetch(base + "/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/html/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
});

test("unknown API returns JSON 404", async () => {
  const response = await fetch(base + "/api/nope");
  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.error.code, "API_NOT_FOUND");
});

test("path traversal does not expose data files", async () => {
  const response = await fetch(base + "/assets/../../data/users.json");
  assert.equal(response.status, 404);
  const text = await response.text();
  assert.ok(!text.includes("salt"));
});
