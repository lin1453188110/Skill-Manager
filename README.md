# 🛠️ Skill Manager

Claude Code 技能（Skill）可视化管理工具 —— 告别命令行，用图形界面轻松管理你的所有 Skill。

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/electron-30%2B-9feaf9" alt="Electron">
  <img src="https://img.shields.io/badge/react-18%2B-61dafb" alt="React">
</p>

---

## ✨ 功能一览

| 模块 | 功能 |
|---|---|
| 📊 **仪表盘** | 已安装插件数、Skill 总数、操作记录统计，插件概览列表 |
| 📦 **插件管理** | 浏览所有已安装插件，一键启用/禁用，展开查看内部 Skill 列表 |
| ✏️ **Skill 编辑器** | Monaco Editor 编辑 Markdown 源码 + 实时预览，修改 frontmatter 表单 |
| 📤 **导入/导出** | 选中 Skill 导出为 `.zip`，分享给他人或跨设备同步；从 zip 一键导入 |
| 🏪 **技能市场** | 浏览注册的市场源，搜索插件，一键安装（自动 Git Clone + 注册） |
| ⏱️ **操作历史** | 时间线展示所有写操作，支持一键回滚到任意节点 |
| 🔒 **安全机制** | 写操作前自动备份，危险操作二次确认，操作可追溯可回滚 |

## 🎯 解决的问题

Claude Code 的 Skill 系统默认只能通过终端命令管理：

```bash
# 以前你需要这样做:
cat ~/.claude/plugins/installed_plugins.json   # 查看已安装
vi ~/.claude/settings.json                      # 手动改 enabledPlugins
cd ~/.claude/plugins/cache/superpowers-marketplace/superpowers/5.1.0/skills/
ls                                               # 浏览 Skill 列表
```

**现在**：双击打开 Skill Manager，所有操作可视化完成。

## 📥 安装方式

### 方式一：可执行文件（推荐）

1. 从 [Releases](../../releases) 下载 `Skill-Manager.zip`
2. 解压到任意目录
3. 双击 `Skill Manager.exe`

### 方式二：源码运行

```bash
git clone https://github.com/YOUR_USERNAME/skill-manager.git
cd skill-manager
npm install
npm run dev:server    # 终端 1 - 启动后端
npm run dev           # 终端 2 - 启动前端
# 浏览器打开 http://localhost:5173
```

### 方式三：浏览器模式（无需 Electron）

```bash
npm run dev:server
# 浏览器打开 http://127.0.0.1:3001
```

## 🏗️ 技术架构



| 层级 | 技术 |
|---|---|
| 桌面框架 | Electron 30 |
| 前端 | React 18 + TypeScript 5.5 |
| UI 库 | Ant Design 5 + @ant-design/icons |
| 编辑器 | Monaco Editor（VS Code 同款） |
| Markdown | react-markdown + remark-gfm |
| 后端 | Express 4 + Axios |
| 打包 | electron-builder |
| 构建 | Vite 5 + vite-plugin-electron |

## ⌨️ 开发指南

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/skill-manager.git
cd skill-manager

# 安装依赖
npm install

# 开发模式（浏览器）
npm run dev:server     # 终端 1
npm run dev            # 终端 2

# 开发模式（Electron）
npm run electron:dev

# 生产构建 + 打包
npm run electron:build   # 输出在 release/
```

### 项目结构

```
skill-manage/
├── electron/                  # Electron 主进程
│   ├── main.ts               # 窗口管理 + 服务启动
│   └── server/
│       ├── index.ts          # Express 入口
│       ├── routes/           # API 路由
│       │   ├── plugins.ts    # 插件 CRUD
│       │   ├── skills.ts     # Skill CRUD + 导入导出
│       │   ├── marketplace.ts # 市场 + 安装
│       │   └── history.ts    # 历史 + 回滚
│       └── services/         # 业务逻辑
│           ├── plugin-scanner.ts      # ~/.claude/ 文件扫描
│           ├── skill-service.ts       # Skill 读写
│           ├── settings-service.ts    # settings.json 管理
│           ├── backup-service.ts      # 备份 + 回滚
│           ├── marketplace-service.ts # 市场 + Git 安装
│           └── export-service.ts      # 导入导出
├── src/                      # React 前端
│   ├── App.tsx               # 布局（侧边栏 + 路由）
│   ├── pages/
│   │   ├── Dashboard.tsx     # 仪表盘
│   │   ├── PluginList.tsx    # 插件管理 + 导出/导入
│   │   ├── SkillEditor.tsx   # Monaco 编辑器
│   │   ├── Marketplace.tsx   # 技能市场
│   │   └── History.tsx       # 操作历史
│   ├── components/
│   │   └── PluginCard.tsx    # 插件卡片
│   └── lib/
│       ├── api.ts            # API 客户端
│       └── types.ts          # TypeScript 类型
└── docs/                     # 设计文档
```

## 🌍 跨平台支持

应用自动检测操作系统和用户目录：

| 系统 | 路径示例 |
|---|---|
| Windows | `C:\Users\<用户名>\.claude\plugins\` |
| macOS | `/Users/<用户名>/.claude/plugins/` |
| Linux | `/home/<用户名>/.claude/plugins/` |

只要电脑上安装了 Claude Code 并注册了 Skill 插件，Skill Manager 就能自动发现并管理。

## 📄 开源协议

MIT License — 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">
  <sub>Made with ❤️ for the Claude Code community</sub>
</p>
