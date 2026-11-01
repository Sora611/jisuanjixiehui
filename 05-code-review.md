# 05 · Code Review 记录

Review 范围：`server.js`、`lib/`、`public/app.js`、`public/styles.css`、`tests/api.test.js`
方式：逐项检查 + 实际复现 + 修复后回归。不是只看代码“感觉没问题”。

## 1. Review Checklist

| 检查项 | 看什么 | 结果 |
|---|---|---|
| 正确性 | 路由、筛选、截止状态、登录跳转 | 发现 2 个问题，已修 |
| 权限 | 作业是否服务端过滤；未登录是否 401 | 通过 |
| 隐私 | 成员 API 是否只返回姓名/班级 | 通过 |
| 注入 | 是否用 `innerHTML` 拼接未转义数据 | 通过：统一 `esc()`，无 `dangerouslySetInnerHTML` |
| 密钥 | 前端是否出现 `service_role`/密码/hash | 通过：前端无；`users.json` 只在服务端读 |
| 路径穿越 | 静态文件是否可读 `data/` | 通过：测试 API-10 |
| 输入边界 | body 大小、搜索长度、登录频率 | 通过：8KB、只读搜索、6 次/分钟 |
| 错误态 | API 失败、登录失败、筛选空态 | 发现 1 个问题，已修 |
| 响应式 | 390px 是否横向滚动；Header 是否换行 | 发现 2 个问题，已修 |
| 可访问性 | 焦点、aria、alt、reduced motion | 基本通过；搜索弹窗未做完整 focus trap，列为已知限制 |
| 性能 | 首屏是否加载大图；是否阻塞 | 通过：图片本地 SVG，无外部字体/脚本 |
| 可维护性 | 数据与页面是否分离；函数是否过大 | 基本通过；`app.js` 仍偏长，后续可拆组件 |

## 2. 发现并修复的问题

### CR-01（P1）登录失败会清空用户输入

**位置**：`public/app.js` → `handleLogin`

**问题**：`catch` 里直接 `render()`，错误提示出现，但表单被重绘，学号和密码丢失。对真实用户不友好，也会让“密码错误”看起来像页面刷新。

**修复**：

- 新增 `showLoginError(form, message)`：只更新 `.form-error` 的文本和可见状态；
- 恢复提交按钮、重新聚焦学号；
- 不在错误分支重绘整页；
- 用户重新输入时自动清除错误。

**回归**：UI-08 通过；错误提示“学号或密码不正确”，学号仍为 `2023010101`，按钮可再次点击。

### CR-02（P1）手机端登录后品牌名被挤成两行

**位置**：`public/styles.css` → `@media (max-width: 680px)`

**问题**：Header 同时放品牌名、搜索、用户胶囊（头像 + 姓名 + 箭头）、菜单按钮。390px 下用户胶囊占宽，品牌名换成两行，Header 高度跳动。

**修复**：

- 移动端用户区只显示头像，姓名放进下拉菜单；
- Header actions 间距收紧；
- 品牌名 `white-space: nowrap`。

**回归**：390px 登录后 Header 单行；`scrollWidth=390`。

### CR-03（P2）搜索结果标题和说明粘在一起

**位置**：`public/app.js` → `searchResultLink` + `public/styles.css`

**问题**：标题和 meta 都是 `span`，默认 `inline`，渲染成“技术研发部让每个人从会用工具……”，无法扫读。

**修复**：`.search-result-title`、`.search-result-meta` 改为 `display: block`。

**回归**：搜索 `HTML` 时，标题、说明、类型分三行；游客无“我的作业”，登录后出现。

### CR-04（P2）活动照片墙跨格导致图片被裁切

**位置**：`public/styles.css` → `.photo-wall`

**问题**：6 列网格中第 1、4 张跨 2 行，图片比例与格子不一致，`object-fit: cover` 把海报底部文字裁掉。

**修复**：桌面 3 列、移动 2 列，全部 4:3；去掉跨格；触屏设备说明常显。

**回归**：桌面两张一排、三列整齐；手机两张一排；无裁切。

### CR-05（P2）畸形 Cookie 可能让请求 500

**位置**：`lib/auth.js` → `parseCookies`

**问题**：`decodeURIComponent` 遇到非法百分号编码会抛异常，可能把整个请求打成 500。

**修复**：`try/catch`，畸形值按原字符串保留；无 key 的片段跳过。

**回归**：正常登录/退出通过；未新增失败。

### CR-06（P3）首页 About 标题出现单字换行

**位置**：`public/app.js` + `public/styles.css`

**问题**：1440px 下标题“是一套让新人成长的组织方式。”在窄列里最后一行只剩“式。”，很难看。

**修复**：

- 文案缩短为“不是一个群，是一套成长路径。”；
- 增加 `.section-title--compact`，把该标题控制在 42px 以内；
- 其他长标题加 `text-wrap: balance`。

**回归**：首页 About 两行，无单字孤行。

### CR-07（P3）移动端登录表单被推到首屏之外

**位置**：`public/styles.css` → 登录页响应式

**问题**：登录页 `min-height: 100vh` + 两行 grid 拉伸，移动端左侧叙事把右侧表单推到很下面。

**修复**：≤960px 时 `min-height: 0`、`grid-template-rows: auto auto`、`align-content: start`，表单紧跟叙事。

**回归**：390px 下叙事之后立即出现登录卡片。

## 3. 重点检查结论

### 权限

- `/api/homework` 先查 Session，未登录直接 401。
- 登录后只按 `session.user.className` 过滤，前端不传班级参数，不能通过改 URL/请求体越权。
- 成员 API 在 `lib/data.js` 里显式映射，只保留 `name`、`className`；测试 API-02 验证字段集合。

### XSS

- 所有来自 JSON 的文本都经 `esc()`；属性经 `escapeAttr()`。
- 没有 `dangerouslySetInnerHTML`。
- 外部链接 `rel="noopener noreferrer"`。
- CSP 禁止内联脚本。

### 路径与请求

- 静态文件 `path.resolve` 后校验是否在 `public/` 内；测试 API-10 通过。
- JSON body 限制 8KB。
- 登录 6 次/分钟/IP。
- 无文件上传，减少一整类文件安全风险。

### 已知未解决 / 取舍

1. **搜索弹窗没有完整 focus trap**：Esc 可关、打开自动聚焦，但 Tab 仍可能移出弹窗。课程项目可接受，生产应补。
2. **Session 在内存**：重启失效；生产需持久化。
3. **Cookie 本地无 Secure**：HTTP 本地环境；部署必须 HTTPS + Secure。
4. **`app.js` 单文件偏长**：页面规模可控；继续扩展应拆成组件模块。
5. **JSON 只读**：没有管理后台和并发写；题目明确不做。

## 4. Review 结论

- 必修问题（P1）2 个，已修并回归。
- 应修问题（P2）3 个，已修并回归。
- 体验问题（P3）2 个，已修并回归。
- 剩余问题均为已说明的课程项目取舍，不阻塞本地验收。
- 建议人工复核：用两个班级账号分别登录，确认作业列表不同；用 390px 宽度再走一遍登录和作业页。
