# 03 · 架构与技术方案

## 1. 约束

- 一个人、课程作业、本地跑通，不要求公网部署。
- 数据不能写死在页面里，至少用 JSON 或 SQLite。
- 需要登录后的班级隔离，不能只靠前端隐藏。
- 不引入管理后台、在线提交、竞赛板块。
- 使用者是小白：启动步骤必须短，依赖必须少。

## 2. 技术选择

| 层 | 选择 | 理由 |
|---|---|---|
| 服务端 | Node.js 18+ 内置 `http` | 无 npm 依赖，`node server.js` 即可启动；路由和静态文件足够本项目 |
| 前端 | 原生 HTML + CSS + JavaScript | 单页应用，无需构建；代码可读，便于讲清每一块 |
| 数据 | JSON 文件 | 题目允许；数据只读，避免 SQLite 原生依赖和迁移成本 |
| 登录 | 服务端 Session + HttpOnly Cookie | 不把“已登录”交给 localStorage；权限在 API 层判断 |
| 密码 | `crypto.scryptSync` + 随机 salt | Node 内置，避免明文密码 |
| 测试 | `node:test` + `fetch` | 零依赖，能测真实 HTTP 接口和 Cookie |
| 视觉 | 原生 CSS design tokens | 无 UI 框架，避免“模板感”，也减少构建步骤 |

### 为什么不用 React / Next.js

这个项目的页面数量少、交互集中在筛选和登录，原生 JS 足够。引入 Next.js 会增加构建、路由、环境变量和部署概念，对“本地跑通 + 讲清楚”没有明显收益。真实生产项目可以换，但本期优先降低运行成本。

### 为什么不直接上数据库

`db.json` 只读，不存在并发写入；作业按班级过滤是读操作。JSON 足以让“数据不写在页面里”成立，也方便验收者直接查看数据。若后续要加管理后台，应迁移到 SQLite/PostgreSQL，并补迁移脚本和事务。

## 3. 运行结构

```text
┌──────────────────────────────┐
│ Browser                      │
│ index.html + app.js + CSS    │
│  - History API 路由           │
│  - fetch /api/*              │
│  - 渲染 / 筛选 / 搜索         │
└──────────────┬───────────────┘
               │ same-origin HTTP
┌──────────────▼───────────────┐
│ Node http server             │
│ server.js                    │
│  ├─ 安全响应头 / CSP          │
│  ├─ /api/public              │
│  ├─ /api/login /logout /me   │
│  ├─ /api/homework（鉴权）     │
│  └─ 静态文件 + SPA fallback   │
└──────────────┬───────────────┘
               │ read at boot
┌──────────────▼───────────────┐
│ data/db.json                 │
│ data/users.json              │
└──────────────────────────────┘
```

## 4. 目录结构

```text
platform/
├─ server.js                  HTTP 服务、API、静态文件、安全头
├─ lib/
│  ├─ data.js                 JSON 读取、公开字段裁剪、作业过滤
│  └─ auth.js                 scrypt 校验、Cookie、Session
├─ data/
│  ├─ db.json                 协会/部门/成员/作业/资料/交流
│  └─ users.json              演示账号 salt + hash
├─ public/
│  ├─ index.html              SPA 入口
│  ├─ app.js                  路由、组件、登录态、搜索
│  ├─ styles.css              设计系统与响应式
│  └─ assets/                 图标、活动视觉 SVG
├─ tests/api.test.js          接口测试
├─ scripts/
│  ├─ hash-password.js        生成演示账号
│  └─ cdp-capture.js          本地截图 / 横向溢出检查
├─ docs/                      需求、UI、架构、测试、Review、过程
└─ README.md
```

## 5. 数据模型

### `meta.association`

协会名称、英文名、成立时间、重组时间、简介、使命、指导老师、活动室、联系方式、统计数字、事实卡。

### `meta.timeline[]`

`year`、`month`、`title`、`text`。首页大事记。

### `departments[]`

`id`、`name`、`short`、`color`、`goal`、`summary`、`responsibilities[]`、`learningGoals[]`、`tasks[]`、`recruit`、`lead`、`memberCount`。

`tasks[]`：`title`、`level`、`text`。

### `members[]`

内部字段：`name`、`className`、`department`。
API 输出：**只有** `name`、`className`。`department` 不进入 `/api/public`。

### `homeworks[]`

`id`、`className`、`title`、`course`、`department`、`publishedAt`、`deadline`、`summary`、`requirements[]`、`resources[]`、`note`。

`resources[]`：`label`、`url`。

### `materials[]`

`id`、`title`、`department`、`direction`、`type`、`level`、`summary`、`url`、`updated`、`meta`。

