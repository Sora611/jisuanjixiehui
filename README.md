# HUTCA · 计算机协会信息平台

湖南工学院计算机协会的信息发布与成员入口。

把协会介绍、部门路径、成员名单、作业、学习资料和专业交流，收进一个本地可运行的网站。

![首页](docs/screenshots/home-hero.png)

## 功能

- **协会介绍**：成立背景、大事记、指导老师、往期活动
- **部门页**：4 个部门的目标、责任、学习目标和任务清单
- **成员名单**：只显示姓名 + 班级，可按班级筛选
- **作业区**：登录后只看自己班级的作业、要求和截止时间
- **学习资料**：按部门 / 类型筛选
- **专业交流 / 社会服务**：活动记录、可参与项目、交流主题、照片墙
- **站内搜索**：部门、成员、资料、活动；登录后包含本人作业

## 快速开始

要求：Node.js 18 或更高版本。

```bash
# 进入项目目录
cd HUTCA-Platform

# 启动
node server.js
```

打开 <http://localhost:3000>。

不需要 `npm install`，项目没有第三方依赖。

### 演示账号

密码都是 `demo123`。

| 学号 | 姓名 | 班级 |
|---|---|---|
| `2023010101` | 张晨 | 计科2301 |
| `2023020202` | 李雨 | 软工2302 |
| `2023030303` | 许博 | 网络2301 |

登录页和作业区都可以点击账号直接填入。

## 技术栈

- Node.js 内置 `http`：路由、API、静态文件
- 原生 HTML / CSS / JavaScript：无构建步骤
- JSON：协会、部门、成员、作业、资料、交流数据
- `node:test` + `fetch`：接口测试
- Session + HttpOnly Cookie：登录态；作业按班级在服务端过滤

## 目录

```text
HUTCA-Platform/
├─ data/
│  ├─ db.json          网站内容
│  └─ users.json       演示账号（scrypt hash）
├─ lib/                数据读取、登录、Session
├─ public/             页面、样式、图标、活动配图
├─ tests/              接口测试
├─ docs/               需求、UI、架构、测试、Review、过程记录
├─ scripts/            生成演示账号
├─ server.js
└─ README.md
```

## 测试

```bash
node tests/api.test.js
```

预期：**10 / 10 通过**。

手工验收 16 条测试用例见 [`docs/04-test-cases.md`](docs/04-test-cases.md)。

## 修改内容

- 协会、部门、成员、作业、资料、交流：改 `data/db.json`
- 演示账号：改 `data/users.json`，或运行 `node scripts/hash-password.js` 重新生成
- 页面颜色和字体：改 `public/styles.css` 顶部的 `:root`
- 修改 `db.json` 后需要重启 `node server.js`

## 说明

- 这是本地课程项目，不是生产系统；Session 存在内存，数据源为 JSON。
- 成员、活动、作业等为示例数据，可替换为协会真实资料。
- 没有做管理后台、在线提交作业、学科竞赛板块。
- 端口被占用时，说明服务已在运行，直接打开 <http://localhost:3000>。

更多过程文档：

- [需求说明书](docs/01-requirements.md)
- [UI 风格](docs/02-ui-style.md)
- [架构说明](docs/03-architecture.md)
- [Code Review](docs/05-code-review.md)
- [过程留痕](docs/06-process-evidence.md)
