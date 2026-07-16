# Skill Manager - 可视化 Skill 管理桌面应用

## 背景

Claude Code 的 skill 系统目前只能通过终端命令和手动编辑配置文件来管理。Skill 捆绑在插件内部，存储在 `~/.claude/plugins/cache/<市场>/<插件>/<版本>/skills/` 下，启用/禁用通过 `settings.json` 的 `enabledPlugins` 控制。用户需要一个可视化的桌面工具来简化管理流程。

## 目标

构建一个 Electron 桌面应用，提供插件级别和单个 skill 级别的全功能可视化管理。

---

## 一、整体架构

Electron 壳 + 内嵌 Express 后端服务，前后端通过 HTTP REST API 通信。

```
┌──────────────────────────────────────────────────────────┐
│                    Electron Desktop App                   │
│                                                          │
│  ┌────────────────────┐    HTTP     ┌─────────────────┐  │
│  │   React Frontend   │◄──────────►│  Express Server │  │
│  │   (Renderer Proc)  │  REST API  │  (Main Process) │  │
│  └────────────────────┘            └────────┬────────┘  │
│                                             │            │
│                                  ┌──────────▼─────────┐  │
│                                  │    文件系统         │  │
│                                  │  ~/.claude/         │  │
│                                  │  ├ settings.json   │  │
│                                  │  ├ plugins/        │  │
│                                  │  └ ...             │  │
│                                  └────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 技术栈

| 类别 | 选型 |
|---|---|
| 桌面框架 | Electron ^30.0 |
| 前端框架 | React ^18.3 + TypeScript ^5.5 |
| UI 组件库 | Ant Design ^5.20 + @ant-design/icons |
| Markdown 编辑 | @monaco-editor/react |
| Markdown 预览 | react-markdown + remark-gfm |
| HTTP 客户端 | axios |
| 后端框架 | Express ^4.21 |
| 文件操作 | fs-extra |
| Git 操作 | simple-git |
| 打包工具 | electron-builder |
| 构建工具 | Vite + vite-plugin-electron |

### 目录结构

```
skill-manage/
├── electron/              # Electron 主进程
│   ├── main.ts           # 入口，窗口管理，启动后端
│   ├── preload.ts        # preload 脚本
│   └── server/           # Express 后端
│       ├── index.ts      # 服务器入口
│       ├── routes/       # API 路由 (plugins, skills, marketplace, history)
│       ├── services/     # 业务逻辑 (scanner, settings, backup, git)
│       └── utils/
├── src/                   # React 前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/       # 通用组件 (PluginCard, SkillItem, ConfirmModal)
│   ├── pages/            # 页面 (Dashboard, PluginList, SkillEditor, Marketplace, History)
│   ├── hooks/            # useApi
│   └── lib/              # api.ts, types.ts
├── package.json
└── electron-builder.yml
```

---

## 二、功能模块

| 页面 | 功能 |
|---|---|
| 仪表盘 | 总览：已安装插件数、Skill 总数、最近操作、快速入口 |
| 插件管理 | 插件列表卡片、启用/禁用开关、展开查看内部 Skill |
| Skill 编辑器 | 左侧 Monaco 编辑器 + 右侧 Markdown 实时预览、frontmatter 表单 |
| 市场 | 浏览已注册市场、搜索插件、安装/更新/卸载 |
| 操作历史 | 时间线展示、回滚到任意节点 |

---

## 三、REST API

```
GET    /api/health
GET    /api/plugins
PUT    /api/plugins/:id/toggle
GET    /api/plugins/:id/skills
GET    /api/skills/:id
PUT    /api/skills/:id
POST   /api/skills
DELETE /api/skills/:id
GET    /api/marketplaces
GET    /api/marketplaces/:id/plugins
POST   /api/marketplaces/install
GET    /api/history
POST   /api/history/rollback/:id
POST   /api/export
POST   /api/import
```

---

## 四、安全机制

- 写操作前自动备份到 `~/.claude/skill-manage-backups/`
- 危险操作弹窗确认
- 操作历史记录支持回滚

---

## 五、验证方案

1. `npm run dev` 启动 Electron 窗口
2. 插件列表正确读取 `~/.claude/plugins/`
3. 开关切换更新 `settings.json`
4. 编辑器保存生效
5. 操作历史记录和回滚
6. `npm run build` 打包 .exe