### `exchange.professional` / `exchange.service`

每块包含：

- `activities[]`：`id`、`title`、`date`、`place`、`tag`、`summary`、`image`、`highlights[]`
- `projects[]`：`id`、`title`、`status`、`roles[]`、`summary`、`contact`
- `topics[]`：`id`、`title`、`speaker`、`date`、`tags[]`、`summary`

### `photos[]`

`src`、`caption`、`meta`。

## 6. API 设计

| 方法 | 路径 | 鉴权 | 返回 |
|---|---|---|---|
| GET | `/api/health` | 无 | `{ ok, service }` |
| GET | `/api/public` | 无 | 协会、部门、成员（裁剪）、资料、交流、照片 |
| GET | `/api/me` | 可选 | `{ member }` 或 `{ member: null }` |
| POST | `/api/login` | 无 | 校验账号，设置 `Set-Cookie` |
| POST | `/api/logout` | 可选 | 销毁 Session，清 Cookie |
| GET | `/api/homework` | 必须 | 当前账号班级的作业 + 状态 |
| GET | 其他 `/api/*` | 无 | JSON 404 |

### 作业状态

服务端在返回时计算：

- `closed`：已过截止时间。
- `soon`：剩余 ≤ 3 天。
- `open`：剩余 > 3 天。

同时返回 `daysLeft`。前端只负责展示，不自行扩大数据范围。

## 7. 登录与会话

```text
POST /api/login
  → 限制频率（每 IP 每分钟 6 次）
  → 查 users.json
  → scrypt(password, salt) 与 hash 做 timingSafeEqual
  → 创建随机 32 字节 sid
  → Set-Cookie: hutca_sid=...; HttpOnly; SameSite=Lax; Path=/
  → 返回 { name, className }

GET /api/homework
  → 读取 Cookie
  → 查服务端 Map<sid, session>
  → 过期 / 不存在 → 401
  → 按 session.user.className 过滤 db.homeworks
```

Session 只存在内存，服务重启后失效；这是本地课程项目的取舍。生产环境应换成 Redis/数据库持久化 Session，并启用 HTTPS + Secure Cookie。

## 8. 权限与隐私

| 边界 | 做法 |
|---|---|
| 作业不可越班 | 服务端按 `className` 过滤，前端拿不到其他班级作业 |
| 成员隐私 | API 层 `map(({ name, className }) => ({ name, className }))`，不返回部门/学号/联系方式 |
| 公开数据 | 协会、部门、资料、交流可匿名读 |
| 密码 | 只存 scrypt salt/hash，不存明文；登录错误统一提示 |
| 管理后台 | 本期不做；数据维护直接改 JSON |
| 文件 | 不做上传，避免文件类型/大小/存储权限一整类问题 |

## 9. 安全措施

- `helmet` 级别的关键响应头：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`、CSP。
- CSP：`default-src 'self'`，脚本只允许本地，禁止内联脚本；样式允许 `'unsafe-inline'` 以支持组件内联变量。
- 静态文件路径使用 `path.resolve` + 前缀校验，防目录穿越。
- JSON body 最大 8KB，防止大请求打满内存。
- 登录频率限制：每 IP 每分钟 6 次。
- 所有输出用 `esc()` 转义；没有 `dangerouslySetInnerHTML`。
- 外部链接统一 `target="_blank" rel="noopener noreferrer"`。
- `safeUrl()` 只允许 http/https；`safeAsset()` 只允许本地 assets 路径。
- Cookie `HttpOnly`、`SameSite=Lax`；本地 HTTP 未加 `Secure`，部署时必须加。

## 10. 已知取舍

1. **JSON 不是数据库**：没有事务、没有并发写、没有迁移。本期只读，够用。
2. **Session 在内存**：重启即退出；课程演示可接受。
3. **没有管理后台**：题目明确不做；内容通过 JSON 维护。
4. **没有在线提交**：题目明确不做；作业页只展示要求与提交说明。
5. **没有真实文件**：资料是链接；避免上传、存储、权限和清理的复杂度。
6. **没有前端框架**：页面规模可控；如果继续扩展，建议迁移到 React/Vue 并拆分组件。

## 11. 后续演进

- 管理后台：内容 CRUD、作业发布、成员导入。
- 数据库：SQLite/PostgreSQL + 迁移脚本。
- 账号：邀请码 / 邮箱白名单 / 学院统一认证。
- 作业：提交、批改、互评、截止后锁定。
- 资料：对象存储、签名 URL、版本管理。
- 部署：HTTPS、反向代理、持久化 Session、日志与监控。
