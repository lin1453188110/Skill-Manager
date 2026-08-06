# 🛠️ Skill Manager

Claude Code 技能（Skill）可视化管理工具 —— 告别命令行，用图形界面轻松管理你的所有 Skill。

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/electron-30%2B-9feaf9" alt="Electron">
  <img src="https://img.shields.io/badge/react-18%2B-61dafb" alt="React">
  <img src="https://img.shields.io/badge/typescript-5.5%2B-3178c6" alt="TypeScript">
</p>

---

## ✨ 功能一览

| 模块 | 功能 |
|---|---|
| 📊 **仪表盘** | 已安装插件数、Skill 总数、操作记录统计，插件概览列表 |
| 📦 **插件管理** | 浏览所有已安装插件，一键启用/禁用，展开查看内部 Skill 列表，支持新建 / 删除插件 |
| ➕ **Skill 管理** | 在任意插件下新建 Skill，或删除现有 Skill（写操作前自动备份） |
| ✏️ **Skill 编辑器** | Monaco Editor（VS Code 同款）编辑 Markdown 源码 + 实时预览，修改 frontmatter 表单 |
| 📤 **导入/导出** | 选中 Skill 导出为 `.zip`，分享给他人或跨设备同步；从 zip 一键导入 |
| 🏪 **技能市场** | 可视化 Claude 官方插件市场（255 个插件，**中文介绍**）+ 所有已注册市场源，搜索 + 一键安装 |
| 📡 **URL 安装** | 直接粘贴 Git 仓库地址（如 GitHub）即可安装插件 |

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

### 方式二：源码运行（开发模式）

```bash
git clone https://github.com/YOUR_USERNAME/skill-manager.git
cd skill-manager
npm install
npm start                 # 一条命令同时启动后端 + 前端
# 浏览器打开 http://localhost:5173
```

> 也可以分开启动：`npm run dev:server`（后端，端口 3001）+ `npm run dev`（前端 Vite，端口 5173）。

### 方式三：浏览器模式（无需 Electron）

```bash
npm install
npm run build             # 编译前端产物到 dist/
npm run dev:server        # Express 同时托管后端 API + 前端静态页面
# 浏览器打开 http://127.0.0.1:3001
```

> Windows 用户也可以直接双击仓库根目录的 `启动Skill-Manager.bat` 一键启动并自动打开浏览器。

## 🏗️ 技术架构

| 层级 | 技术 |
|---|---|
| 桌面框架 | Electron 30 |
| 前端 | React 18 + TypeScript 5.5 |
| UI 库 | Ant Design 5 + @ant-design/icons |
| 编辑器 | Monaco Editor（VS Code 同款） |
| Markdown | react-markdown + remark-gfm |
| 后端 | Express 4 + Axios |
| Git 操作 | simple-git（clone / pull / status 验证） |
| 压缩/解压 | archiver + extract-zip |
| 打包 | electron-builder |
| 构建 | Vite 5 + vite-plugin-electron |

## ⌨️ 开发指南

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/skill-manager.git
cd skill-manager

# 安装依赖
npm install

# 开发模式（推荐，同时启动后端 + 前端）
npm start

# 开发模式（分开启动）
npm run dev:server     # 终端 1 - 后端 API (http://127.0.0.1:3001)
npm run dev            # 终端 2 - 前端 (http://localhost:5173)

# 生产构建 + 打包 exe
npm run build          # 编译 TypeScript + 打包前端/主进程
npx electron-builder   # 打包安装包，输出在 release/
```

### 项目结构

```
skill-manage/
├── electron/                  # Electron 主进程 + 后端
│   ├── main.ts               # 窗口管理 + 服务启动
│   ├── preload.ts            # 预加载脚本
│   └── server/
│       ├── index.ts          # Express 入口（静态托管 + API + SPA 回退）
│       ├── routes/           # API 路由
│       │   ├── plugins.ts    # 插件 CRUD
│       │   ├── skills.ts     # Skill CRUD
│       │   ├── marketplace.ts # 市场 + 安装 + 进度查询
│       │   └── history.ts    # 历史 + 回滚
│       └── services/         # 业务逻辑
│           ├── plugin-scanner.ts       # ~/.claude/ 文件扫描
│           ├── skill-service.ts        # Skill 读写
│           ├── settings-service.ts     # settings.json 管理
│           ├── backup-service.ts       # 备份 + 回滚
│           ├── marketplace-service.ts  # 市场 + 健壮安装（clone 降级 zip）
│           ├── chinese-descriptions.json # 官方市场 255 个插件的中文介绍
│           └── export-service.ts       # 导入导出
├── src/                      # React 前端
│   ├── App.tsx               # 布局（侧边栏 + 路由）
│   ├── pages/
│   │   ├── Dashboard.tsx     # 仪表盘
│   │   ├── PluginList.tsx    # 插件管理 + 新建/删除 + 导入导出
│   │   ├── SkillEditor.tsx   # Monaco 编辑器
│   │   ├── Marketplace.tsx   # 技能市场（官方 + 自定义）+ 安装进度
│   │   └── History.tsx       # 操作历史
│   ├── components/
│   │   └── PluginCard.tsx    # 插件卡片
│   └── lib/
│       ├── api.ts            # API 客户端
│       └── types.ts          # TypeScript 类型
├── server.ts                 # 浏览器模式入口（Express + 静态托管）
├── electron-builder.yml      # exe 打包配置
├── 启动Skill-Manager.bat     # Windows 一键启动脚本
├── docs/                     # 设计文档
└── release/                  # 打包产物（win-unpacked / 安装包）
```

## 🛡️ 安装机制详解

针对国内网络环境访问 GitHub 慢、易中断的问题，安装采用**多层降级策略**：

1. **git clone**：浅克隆（`--depth 1`），失败自动重试 3 次，每次间隔递增
2. **zip 下载降级**：clone 全部失败后，自动拼接 `archive/refs/heads/main.zip` 用 `curl` 流式下载解压（支持断点重试、10 分钟超时）
3. **进度可视化**：无论 clone 还是 zip 下载，进度条实时刷新（clone 解析 git stderr 百分比，zip 轮询文件大小）

安装完成后自动完成：文件落盘 → 注册到 `installed_plugins.json` → 在 `settings.json` 启用。

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
