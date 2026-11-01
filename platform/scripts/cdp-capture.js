/**
 * 本地视觉验收工具：用 Edge CDP 设置真实移动端视口、截图并检查横向溢出。
 * 用法：
 * node scripts/cdp-capture.js --url http://localhost:3000/ --out docs/screenshots/home-mobile.png --width 390 --height 1600
 * 可选：--login 2023010101:demo123
 */
const fs = require("node:fs");
const path = require("node:path");

function arg(name, fallback) {
  const index = process.argv.indexOf("--" + name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const url = arg("url", "http://localhost:3000/");
  const out = path.resolve(arg("out", "docs/screenshots/capture.png"));
  const width = Number(arg("width", "1440"));
  const height = Number(arg("height", "1200"));
  const login = arg("login", "");
  const evalBefore = arg("eval-before", "");
  const evalAfter = arg("eval-after", "");
  const waitAfter = Number(arg("wait-after", "1200"));
  const inspect = arg("inspect", "");
  const fullPage = process.argv.includes("--full-page");
  const port = Number(arg("port", "9222"));
  const base = new URL(url).origin;

  let cookie = "";
  if (login) {
    const [username, password] = login.split(":");
    const response = await fetch(base + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error("Login failed: " + response.status);
    const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    const raw = cookies.find((item) => item.startsWith("hutca_sid=")) || response.headers.get("set-cookie") || "";
    cookie = raw.split(";")[0].split("=")[1] || "";
    if (!cookie) throw new Error("No session cookie returned");
  }

  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT"
  }).then((response) => response.json());

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  function send(method, params) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error("CDP timeout: " + method));
        }
      }, 15000);
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.clearBrowserCookies");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.__cdpErrors=[];addEventListener('error',function(e){window.__cdpErrors.push(String(e.message||e.error))});addEventListener('unhandledrejection',function(e){window.__cdpErrors.push(String(e.reason))});"
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 700
  });

  if (cookie) {
    await send("Network.setCookie", {
      name: "hutca_sid",
      value: cookie,
      url: base,
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    });
  }

  await send("Page.navigate", { url });
  await sleep(1400);
  if (evalBefore) {
    await send("Runtime.evaluate", { expression: evalBefore, awaitPromise: true });
    await sleep(200);
  }
  if (evalAfter) {
    await send("Runtime.evaluate", { expression: evalAfter, awaitPromise: true });
    await sleep(waitAfter);
  }
  await send("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
  await sleep(250);

  const metrics = await send("Runtime.evaluate", {
    expression: `(() => {
      const vw = window.innerWidth;
      const list = Array.from(document.querySelectorAll('body *')).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className.slice(0, 90) : '',
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width)
        };
      }).filter((x) => x.width > 0 && (x.right > vw + 2 || x.left < -2)).slice(0, 18);
      return JSON.stringify({
        url: location.href,
        innerWidth: vw,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        overflowing: list
      });
    })()`,
    returnByValue: true
  });

  if (inspect) {
    const inspected = await send("Runtime.evaluate", {
      expression: inspect,
      returnByValue: true,
      awaitPromise: true
    });
    console.log("INSPECT " + JSON.stringify(inspected.result && inspected.result.value));
  }

  let screenshot;
  if (fullPage) {
    const layout = await send("Page.getLayoutMetrics");
    const size = layout.cssContentSize;
    screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: Math.ceil(size.width),
        height: Math.ceil(size.height),
        scale: 1
      }
    });
  } else {
    screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false
    });
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(screenshot.data, "base64"));
  console.log(metrics.result.value);
  console.log("SCREENSHOT " + out);

  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
