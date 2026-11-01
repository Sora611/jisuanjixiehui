/* HUTCA Platform · single-page application */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var modalRoot = document.getElementById("modal-root");

  var state = {
    data: null,
    me: null,
    homework: null,
    loading: true,
    error: "",
    menuOpen: false,
    userMenuOpen: false,
    searchOpen: false,
    searchQuery: "",
    loginError: "",
    filters: {
      dept: "tech",
      memberClass: "all",
      materialDept: "all",
      materialType: "all",
      exchange: "professional"
    }
  };

  var NAV = [
    { path: "/", label: "首页" },
    { path: "/departments", label: "部门" },
    { path: "/members", label: "成员" },
    { path: "/homework", label: "作业" },
    { path: "/materials", label: "资料" },
    { path: "/exchange", label: "交流" }
  ];

  var ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.5 4.5"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"></path>',
    close: '<path d="m6 6 12 12M18 6 6 18"></path>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"></path>',
    user: '<circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5"></path>',
    logout: '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"></path>',
    calendar: '<rect x="3.5" y="5.5" width="17" height="15" rx="2"></rect><path d="M8 3.5v4M16 3.5v4M3.5 10h17"></path>',
    clock: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>',
    file: '<path d="M6 3.5h7l5 5V20H6z"></path><path d="M13 3.5V9h5"></path>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"></path><path d="M4 5.5V21.5M8 7h8M8 11h8"></path>',
    users: '<circle cx="9" cy="8" r="3"></circle><path d="M3.5 19c.7-3 2.6-4.5 5.5-4.5s4.8 1.5 5.5 4.5"></path><path d="M15.5 5.5a3 3 0 0 1 0 5.6M17 14.7c2.1.4 3.2 1.8 3.5 4.3"></path>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"></path>',
    layers: '<path d="m12 3 8.5 4.5L12 12 3.5 7.5z"></path><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"></path>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"></path>',
    check: '<path d="m5 12 4 4 10-10"></path>',
    chevron: '<path d="m7 10 5 5 5-5"></path>',
    external: '<path d="M14 4h6v6M20 4 10 14"></path><path d="M18 13v5H5V5h5"></path>',
    pin: '<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z"></path><circle cx="12" cy="10" r="2"></circle>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m7 9 3 3-3 3M13 15h4"></path>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"></path>',
    download: '<path d="M12 4v11M8 11l4 4 4-4M5 20h14"></path>',
    grid: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"></rect><rect x="14.5" y="3.5" width="6" height="6" rx="1"></rect><rect x="3.5" y="14.5" width="6" height="6" rx="1"></rect><rect x="14.5" y="14.5" width="6" height="6" rx="1"></rect>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"></path>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"></path>'
  };

  function icon(name, cls) {
    var path = ICON_PATHS[name] || "";
    return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + path + "</svg>";
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#0E9F8E";
  }

  function safeUrl(value) {
    try {
      var url = new URL(String(value), window.location.origin);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch (error) {
      // fall through
    }
    return "#";
  }

  function safeAsset(value) {
    var raw = String(value || "");
    if (/^assets\/[a-zA-Z0-9._-]+\.(svg|png|jpg|jpeg|webp)$/.test(raw)) {
      return "/" + raw;
    }
    return "/assets/favicon.svg";
  }

  function escapeAttr(value) {
    return esc(value).replace(/`/g, "&#96;");
  }

  function currentPath() {
    var path = window.location.pathname.replace(/\/+$/, "");
    return path || "/";
  }

  function formatDate(value) {
    var raw = String(value || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replace(/-/g, ".");
    var date = new Date(raw);
    if (Number.isNaN(date.getTime())) return esc(raw);
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai"
    }).format(date).replace(/\//g, ".");
  }

  function formatTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return esc(value);
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai"
    }).format(date).replace(/\//g, ".");
  }

  function isActive(path) {
    if (path === "/") return currentPath() === "/";
    return currentPath() === path || currentPath().indexOf(path + "/") === 0;
  }

  function api(path, options) {
    var opts = options || {};
    var headers = Object.assign({}, opts.headers || {});
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    return fetch(path, Object.assign({}, opts, {
      headers: headers,
      credentials: "same-origin"
    })).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) {
        if (!response.ok) {
          var error = new Error((payload.error && payload.error.message) || "请求失败，请稍后重试");
          error.status = response.status;
          error.code = payload.error && payload.error.code;
          throw error;
        }
        return payload;
      });
    });
  }

  function brandMark(cls) {
    return '<svg class="' + (cls || "brand-mark") + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect width="64" height="64" rx="16" fill="#0B1B2B"></rect>' +
      '<path d="M20 18v28M44 18v28M20 32h24" stroke="#7FE3D4" stroke-width="6" stroke-linecap="round"></path>' +
      '<circle cx="20" cy="18" r="4" fill="#F26A3D"></circle>' +
      '<circle cx="44" cy="46" r="4" fill="#F4C95D"></circle>' +
      "</svg>";
  }

  function updateMeta() {
    var titles = {
      "/": "湖南工学院计算机协会 · HUTCA",
      "/departments": "部门路径 · HUTCA",
      "/members": "成员名录 · HUTCA",
      "/homework": "作业区 · HUTCA",
      "/materials": "学习资料 · HUTCA",
      "/exchange": "交流与服务 · HUTCA",
      "/login": "登录 · HUTCA"
    };
    document.title = titles[currentPath()] || "页面未找到 · HUTCA";
  }

  function renderHeader() {
    var nav = NAV.map(function (item) {
      var active = isActive(item.path);
      return '<a class="nav-link' + (active ? " is-active" : "") + '" href="' + item.path + '" data-link' +
        (active ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");

    var mobile = NAV.map(function (item) {
      return '<a class="mobile-nav-link' + (isActive(item.path) ? " is-active" : "") + '" href="' + item.path + '" data-link>' +
        "<span>" + item.label + "</span>" + icon("arrow", "icon-sm") + "</a>";
    }).join("");

    var userArea = state.me
      ? '<div class="user-area">' +
        '<button class="user-button" type="button" data-action="toggle-user" aria-expanded="' + (state.userMenuOpen ? "true" : "false") + '">' +
        '<span class="user-avatar">' + esc(state.me.name.slice(0, 1)) + "</span>" +
        "<span>" + esc(state.me.name) + "</span>" +
        icon("chevron", "icon-sm") +
        "</button>" +
        (state.userMenuOpen
          ? '<div class="user-dropdown">' +
            '<div class="user-dropdown-head"><div class="user-dropdown-name">' + esc(state.me.name) + "</div>" +
            '<div class="user-dropdown-meta">' + esc(state.me.className) + " · 已登录</div></div>" +
            '<a class="menu-item" href="/homework" data-link>' + icon("file", "icon-sm") + " 我的作业</a>" +
            '<button class="menu-item" type="button" data-action="logout">' + icon("logout", "icon-sm") + " 退出登录</button>" +
            "</div>"
          : "") +
        "</div>"
      : '<a class="login-link" href="/login" data-link>' + icon("user", "icon-sm") + " 登录</a>";

    return '<header class="site-header">' +
      '<div class="container header-inner">' +
      '<a class="brand" href="/" data-link aria-label="HUTCA 首页">' + brandMark() +
      '<span><span class="brand-name">湖南工学院计算机协会</span><span class="brand-sub">HUTCA · EST. 2019</span></span></a>' +
      '<nav class="main-nav" aria-label="主导航">' + nav + "</nav>" +
      '<div class="header-actions">' +
      '<button class="icon-btn" type="button" data-action="open-search" aria-label="站内搜索">' + icon("search") + "</button>" +
      userArea +
      '<button class="icon-btn nav-toggle" type="button" data-action="toggle-menu" aria-label="打开菜单" aria-expanded="' + (state.menuOpen ? "true" : "false") + '">' +
      icon(state.menuOpen ? "close" : "menu") + "</button>" +
      "</div></div>" +
      '<div class="mobile-nav' + (state.menuOpen ? " is-open" : "") + '"><div class="container">' +
      '<div class="mobile-nav-grid">' + mobile + "</div>" +
      (state.me
        ? '<button class="mobile-nav-link" type="button" data-action="logout" style="width:100%;margin-top:8px;border:0;">退出登录 ' + icon("logout", "icon-sm") + "</button>"
        : '<a class="mobile-nav-link" href="/login" data-link style="margin-top:8px;">登录后查看我的作业 ' + icon("arrow", "icon-sm") + "</a>") +
      "</div></div></header>";
  }

  function renderFooter() {
    var a = state.data && state.data.meta.association;
    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><div class="footer-brand">' + brandMark() + '<div><div class="footer-brand-name">' + esc(a ? a.name : "湖南工学院计算机协会") + '</div><div class="footer-brand-sub">HUTCA · SINCE 2019</div></div></div>' +
      '<p class="footer-text">把技术学习拆成可以完成的路径，把项目拆成可以协作的任务，把每一次活动变成可以复盘的记录。</p></div>' +
      '<div><div class="footer-title">快速入口</div><div class="footer-links">' +
      '<a href="/departments" data-link>部门路径</a><a href="/members" data-link>成员名录</a><a href="/homework" data-link>作业区</a><a href="/materials" data-link>学习资料</a><a href="/exchange" data-link>专业交流 / 社会服务</a>' +
      "</div></div>" +
      '<div><div class="footer-title">找到我们</div><div class="footer-contact">' +
      "<span>" + icon("pin") + esc(a ? a.location : "信息楼 302") + "</span>" +
      "<span>" + icon("mail") + esc(a ? a.contact : "hutca@example.edu.cn") + "</span>" +
      "<span>" + icon("user") + "指导老师：" + esc(a ? a.advisor : "李老师") + "</span>" +
      "</div></div></div>" +
      '<div class="footer-bottom"><span>© 2026 HUTCA · 湖南工学院计算机协会</span><span>课程作业演示 · 数据为示例 · LOCAL BUILD</span></div>' +
      "</div></footer>";
  }

  function pageHero(eyebrow, title, lede, metaValue, metaLabel, crumb) {
    return '<section class="page-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="/" data-link>首页</a><span>/</span><span>' + esc(crumb || title) + "</span></div>" +
      '<div class="page-hero-grid"><div><div class="eyebrow">' + esc(eyebrow) + "</div>" +
      '<h1 class="page-title">' + esc(title) + "</h1>" +
      '<p class="page-lede">' + esc(lede) + "</p></div>" +
      (metaValue
        ? '<div class="page-meta"><strong>' + esc(metaValue) + "</strong><span>" + esc(metaLabel) + "</span></div>"
        : "") +
      "</div></div></section>";
  }

  function heroOrbit() {
    return '<svg class="orbit-svg" viewBox="0 0 520 520" aria-hidden="true">' +
      "<defs>" +
      '<radialGradient id="orbGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0E9F8E" stop-opacity=".34"></stop><stop offset="1" stop-color="#0E9F8E" stop-opacity="0"></stop></radialGradient>' +
      '<linearGradient id="orbLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FE3D4" stop-opacity=".7"></stop><stop offset="1" stop-color="#F26A3D" stop-opacity=".5"></stop></linearGradient>' +
      "</defs>" +
      '<circle cx="260" cy="260" r="210" fill="url(#orbGlow)"></circle>' +
      '<g fill="none" stroke="rgba(127,227,212,.17)"><circle cx="260" cy="260" r="230"></circle><circle cx="260" cy="260" r="168"></circle><circle cx="260" cy="260" r="106"></circle></g>' +
      '<g class="orbit-ring" fill="none" stroke="url(#orbLine)" stroke-width="1.2" stroke-dasharray="3 8"><ellipse cx="260" cy="260" rx="232" ry="138" transform="rotate(-24 260 260)"></ellipse><ellipse cx="260" cy="260" rx="192" ry="238" transform="rotate(32 260 260)"></ellipse></g>' +
      '<g class="orbit-ring reverse" fill="none" stroke="rgba(244,201,93,.3)" stroke-width="1"><ellipse cx="260" cy="260" rx="245" ry="185" transform="rotate(58 260 260)"></ellipse></g>' +
      '<g stroke="rgba(127,227,212,.28)" stroke-dasharray="2 7"><path d="M260 260 260 70M260 260 458 268M260 260 258 456M260 260 64 256"></path></g>' +
      '<g font-family="Consolas, monospace" text-anchor="middle">' +
      '<g class="orbit-node"><circle cx="260" cy="70" r="24" fill="#0B1B2B" stroke="#7FE3D4" stroke-width="1.5"></circle><text x="260" y="75" fill="#7FE3D4" font-size="9">WEB</text><text x="260" y="112" fill="#8FA5B7" font-size="8">FRONTEND</text></g>' +
      '<g class="orbit-node"><circle cx="458" cy="268" r="24" fill="#0B1B2B" stroke="#F26A3D" stroke-width="1.5"></circle><text x="458" y="273" fill="#F26A3D" font-size="9">DESIGN</text><text x="458" y="306" fill="#8FA5B7" font-size="8">PRODUCT</text></g>' +
      '<g class="orbit-node"><circle cx="258" cy="456" r="24" fill="#0B1B2B" stroke="#F4C95D" stroke-width="1.5"></circle><text x="258" y="461" fill="#F4C95D" font-size="9">ALGO</text><text x="258" y="416" fill="#8FA5B7" font-size="8">PRACTICE</text></g>' +
      '<g class="orbit-node"><circle cx="64" cy="256" r="24" fill="#0B1B2B" stroke="#7FE3D4" stroke-width="1.5"></circle><text x="64" y="261" fill="#7FE3D4" font-size="9">OPS</text><text x="64" y="294" fill="#8FA5B7" font-size="8">COMMUNITY</text></g>' +
      "</g>" +
      '<g><path d="M260 176 328 214V290L260 328 192 290V214Z" fill="#0B1B2B" stroke="#7FE3D4" stroke-width="1.8"></path>' +
      '<path d="M260 188 316 218V286L260 316 204 286V218Z" fill="none" stroke="rgba(242,106,61,.55)" stroke-width="1"></path>' +
      '<text x="260" y="251" text-anchor="middle" fill="#F4F1E9" font-family="Consolas, monospace" font-size="24" font-weight="700">HUTCA</text>' +
      '<text x="260" y="274" text-anchor="middle" fill="#7FE3D4" font-family="Consolas, monospace" font-size="8" letter-spacing="3">EST. 2019</text></g>' +
      '<g fill="#7FE3D4"><circle cx="260" cy="40" r="3"></circle><circle cx="488" cy="268" r="3"></circle><circle cx="258" cy="488" r="3"></circle><circle cx="34" cy="256" r="3"></circle></g>' +
      "</svg>";
  }

  function renderHome() {
    var data = state.data;
    var a = data.meta.association;
    var timeline = data.meta.timeline;
    var pro = data.exchange.professional;
    var service = data.exchange.service;
    var latest = [pro.activities[0], pro.activities[1], service.activities[0]];

    var stats = a.stats.map(function (item) {
      return '<div><div class="hero-stat-value">' + esc(item.value) + '</div><div class="hero-stat-label">' + esc(item.label) + "</div></div>";
    }).join("");

    var facts = a.facts.map(function (item) {
      return '<div class="fact-row"><span class="fact-label">' + esc(item.label) + '</span><span class="fact-value">' + esc(item.value) + "</span></div>";
    }).join("");

    var timelineHtml = timeline.map(function (item) {
      return '<div class="timeline-item" data-reveal><div class="timeline-year">' + esc(item.year) + "." + esc(item.month) + '</div><div class="timeline-title">' + esc(item.title) + '</div><div class="timeline-text">' + esc(item.text) + "</div></div>";
    }).join("");

    var modules = [
      { n: "01", title: "部门路径", desc: "四个部门分别做什么、要学什么、这学期有哪些任务。", href: "/departments", icon: "layers", tint: "var(--teal-soft)", ink: "#087567" },
      { n: "02", title: "本周作业", desc: "登录后只看自己班级的作业、要求与截止时间。", href: "/homework", icon: "file", tint: "var(--orange-soft)", ink: "#b6421f" },
      { n: "03", title: "学习资料", desc: "按部门和方向整理的学习路线、文档、模板与清单。", href: "/materials", icon: "book", tint: "var(--yellow-soft)", ink: "#7d5a00" },
      { n: "04", title: "交流与服务", desc: "专业交流、社会服务、活动记录和可以加入的项目。", href: "/exchange", icon: "users", tint: "var(--blue-soft)", ink: "#1f5487" }
    ].map(function (item) {
      return '<a class="module-card" href="' + item.href + '" data-link data-reveal style="--module-tint:' + item.tint + ';--module-ink:' + item.ink + ';">' +
        '<div class="module-top"><span class="module-number">' + item.n + " / ENTRY</span><span class=\"module-icon\">" + icon(item.icon) + "</span></div>" +
        '<div class="module-title">' + esc(item.title) + "</div>" +
        '<div class="module-desc">' + esc(item.desc) + "</div>" +
        '<span class="module-arrow">进入模块 ' + icon("arrow", "icon-sm") + "</span></a>";
    }).join("");

    return '<section class="hero"><div class="container"><div class="hero-grid">' +
      '<div class="hero-copy"><div class="hero-eyebrow">HUNAN INSTITUTE OF TECHNOLOGY · COMPUTER ASSOCIATION</div>' +
      '<h1 class="hero-title"><span class="line">让每一行代码，</span><span class="line">都找到<span class="accent">同伴</span>。</span></h1>' +
      '<p class="hero-lede">' + esc(a.slogan) + ' 这里是湖南工学院计算机协会的信息入口：协会是什么、部门怎么选、这周交什么、资料去哪找，一次说清。</p>' +
      '<div class="hero-actions"><a class="btn btn-light" href="#about">认识协会 ' + icon("arrow", "icon-sm") + '</a>' +
      '<a class="btn btn-outline-light" href="/homework" data-link>查看我的作业 ' + icon("arrow", "icon-sm") + "</a></div>" +
      '<div class="hero-stats">' + stats + "</div></div>" +
      '<div class="hero-visual">' + heroOrbit() +
      '<div class="hero-note"><strong>THIS WEEK</strong>登录后只看自己班级的作业，不把别人的截止时间当成自己的。</div></div>' +
      "</div></div></section>" +

      '<section class="section" id="about"><div class="container">' +
      '<div class="section-head"><div class="section-index">01 / ABOUT</div>' +
      '<h2 class="section-title section-title--compact">不是一个群，<br>是一套成长路径。</h2>' +
      '<p class="section-lede">协会成立于 2019 年，2023 年完成学院层面重组。我们想把“散在群里和学长嘴里”的信息，整理成一条新人能走的路。</p></div>' +
      '<div class="about-grid"><div class="about-copy"><p class="lead">' + esc(a.intro) + "</p>" +
      "<p>" + esc(a.mission) + "</p>" +
      '<p>从部门学习目标、每周作业，到学习资料和专业交流，这个平台不替你学习，但会告诉你下一步往哪走。</p>' +
      '<div class="signature"><span class="signature-line"></span><span>HUTCA · 2019—2026 · 把技术带进现场</span></div></div>' +
      '<aside class="fact-card" data-reveal><div class="fact-card-head"><span>ASSOCIATION CARD</span><span class="mono">NO. 001</span></div>' +
      '<div class="fact-list">' + facts + "</div>" +
      '<div class="fact-note">协会信息、成员与活动数据为课程项目示例，可在 <span class="mono">data/db.json</span> 中替换为真实资料。</div></aside></div>' +
      "</div></section>" +

      '<section class="section bordered"><div class="container">' +
      '<div class="section-head"><div class="section-index">02 / TIMELINE</div><h2 class="section-title">协会大事记</h2><p class="section-lede">从两个技术社团合并，到成为一个有部门、有项目、有记录的协会。</p></div>' +
      '<div class="timeline">' + timelineHtml + "</div></div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div class="section-index">03 / START HERE</div><h2 class="section-title">第一次来，<br>从这四个入口开始。</h2><p class="section-lede">不用先认识所有人。先知道自己要去哪，再决定找谁。</p></div>' +
      '<div class="module-grid">' + modules + "</div></div></section>" +

      '<section class="section bordered"><div class="container">' +
      '<div class="section-head"><div class="section-index">04 / LATEST</div><h2 class="section-title">最近发生</h2><p class="section-lede">活动记录不是流水账：有日期、有地点、有结果，也有下一次可以加入的项目。</p></div>' +
      '<div class="activity-grid">' + latest.map(function (activity, index) {
        return activityCard(activity, index === 2 ? "service" : "professional");
      }).join("") + "</div>" +
      '<div style="margin-top:20px;"><a class="btn btn-ghost btn-sm" href="/exchange" data-link>查看全部活动记录 ' + icon("arrow", "icon-sm") + "</a></div>" +
      "</div></section>" +

      '<section class="section"><div class="container"><div class="onboarding">' +
      '<div><div class="eyebrow">FIRST VISIT</div><h2 class="section-title" style="margin-top:12px;">三步，找到你的位置。</h2>' +
      '<div class="steps" style="margin-top:26px;">' +
      '<a class="step" href="/departments" data-link><span class="step-number">01</span><span><span class="step-title">先看部门</span><span class="step-text">选一个你愿意投入的方向，不急着给自己贴标签。</span></span>' + icon("arrow", "step-arrow") + "</a>" +
      '<a class="step" href="/homework" data-link><span class="step-number">02</span><span><span class="step-title">再看作业</span><span class="step-text">登录后只显示你所在班级的作业和截止时间。</span></span>' + icon("arrow", "step-arrow") + "</a>" +
      '<a class="step" href="/materials" data-link><span class="step-number">03</span><span><span class="step-title">最后找资料</span><span class="step-text">按方向拿学习路线，别从收藏夹里吃灰。</span></span>' + icon("arrow", "step-arrow") + "</a>" +
      "</div></div>" +
      '<aside class="cta-panel" data-reveal><div class="eyebrow">OPEN TO NEWCOMERS</div><div class="cta-title">不知道从哪开始？<br>先看四个部门。</div><p class="cta-text">技术、设计、新媒体、组织运营。每个部门都有明确的学习目标和任务清单，先看再选。</p><a class="btn btn-light" href="/departments" data-link>打开部门路径 ' + icon("arrow", "icon-sm") + "</a></aside>" +
      "</div></div></section>";
  }

  function activityCard(activity, tab) {
    return '<a class="activity-card" href="/exchange" data-link data-exchange-tab="' + tab + '" data-reveal>' +
      '<span class="media-frame"><img src="' + safeAsset(activity.image) + '" alt="' + escapeAttr(activity.title) + '" loading="lazy" width="800" height="560"></span>' +
      '<div class="activity-body"><div class="activity-meta"><span class="pill ' + (tab === "service" ? "pill-orange" : "pill-teal") + '">' + esc(activity.tag) + "</span><span>" + formatDate(activity.date) + "</span><span>" + esc(activity.place) + "</span></div>" +
      '<div class="activity-title">' + esc(activity.title) + "</div>" +
      '<p class="activity-summary">' + esc(activity.summary) + "</p></div></a>";
  }

  function renderDepartments() {
    var data = state.data;
    var valid = data.departments.some(function (item) { return item.id === state.filters.dept; });
    if (!valid) state.filters.dept = data.departments[0].id;
    var current = data.departments.find(function (item) { return item.id === state.filters.dept; }) || data.departments[0];

    var tabs = data.departments.map(function (d, index) {
      return '<button class="dept-tab' + (d.id === current.id ? " is-active" : "") + '" type="button" data-action="set-dept" data-id="' + esc(d.id) + '" style="--dept-color:' + safeColor(d.color) + ';">' +
        '<span class="dept-tab-index">0' + (index + 1) + '</span><span class="dept-tab-name">' + esc(d.name) + "</span>" + icon("arrow", "dept-tab-arrow icon-sm") + "</button>";
    }).join("");

    var responsibilities = current.responsibilities.map(function (item) {
      return '<li class="check-item"><span class="check-mark">' + icon("check") + "</span><span>" + esc(item) + "</span></li>";
    }).join("");

    var learning = current.learningGoals.map(function (item) {
      return '<li class="check-item"><span class="check-mark">' + icon("check") + "</span><span>" + esc(item) + "</span></li>";
    }).join("");

    var tasks = current.tasks.map(function (task, index) {
      return '<div class="task-item"><span class="task-index">' + String(index + 1).padStart(2, "0") + '</span><div><div class="task-title">' + esc(task.title) + '</div><div class="task-text">' + esc(task.text) + '</div></div><span class="task-level">' + esc(task.level) + "</span></div>";
    }).join("");

    return pageHero("DEPARTMENT PATHS", "部门路径", "四个部门，不是四个标签。先看目标、责任、学习路径和任务清单，再决定把时间放在哪里。", data.departments.length, "DEPARTMENTS", "部门") +
      '<section class="section"><div class="container"><div class="departments-layout">' +
      '<aside class="dept-tabs" aria-label="部门列表">' + tabs + "</aside>" +
      '<article class="dept-panel" style="--dept-color:' + safeColor(current.color) + ';" data-reveal>' +
      '<div class="dept-banner"><div class="dept-banner-top"><span class="eyebrow">' + esc(current.short) + ' / DEPARTMENT</span><span class="dept-count">LEAD · ' + esc(current.lead) + "<br>" + esc(current.memberCount) + ' MEMBERS</span></div>' +
      '<h2 class="dept-title">' + esc(current.name) + '</h2><p class="dept-goal">' + esc(current.goal) + "</p></div>" +
      '<div class="dept-body"><p class="muted" style="font-size:13px;line-height:1.9;">' + esc(current.summary) + "</p>" +
      '<div class="dept-grid" style="margin-top:26px;"><div><div class="block-label">负责什么 / RESPONSIBILITY</div><ul class="check-list">' + responsibilities + "</ul></div>" +
      '<div><div class="block-label">学习目标 / LEARNING</div><ul class="check-list">' + learning + "</ul></div></div>" +
      '<div style="margin-top:30px;"><div class="block-label">任务清单 / TASKS</div><div class="task-list">' + tasks + "</div></div>" +
      '<div class="recruit-box"><div><div class="eyebrow">RECRUIT</div><div class="recruit-title">' + esc(current.name) + ' · 招新介绍</div><p class="recruit-text">' + esc(current.recruit) + "</p></div>" +
      '<a class="btn btn-dark btn-sm" href="/materials" data-link>从学习资料开始 ' + icon("arrow", "icon-sm") + "</a></div>" +
      "</div></article></div></div></section>";
  }

  function renderMembers() {
    var members = state.data.members.slice();
    var classes = Array.from(new Set(members.map(function (item) { return item.className; }))).sort(function (a, b) {
      return a.localeCompare(b, "zh-CN");
    });
    if (state.filters.memberClass !== "all" && classes.indexOf(state.filters.memberClass) === -1) {
      state.filters.memberClass = "all";
    }

    var filtered = members.filter(function (item) {
      return state.filters.memberClass === "all" || item.className === state.filters.memberClass;
    }).sort(function (a, b) {
      var byClass = a.className.localeCompare(b.className, "zh-CN");
      return byClass || a.name.localeCompare(b.name, "zh-CN");
    });

    var chips = '<button class="chip' + (state.filters.memberClass === "all" ? " is-active" : "") + '" type="button" data-action="set-member-class" data-value="all">全部班级 <span class="mono">' + members.length + "</span></button>" +
      classes.map(function (className) {
        var count = members.filter(function (item) { return item.className === className; }).length;
        return '<button class="chip' + (state.filters.memberClass === className ? " is-active" : "") + '" type="button" data-action="set-member-class" data-value="' + esc(className) + '">' + esc(className) + ' <span class="mono">' + count + "</span></button>";
      }).join("");

    var rows = filtered.map(function (item) {
      return '<tr><td><span class="member-name">' + esc(item.name) + '</span></td><td class="member-class">' + esc(item.className) + "</td></tr>";
    }).join("");

    return pageHero("MEMBER DIRECTORY", "成员名录", "只展示姓名和班级。没有学号、手机号、邮箱，也不按部门给人贴标签。", members.length, "MEMBERS", "成员") +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar"><span class="filter-label">按班级筛选</span>' + chips + "</div>" +
      '<div class="directory-wrap" data-reveal><table class="directory"><caption class="sr-only">协会成员名单，仅包含姓名与班级</caption><thead><tr><th scope="col">姓名</th><th scope="col" style="text-align:right;">班级</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="2"><div class="empty-state"><div class="empty-title">这个班级还没有成员记录</div><div class="empty-text">换一个班级筛选看看。</div></div></td></tr>') +
      '</tbody></table><div class="directory-foot"><span>仅展示姓名与班级 · 不公开联系方式</span><span class="mono">' + filtered.length + " / " + members.length + " SHOWN</span></div></div>" +
      "</div></section>";
  }

  function renderLoginForm(title, sub) {
    var error = state.loginError
      ? '<div class="form-error is-visible" role="alert">' + esc(state.loginError) + "</div>"
      : '<div class="form-error" role="alert"></div>';

    return '<div class="login-card"><h2>' + esc(title || "登录") + '</h2><p class="sub">' + esc(sub || "使用协会发放的学号与密码登录。") + "</p>" +
      '<form class="login-form" data-login-form data-redirect="/homework" novalidate>' +
      '<div class="form-field"><label class="form-label" for="login-username">学号</label><input class="form-input" id="login-username" name="username" inputmode="numeric" autocomplete="username" placeholder="例如 2023010101" required></div>' +
      '<div class="form-field"><label class="form-label" for="login-password">密码</label><input class="form-input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="演示密码 demo123" required></div>' +
      error +
      '<button class="btn btn-primary btn-block" type="submit">登录 ' + icon("arrow", "icon-sm") + "</button></form>" +
      '<div class="demo-box"><div class="demo-title">DEMO ACCOUNTS · 点击填入</div><div class="demo-accounts">' +
      '<button class="demo-account" type="button" data-action="fill-demo" data-username="2023010101" data-password="demo123"><span>2023010101 · 张晨</span><span>计科2301</span></button>' +
      '<button class="demo-account" type="button" data-action="fill-demo" data-username="2023020202" data-password="demo123"><span>2023020202 · 李雨</span><span>软工2302</span></button>' +
      '<button class="demo-account" type="button" data-action="fill-demo" data-username="2023030303" data-password="demo123"><span>2023030303 · 许博</span><span>网络2301</span></button>' +
      "</div></div></div>";
  }

  function homeworkStatus(hw) {
    var status = hw.status;
    var days = hw.daysLeft;
    if (!status) {
      var diff = new Date(hw.deadline).getTime() - Date.now();
      status = diff < 0 ? "closed" : diff <= 3 * 86400000 ? "soon" : "open";
      days = Math.max(0, Math.ceil(diff / 86400000));
    }
    if (status === "closed") return { label: "已截止", cls: "closed", days: 0 };
    if (status === "soon") return { label: "还剩 " + days + " 天", cls: "soon", days: days };
    return { label: "还剩 " + days + " 天", cls: "open", days: days };
  }

  function homeworkCard(hw, index) {
    var status = homeworkStatus(hw);
    var requirements = hw.requirements.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("");
    var resources = hw.resources.map(function (item) {
      return '<a class="hw-link" href="' + safeUrl(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.label) + icon("external", "icon-sm") + "</a>";
    }).join("");
    return '<article class="homework-card" data-reveal><div class="hw-top"><span class="hw-index">ASSIGNMENT / ' + String(index + 1).padStart(2, "0") + '</span><span class="hw-status ' + status.cls + '"><span class="dot"></span>' + esc(status.label) + "</span></div>" +
      '<h2 class="hw-title">' + esc(hw.title) + '</h2><div class="hw-course">' + esc(hw.course) + " · " + esc(hw.department) + "</div>" +
      '<p class="hw-summary">' + esc(hw.summary) + "</p>" +
      '<div class="hw-deadline">' + icon("calendar") + "截止 " + esc(formatTime(hw.deadline)) + " · " + esc(hw.className) + " 可见</div>" +
      '<div class="hw-section-label">REQUIREMENTS / 要求</div><ul class="hw-requirements">' + requirements + "</ul>" +
      (resources ? '<div class="hw-links">' + resources + "</div>" : "") +
      '<div class="hw-note"><strong>不接收在线提交。</strong> ' + esc(hw.note) + "</div></article>";
  }

  function renderHomework() {
    var content;
    if (!state.me) {
      content = '<div class="login-gate"><div class="gate-copy"><div class="eyebrow">PRIVATE AREA / LOGIN REQUIRED</div><div class="gate-title">作业只给<br>自己班级的人看。</div><p class="gate-text">登录后，平台会按你的班级匹配作业。你看不到别人的作业，别人也看不到你的。这个平台不接收在线提交，只负责把内容和截止时间说清楚。</p><div class="gate-points"><div class="gate-point">' + icon("lock") + "<span>按班级隔离，不做“全校作业大厅”</span></div><div class=\"gate-point\">" + icon("calendar") + "<span>截止时间自动标成进行中 / 即将截止 / 已截止</span></div><div class=\"gate-point\">" + icon("file") + "<span>只展示作业要求、资料链接和提交说明</span></div></div></div>" +
        renderLoginForm("登录后查看我的作业", "演示账号已经填好，点一下就能进入。") + "</div>";
    } else if (!state.homework) {
      content = '<div class="empty-state"><div class="empty-icon">' + icon("file") + '</div><div class="empty-title">正在读取你的作业</div><div class="empty-text">如果长时间没有内容，请刷新页面。</div></div>';
    } else if (state.homework.length === 0) {
      content = '<div class="empty-state"><div class="empty-icon">' + icon("check") + '</div><div class="empty-title">' + esc(state.me.className) + ' 暂时没有布置作业</div><div class="empty-text">有新作业时会出现在这里。</div></div>';
    } else {
      content = '<div class="homework-head"><div><div class="homework-head-title">' + esc(state.me.className) + ' · 我的作业</div><div class="homework-head-meta">只显示你所在班级的作业 · 共 ' + state.homework.length + " 项</div></div><a class=\"btn btn-ghost btn-sm\" href=\"/materials\" data-link>去学习资料 " + icon("arrow", "icon-sm") + "</a></div>" +
        '<div class="homework-grid">' + state.homework.map(homeworkCard).join("") + "</div>" +
        '<p class="muted" style="margin-top:18px;font-size:11px;line-height:1.8;">权限说明：作业接口需要登录；服务端按 <span class="mono">className</span> 过滤，前端不会拿到其他班级的数据。平台不提供在线提交。</p>';
    }

    return pageHero("MY ASSIGNMENTS", "作业区", "内容、要求、截止时间。登录后只看自己班级的作业，不把别人的进度当成自己的。", state.me ? state.me.className : "LOCKED", state.me ? "YOUR CLASS" : "LOGIN REQUIRED", "作业") +
      '<section class="section"><div class="container">' + content + "</div></section>";
  }

  function materialCard(item) {
    return '<article class="material-card" data-reveal><div class="material-top"><span class="material-type">' + esc(item.type) + '</span><span class="material-level">' + esc(item.level) + "</span></div>" +
      '<h2 class="material-title">' + esc(item.title) + '</h2><p class="material-summary">' + esc(item.summary) + "</p>" +
      '<div class="material-meta"><span>' + icon("layers", "icon-sm") + esc(item.department) + "</span><span>" + icon("book", "icon-sm") + esc(item.direction) + "</span><span>" + icon("clock", "icon-sm") + esc(item.meta) + "</span></div>" +
      '<a class="material-link" href="' + safeUrl(item.url) + '" target="_blank" rel="noopener noreferrer">打开资料 ' + icon("external", "icon-sm") + "</a></article>";
  }

  function renderMaterials() {
    var items = state.data.materials;
    var departments = Array.from(new Set(items.map(function (item) { return item.department; })));
    var types = Array.from(new Set(items.map(function (item) { return item.type; })));
    if (state.filters.materialDept !== "all" && departments.indexOf(state.filters.materialDept) === -1) state.filters.materialDept = "all";
    if (state.filters.materialType !== "all" && types.indexOf(state.filters.materialType) === -1) state.filters.materialType = "all";

    var filtered = items.filter(function (item) {
      return (state.filters.materialDept === "all" || item.department === state.filters.materialDept) &&
        (state.filters.materialType === "all" || item.type === state.filters.materialType);
    });

    var deptChips = '<button class="chip' + (state.filters.materialDept === "all" ? " is-active" : "") + '" type="button" data-action="set-material-dept" data-value="all">全部部门</button>' +
      departments.map(function (dept) {
        return '<button class="chip' + (state.filters.materialDept === dept ? " is-active" : "") + '" type="button" data-action="set-material-dept" data-value="' + esc(dept) + '">' + esc(dept) + "</button>";
      }).join("");

    var typeChips = '<button class="chip' + (state.filters.materialType === "all" ? " is-active" : "") + '" type="button" data-action="set-material-type" data-value="all">全部类型</button>' +
      types.map(function (type) {
        return '<button class="chip' + (state.filters.materialType === type ? " is-active" : "") + '" type="button" data-action="set-material-type" data-value="' + esc(type) + '">' + esc(type) + "</button>";
      }).join("");

    return pageHero("LEARNING LIBRARY", "学习资料", "按部门和方向整理，不堆“收藏了就等于学了”的链接。每条资料都说明它解决什么问题、适合什么阶段。", items.length, "RESOURCES", "资料") +
      '<section class="section"><div class="container">' +
      '<div class="materials-filter"><div class="filter-row"><span class="filter-label">部门</span>' + deptChips + '</div><div class="filter-row"><span class="filter-label">类型</span>' + typeChips + "</div></div>" +
      '<div class="filter-bar"><span class="filter-label">' + filtered.length + " 条资料</span><span class=\"muted\" style=\"font-size:11px;\">部分为外部官方文档，会在新标签页打开</span></div>" +
      (filtered.length
        ? '<div class="material-grid">' + filtered.map(materialCard).join("") + "</div>"
        : '<div class="empty-state"><div class="empty-icon">' + icon("book") + '</div><div class="empty-title">这个筛选下还没有资料</div><div class="empty-text">换一个部门或类型试试。</div></div>') +
      '<p class="muted" style="margin-top:24px;font-size:11px;line-height:1.8;">资料由各部门维护。遇到失效链接，请在协会群反馈，不要反复收藏同一个死链。</p>' +
      "</div></section>";
  }

  function projectCard(project) {
    return '<article class="project-card" data-reveal><div class="project-top"><span class="pill ' + (project.status === "招募中" ? "pill-orange" : "pill-teal") + '">' + esc(project.status) + '</span><span class="mono muted" style="font-size:9px;">PROJECT</span></div>' +
      '<h3 class="project-title">' + esc(project.title) + '</h3><p class="project-summary">' + esc(project.summary) + "</p>" +
      '<div class="project-roles">' + project.roles.map(function (role) { return '<span class="pill pill-neutral">' + esc(role) + "</span>"; }).join("") + "</div>" +
      '<div class="project-contact">联系 · ' + esc(project.contact) + "</div></article>";
  }

  function topicRow(topic) {
    return '<div class="topic-row" data-reveal><div class="topic-date">' + formatDate(topic.date) + '</div><div><div class="topic-title">' + esc(topic.title) + '</div><div class="topic-summary">' + esc(topic.summary) + '</div><div class="topic-tags">' + topic.tags.map(function (tag) { return '<span class="pill pill-neutral">' + esc(tag) + "</span>"; }).join("") + '</div></div><div class="topic-speaker">' + esc(topic.speaker) + "</div></div>";
  }

  function renderExchange() {
    var exchange = state.data.exchange;
    if (!exchange[state.filters.exchange]) state.filters.exchange = "professional";
    var current = exchange[state.filters.exchange];
    var featured = current.activities[0];
    var rest = current.activities.slice(1);

    var tabs = '<div class="exchange-tabs" role="tablist" aria-label="交流板块">' +
      '<button class="exchange-tab' + (state.filters.exchange === "professional" ? " is-active" : "") + '" type="button" role="tab" aria-selected="' + (state.filters.exchange === "professional") + '" data-action="set-exchange" data-value="professional">专业交流</button>' +
      '<button class="exchange-tab' + (state.filters.exchange === "service" ? " is-active" : "") + '" type="button" role="tab" aria-selected="' + (state.filters.exchange === "service") + '" data-action="set-exchange" data-value="service">社会服务</button></div>';

    return pageHero("EXCHANGE & SERVICE", "交流与服务", "两个板块，同一件事：把技术带到真实的交流里，也带到真实的人身边。", "02", "SECTIONS", "交流") +
      '<section class="section"><div class="container">' + tabs +
      '<div class="exchange-intro"><div><div class="eyebrow">' + esc(current.eyebrow) + '</div><h2 class="exchange-title">' + esc(current.title) + '</h2><p class="exchange-desc">' + esc(current.intro) + "</p></div>" +
      '<div class="exchange-stats"><div class="exchange-stat"><strong>' + current.activities.length + '</strong><span>活动记录</span></div><div class="exchange-stat"><strong>' + current.projects.length + '</strong><span>可参与项目</span></div><div class="exchange-stat"><strong>' + current.topics.length + '</strong><span>交流主题</span></div></div></div>' +
      '<div class="feature-activity" data-reveal><span class="media-frame"><img src="' + safeAsset(featured.image) + '" alt="' + escapeAttr(featured.title) + '" loading="lazy" width="800" height="560"></span><div class="feature-body"><div class="activity-meta"><span class="pill ' + (state.filters.exchange === "service" ? "pill-orange" : "pill-teal") + '">' + esc(featured.tag) + "</span><span>" + formatDate(featured.date) + "</span><span>" + esc(featured.place) + "</span></div><div class=\"activity-title\">" + esc(featured.title) + '</div><p class="activity-summary">' + esc(featured.summary) + '</p><div class="highlight-row">' + featured.highlights.map(function (item) { return '<span class="pill pill-neutral">' + esc(item) + "</span>"; }).join("") + "</div></div></div>" +
      (rest.length ? '<div class="activity-grid">' + rest.map(function (item) { return activityCard(item, state.filters.exchange); }).join("") + "</div>" : "") +
      '<div class="exchange-section"><div class="exchange-section-head"><h3 class="exchange-section-title">可参与的项目</h3><span class="exchange-section-note">先看角色，再联系负责人</span></div><div class="project-list">' + current.projects.map(projectCard).join("") + "</div></div>" +
      '<div class="exchange-section"><div class="exchange-section-head"><h3 class="exchange-section-title">交流主题</h3><span class="exchange-section-note">活动后的复盘，不留在聊天记录里</span></div><div class="topic-list">' + current.topics.map(topicRow).join("") + "</div></div>" +
      '<div class="exchange-section"><div class="exchange-section-head"><h3 class="exchange-section-title">活动照片墙</h3><span class="exchange-section-note">每一张图，对应一条活动记录</span></div><div class="photo-wall">' +
      state.data.photos.map(function (photo) {
        return '<figure class="photo"><img src="' + safeAsset(photo.src) + '" alt="' + escapeAttr(photo.caption) + '" loading="lazy" width="800" height="560"><figcaption class="photo-caption">' + esc(photo.caption) + " · " + esc(photo.meta) + "</figcaption></figure>";
      }).join("") + "</div></div>" +
      "</div></section>";
  }

  function renderLogin() {
    var content = state.me
      ? '<div class="already-login"><strong>' + esc(state.me.name) + "</strong> · " + esc(state.me.className) + " 已登录。<br>你可以直接查看自己的作业，或者退出后换另一个演示账号。 </div>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;"><a class="btn btn-primary" href="/homework" data-link>查看我的作业 ' + icon("arrow", "icon-sm") + '</a><button class="btn btn-ghost" type="button" data-action="logout">退出登录</button></div>'
      : renderLoginForm("回到你的位置", "学号由协会统一发放。演示账号可以直接点击填入。") +
        '<p class="login-help">登录后只会看到自己班级的作业，不会展示其他班级的数据。平台不接收在线提交。</p>';

    return '<div class="login-page"><aside class="login-aside"><div><div class="eyebrow">MEMBER ACCESS / HUTCA</div><h1 class="login-aside-title">回到<br>你的位置。</h1><p class="login-aside-text">协会信息对所有人开放。作业区需要登录，并且只显示你所在班级的作业。这不是权限表演，是基本边界。</p></div><div class="login-aside-foot"><span>EST. 2019</span><span>4 DEPARTMENTS</span><span>24 MEMBERS</span><span>LOCAL BUILD</span></div></aside><div class="login-main"><div class="login-form-wrap"><h1 style="font-size:13px;letter-spacing:.1em;color:var(--teal);font-family:var(--mono);margin-bottom:14px;">MEMBER LOGIN</h1>' + content + "</div></div></div>";
  }

  function renderNotFound() {
    return '<div class="not-found"><div><div class="not-found-code">404 / NOT FOUND</div><h1>这个入口还没建好。</h1><p>可能是链接写错了，也可能这个页面只存在于下一版。先回首页，或者用搜索找你要的内容。</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"><a class="btn btn-primary" href="/" data-link>回到首页 ' + icon("arrow", "icon-sm") + '</a><button class="btn btn-ghost" type="button" data-action="open-search">站内搜索</button></div></div></div>';
  }

  function renderError() {
    return '<div class="not-found"><div><div class="not-found-code">CONNECTION ERROR</div><h1>平台没有加载出来。</h1><p>' + esc(state.error || "请确认本地服务已经启动，然后刷新页面。") + '</p><button class="btn btn-primary" type="button" data-action="reload">重新加载</button></div></div>';
  }

  function renderLoading() {
    return '<div class="boot-screen" style="min-height:60vh;"><div class="boot-mark">HUTCA</div><p>正在打开协会入口…</p></div>';
  }

  function renderPage() {
    if (state.loading) return renderLoading();
    if (state.error) return renderError();
    switch (currentPath()) {
      case "/": return renderHome();
      case "/departments": return renderDepartments();
      case "/members": return renderMembers();
      case "/homework": return renderHomework();
      case "/materials": return renderMaterials();
      case "/exchange": return renderExchange();
      case "/login": return renderLogin();
      default: return renderNotFound();
    }
  }

  function render() {
    updateMeta();
    if (state.loading || state.error) {
      app.innerHTML = state.loading ? renderLoading() : renderHeader() + '<main id="main">' + renderError() + "</main>" + renderFooter();
    } else {
      app.innerHTML = renderHeader() + '<main id="main">' + renderPage() + "</main>" + renderFooter();
    }
    syncModal();
    observeReveal();
  }

  var revealObserver = null;

  function observeReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    nodes.forEach(function (node) { revealObserver.observe(node); });
  }

  function navigate(href, options) {
    var opts = options || {};
    var url;
    try {
      url = new URL(href, window.location.origin);
    } catch (error) {
      return;
    }
    if (url.origin !== window.location.origin) {
      window.location.href = url.href;
      return;
    }
    var next = url.pathname + url.search + url.hash;
    var current = window.location.pathname + window.location.search + window.location.hash;
    state.menuOpen = false;
    state.userMenuOpen = false;
    state.loginError = "";
    closeSearch(false);
    if (next === current) {
      if (url.hash) {
        var target = document.querySelector(url.hash);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (opts.replace) window.history.replaceState({}, "", next);
    else window.history.pushState({}, "", next);
    render();
    if (url.hash) {
      window.requestAnimationFrame(function () {
        var target = document.querySelector(url.hash);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function rerenderPreserveScroll() {
    var y = window.scrollY;
    state.userMenuOpen = false;
    render();
    window.scrollTo(0, y);
  }

  function setFilter(key, value) {
    state.filters[key] = value;
    rerenderPreserveScroll();
  }

  function searchGroups(query) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    var groups = [];

    var depts = state.data.departments.filter(function (item) {
      return [item.name, item.short, item.goal, item.summary, item.responsibilities.join(" "), item.learningGoals.join(" ")].join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 4).map(function (item) {
      return { title: item.name, meta: item.goal, type: "部门", href: "/departments", dept: item.id };
    });
    if (depts.length) groups.push({ title: "部门", items: depts });

    var members = state.data.members.filter(function (item) {
      return (item.name + " " + item.className).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6).map(function (item) {
      return { title: item.name, meta: item.className, type: "成员", href: "/members", memberClass: item.className };
    });
    if (members.length) groups.push({ title: "成员", items: members });

    if (state.me && state.homework) {
      var homework = state.homework.filter(function (item) {
        return [item.title, item.course, item.summary, item.requirements.join(" ")].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 4).map(function (item) {
        return { title: item.title, meta: item.course + " · 截止 " + formatTime(item.deadline), type: "作业", href: "/homework" };
      });
      if (homework.length) groups.push({ title: "我的作业", items: homework });
    }

    var materials = state.data.materials.filter(function (item) {
      return [item.title, item.summary, item.department, item.direction, item.type].join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6).map(function (item) {
      return { title: item.title, meta: item.department + " · " + item.direction + " · " + item.type, type: "资料", href: "/materials", materialDept: item.department };
    });
    if (materials.length) groups.push({ title: "学习资料", items: materials });

    var exchangeItems = [];
    ["professional", "service"].forEach(function (tab) {
      var section = state.data.exchange[tab];
      section.activities.forEach(function (item) {
        if ([item.title, item.summary, item.tag, item.place].join(" ").toLowerCase().indexOf(q) !== -1) {
          exchangeItems.push({ title: item.title, meta: section.label + " · " + formatDate(item.date) + " · " + item.tag, type: "活动", href: "/exchange", exchangeTab: tab });
        }
      });
      section.projects.forEach(function (item) {
        if ([item.title, item.summary, item.roles.join(" ")].join(" ").toLowerCase().indexOf(q) !== -1) {
          exchangeItems.push({ title: item.title, meta: section.label + " · " + item.status + " · " + item.roles.join(" / "), type: "项目", href: "/exchange", exchangeTab: tab });
        }
      });
      section.topics.forEach(function (item) {
        if ([item.title, item.summary, item.tags.join(" "), item.speaker].join(" ").toLowerCase().indexOf(q) !== -1) {
          exchangeItems.push({ title: item.title, meta: section.label + " · " + item.speaker + " · " + item.tags.join(" / "), type: "主题", href: "/exchange", exchangeTab: tab });
        }
      });
    });
    if (exchangeItems.length) groups.push({ title: "交流与服务", items: exchangeItems.slice(0, 6) });

    return groups;
  }

  function searchResultLink(item) {
    var attrs = 'href="' + escapeAttr(item.href) + '" data-link';
    if (item.dept) attrs += ' data-dept="' + escapeAttr(item.dept) + '"';
    if (item.memberClass) attrs += ' data-member-class="' + escapeAttr(item.memberClass) + '"';
    if (item.materialDept) attrs += ' data-material-dept="' + escapeAttr(item.materialDept) + '"';
    if (item.exchangeTab) attrs += ' data-exchange-tab="' + escapeAttr(item.exchangeTab) + '"';
    return '<a class="search-result" ' + attrs + "><span><span class=\"search-result-title\">" + esc(item.title) + '</span><span class="search-result-meta">' + esc(item.meta) + '</span></span><span class="search-result-type">' + esc(item.type) + "</span></a>";
  }

  function searchResultsMarkup() {
    var q = state.searchQuery.trim();
    if (!q) {
      return '<div class="search-empty">输入部门、姓名、班级、资料、活动或关键词。<br><span class="mono" style="font-size:10px;">例如：技术研发部、计科2301、Git、义务维修</span></div>';
    }
    var groups = searchGroups(q);
    if (!groups.length) {
      return '<div class="search-empty">没有找到“' + esc(q) + '”。<br>试试部门名、班级、资料标题或活动关键词。</div>';
    }
    return groups.map(function (group) {
      return '<div class="search-group"><div class="search-group-title">' + esc(group.title) + '</div>' + group.items.map(searchResultLink).join("") + "</div>";
    }).join("");
  }

  function syncModal() {
    if (!state.searchOpen) {
      modalRoot.innerHTML = "";
      document.body.classList.remove("modal-open");
      return;
    }
    modalRoot.innerHTML = '<div class="search-backdrop" data-search-backdrop><div class="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">' +
      '<div class="search-top">' + icon("search") + '<input class="search-input" data-search-input type="search" value="' + escapeAttr(state.searchQuery) + '" placeholder="搜索部门、成员、作业、资料、活动…" autocomplete="off" aria-label="站内搜索"><button class="search-close" type="button" data-action="close-search" aria-label="关闭搜索">' + icon("close") + "</button></div>" +
      '<div class="search-hint"><span><kbd>Esc</kbd> 关闭</span><span><kbd>Ctrl</kbd> + <kbd>K</kbd> 打开</span><span>作业只搜索自己班级</span></div>' +
      '<div class="search-results" data-search-results>' + searchResultsMarkup() + "</div></div></div>";
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(function () {
      var input = document.querySelector("[data-search-input]");
      if (input) input.focus();
    });
  }

  function updateSearchResults() {
    var container = document.querySelector("[data-search-results]");
    if (container) container.innerHTML = searchResultsMarkup();
  }

  function openSearch() {
    state.searchOpen = true;
    state.searchQuery = "";
    state.userMenuOpen = false;
    syncModal();
  }

  function closeSearch(rerender) {
    if (!state.searchOpen) return;
    state.searchOpen = false;
    state.searchQuery = "";
    if (rerender) render();
    else syncModal();
  }

  function fillDemo(button) {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;
    form.elements.username.value = button.getAttribute("data-username") || "";
    form.elements.password.value = button.getAttribute("data-password") || "";
    form.elements.username.focus();
  }

  async function logout() {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (error) {
      // 退出失败也清空本地状态，避免界面卡在已登录。
    }
    state.me = null;
    state.homework = null;
    state.userMenuOpen = false;
    render();
    navigate("/");
  }

  async function loadHomework() {
    if (!state.me) {
      state.homework = null;
      return;
    }
    try {
      var payload = await api("/api/homework");
      state.homework = payload.homeworks || [];
    } catch (error) {
      if (error.status === 401) {
        state.me = null;
        state.homework = null;
      } else {
        state.homework = [];
      }
    }
  }

  function showLoginError(form, message) {
    state.loginError = message;
    var box = form.querySelector(".form-error");
    if (box) {
      box.textContent = message;
      box.classList.add("is-visible");
    }
    var button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = false;
      button.innerHTML = "登录 " + icon("arrow", "icon-sm");
    }
  }

  async function handleLogin(form) {
    var formData = new FormData(form);
    var username = String(formData.get("username") || "").trim();
    var password = String(formData.get("password") || "");
    var button = form.querySelector('button[type="submit"]');
    state.loginError = "";
    if (!username || !password) {
      showLoginError(form, "请输入学号和密码。");
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = "登录中…";
    }
    try {
      var payload = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username: username, password: password })
      });
      state.me = payload.member;
      state.loginError = "";
      await loadHomework();
      navigate(form.getAttribute("data-redirect") || "/homework");
    } catch (error) {
      showLoginError(form, error.message || "登录失败，请稍后重试。");
      var first = form.querySelector("[name=username]");
      if (first) first.focus();
    }
  }

  document.addEventListener("click", function (event) {
    if (state.searchOpen && event.target.matches("[data-search-backdrop]")) {
      closeSearch(true);
      return;
    }

    var link = event.target.closest("a[data-link]");
    if (link) {
      event.preventDefault();
      if (link.dataset.dept) state.filters.dept = link.dataset.dept;
      if (link.dataset.memberClass) state.filters.memberClass = link.dataset.memberClass;
      if (link.dataset.materialDept) state.filters.materialDept = link.dataset.materialDept;
      if (link.dataset.exchangeTab) state.filters.exchange = link.dataset.exchangeTab;
      navigate(link.getAttribute("href"));
      return;
    }

    var actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      if (state.userMenuOpen && !event.target.closest(".user-area")) {
        state.userMenuOpen = false;
        render();
      }
      return;
    }

    var action = actionElement.getAttribute("data-action");
    if (action === "toggle-menu") {
      state.menuOpen = !state.menuOpen;
      state.userMenuOpen = false;
      render();
    } else if (action === "toggle-user") {
      state.userMenuOpen = !state.userMenuOpen;
      render();
    } else if (action === "open-search") {
      openSearch();
    } else if (action === "close-search") {
      closeSearch(true);
    } else if (action === "fill-demo") {
      fillDemo(actionElement);
    } else if (action === "logout") {
      logout();
    } else if (action === "reload") {
      window.location.reload();
    } else if (action === "set-dept") {
      setFilter("dept", actionElement.getAttribute("data-id"));
    } else if (action === "set-member-class") {
      setFilter("memberClass", actionElement.getAttribute("data-value"));
    } else if (action === "set-material-dept") {
      setFilter("materialDept", actionElement.getAttribute("data-value"));
    } else if (action === "set-material-type") {
      setFilter("materialType", actionElement.getAttribute("data-value"));
    } else if (action === "set-exchange") {
      setFilter("exchange", actionElement.getAttribute("data-value"));
    }
  });

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("[data-login-form]");
    if (!form) return;
    event.preventDefault();
    handleLogin(form);
  });

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-search-input]")) {
      state.searchQuery = event.target.value;
      updateSearchResults();
    }
    if (event.target.closest("[data-login-form]") && state.loginError) {
      state.loginError = "";
      var errorBox = document.querySelector("[data-login-form] .form-error");
      if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.remove("is-visible");
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (state.searchOpen) closeSearch(true);
      else openSearch();
      return;
    }
    if (event.key === "Escape" && state.searchOpen) {
      closeSearch(true);
    }
  });

  window.addEventListener("popstate", function () {
    state.menuOpen = false;
    state.userMenuOpen = false;
    closeSearch(false);
    render();
  });

  async function boot() {
    try {
      var results = await Promise.all([api("/api/public"), api("/api/me")]);
      state.data = results[0];
      state.me = results[1].member;
      if (state.me) await loadHomework();
    } catch (error) {
      state.error = "请确认本地服务已经启动（node server.js），然后刷新页面。";
    }
    state.loading = false;
    render();
  }

  boot();
})();
