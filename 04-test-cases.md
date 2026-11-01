# 04 · 测试用例与执行记录

执行日期：2026-10-29
环境：Windows / Node.js v24.22.0 / Microsoft Edge 156（无头模式）
地址：`http://localhost:3000`
账号：`2023010101/demo123`（张晨 · 计科2301）、`2023020202/demo123`（李雨 · 软工2302）、`2023030303/demo123`（许博 · 网络2301）

## 1. 自动化接口测试

运行：

```bash
node tests/api.test.js
```

结果：**10 / 10 通过**；手工 UI 验收 16 条通过。

| ID | 场景 | 预期 | 结果 |
|---|---|---|---|
| API-01 | `GET /api/health` | 200，返回服务标识 | 通过 |
| API-02 | `GET /api/public` | 24 位成员；每位只有 `name`、`className`；不含 users/homeworks/hash/salt | 通过 |
| API-03 | 未登录 `GET /api/homework` | 401，`AUTH_REQUIRED` | 通过 |
| API-04 | 错误密码登录 | 401，统一提示“学号或密码不正确” | 通过 |
| API-05 | 计科2301 登录后取作业 | 2 条，全部 `className=计科2301` | 通过 |
| API-06 | 软工2302 登录后取作业 | 2 条，全部 `className=软工2302`，不含计科2301 | 通过 |
| API-07 | 退出后再取作业 | Cookie 清除，再请求 401 | 通过 |
| API-08 | `GET /` | 200 HTML，含 CSP、nosniff、DENY | 通过 |
| API-09 | 未知 API | 404，JSON `API_NOT_FOUND` | 通过 |
| API-10 | 路径穿越 `/assets/../../data/users.json` | 404，不泄露 salt | 通过 |

## 2. 手工 UI 验收

| ID | 场景 | 操作 | 预期 | 结果 |
|---|---|---|---|---|
| UI-01 | 桌面首页 | 1440px 打开 `/` | Hero、协会简介、大事记、四个入口、最近活动、三步引导、页脚完整 | 通过 |
| UI-02 | 部门切换 | 点“产品设计部” | 面板标题、目标、任务全部切换；标签 active | 通过 |
| UI-03 | 成员筛选 | 点“计科2301” | 4 行；底部 `4 / 24 SHOWN`；只显示姓名/班级 | 通过 |
| UI-04 | 资料部门筛选 | 点“产品设计部” | 3 张卡：Figma、设计系统、5 人测试 | 通过 |
| UI-05 | 资料类型筛选 | 点“模板” | 2 张卡：活动策划模板、复盘模板 | 通过 |
| UI-06 | 资料空态 | 产品设计部 + 模板 | 0 张，显示空态，不白屏 | 通过 |
| UI-07 | 未登录作业区 | 直接开 `/homework` | 显示权限说明 + 登录卡片；无作业数据 | 通过 |
| UI-08 | 登录错误 | 错误密码提交 | 错误提示可见；学号仍保留；按钮恢复可点 | 通过 |
| UI-09 | 登录成功 | 点击演示账号并提交 | 跳转 `/homework`；Header 显示张晨；2 条计科2301作业 | 通过 |
| UI-10 | 班级隔离 | 切换软工2302账号 | 只看到 2 条软工2302作业，看不到计科2301 | 通过 |
| UI-11 | 交流板块 | 切到“社会服务” | 标题“技术不只在机房里…”，3 活动 / 2 项目 / 3 主题 | 通过 |
| UI-12 | 搜索权限 | 搜索 `HTML`（游客 / 登录） | 游客无“我的作业”；登录后出现；标题/说明分层 | 通过 |
| UI-13 | 手机宽度 | 390px 打开 6 个页面 | `scrollWidth=390`，无横向滚动；Header 不换行 | 通过 |
| UI-14 | 移动端菜单 | 点菜单按钮 | 展开 7 个入口，`scrollWidth=390` | 通过 |
| UI-15 | 照片墙 | 桌面 / 移动 | 桌面 3 列，移动 2 列；4:3 不裁切；触屏常显说明 | 通过 |
| UI-16 | 404 | 访问 `/nope` | 显示“这个入口还没建好”，不白屏 | 通过 |

## 3. 关键证据

- 首页：`screenshots/home.png`
- 部门：`screenshots/departments.png`
- 成员：`screenshots/members.png`
- 作业（游客）：`screenshots/homework-guest.png`
- 作业（计科2301）：`screenshots/homework-student.png`
- 资料：`screenshots/materials.png`
- 专业交流：`screenshots/exchange-professional.png`
- 社会服务：`screenshots/exchange-service.png`
- 搜索：`screenshots/search.png`
- 登录：`screenshots/login.png`
- 手机首页：`screenshots/mobile-home.png`
- 手机作业：`screenshots/mobile-homework.png`
- 手机登录：`screenshots/mobile-login.png`

## 4. 未覆盖项

- 公网部署、HTTPS、Secure Cookie：本期不要求部署。
- 管理后台、在线提交、文件上传：本期明确不做。
- 多浏览器兼容：只验收了 Chromium 内核（Edge），Safari / Firefox 未测。
- 并发和持久化：JSON 只读、Session 内存，未做压力测试。
