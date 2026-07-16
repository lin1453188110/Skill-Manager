# Skill Manager 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 构建一个 Electron + React + Express 桌面应用，用于可视化管理 Claude Code 的 skill 系统

**架构:** Electron 主进程内嵌 Express 后端（文件系统操作 + Git），React 前端通过 HTTP REST API 通信，Ant Design 负责 UI

**技术栈:** Electron 30, React 18, TypeScript 5.5, Ant Design 5.20, Express 4.21, Monaco Editor, Vite 5, electron-builder

---

## 阶段一：项目初始化

### Task 1: 初始化 Vite + React + TypeScript 项目

**文件:**
- 创建: `package.json`
- 创建: `tsconfig.json`
- 创建: `tsconfig.node.json`
- 创建: `vite.config.ts`
- 创建: `index.html`
- 创建: `electron-builder.yml`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "skill-manager",
  "version": "1.0.0",
  "description": "Claude Code Skill 可视化管理工具",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "antd": "^5.20.0",
    "@ant-design/icons": "^5.4.0",
    "@monaco-editor/react": "^4.6.0",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "axios": "^1.7.2",
    "express": "^4.21.0",
    "fs-extra": "^11.2.0",
    "simple-git": "^3.25.0",
    "archiver": "^7.0.1",
    "extract-zip": "^2.0.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/express": "^4.17.21",
    "@types/fs-extra": "^11.0.4",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vite-plugin-electron": "^0.28.7",
    "vite-plugin-electron-renderer": "^0.14.5",
    "electron": "^30.0.0",
    "electron-builder": "^25.1.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd "c:/Users/14531/Desktop/project/skill manage"
npm install
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "electron"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['express', 'fs-extra', 'simple-git', 'archiver', 'extract-zip']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

- [ ] **Step 6: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skill Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 electron-builder.yml**

```yaml
appId: com.skillmanager.app
productName: Skill Manager
directories:
  output: release
files:
  - dist
  - dist-electron
win:
  target: nsis
  icon: public/icon.png
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 8: 验证项目启动**

```bash
npx vite build
```
期望：构建成功，无报错

---

### Task 2: 创建 Electron 主进程

**文件:**
- 创建: `electron/main.ts`
- 创建: `electron/preload.ts`

- [ ] **Step 1: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { startServer } from './server'

let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Skill Manager'
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await startServer()
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 2: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})
```

- [ ] **Step 3: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  getBackendPort: () => Promise<number>
  openExternal: (url: string) => Promise<void>
}

interface Window {
  electronAPI: ElectronAPI
}
```

---

## 阶段二：后端基础

### Task 3: Express 服务器 + 类型定义

**文件:**
- 创建: `electron/server/index.ts`
- 创建: `src/lib/types.ts`

- [ ] **Step 1: 创建共享类型定义 src/lib/types.ts**

```typescript
// ===== 插件 =====
export interface PluginInfo {
  id: string
  name: string
  version: string
  marketplace: string
  enabled: boolean
  installPath: string
  skillCount: number
  skills: SkillSummary[]
}

export interface SkillSummary {
  id: string
  name: string
  description: string
  pluginId: string
  filePath: string
}

// ===== Skill 详情 =====
export interface SkillDetail {
  id: string
  name: string
  description: string
  pluginId: string
  filePath: string
  rawContent: string
  frontmatter: SkillFrontmatter
  body: string
}

export interface SkillFrontmatter {
  name: string
  description: string
}

// ===== 市场 =====
export interface MarketplaceInfo {
  id: string
  name: string
  source: string
  pluginCount: number
}

export interface MarketplacePlugin {
  id: string
  name: string
  description: string
  version: string
  marketplace: string
  installed: boolean
}

// ===== 操作历史 =====
export interface HistoryEntry {
  id: string
  timestamp: string
  action: string
  description: string
  target: string
  backupPath: string
  rolledBack: boolean
}

// ===== 通用响应 =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ===== 导入导出 =====
export interface ExportManifest {
  exportedAt: string
  version: string
  skills: Array<{
    name: string
    pluginName: string
    frontmatter: SkillFrontmatter
    body: string
  }>
}
```

- [ ] **Step 2: 创建 Express 服务器 electron/server/index.ts**

```typescript
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { registerPluginRoutes } from './routes/plugins'
import { registerSkillRoutes } from './routes/skills'
import { registerMarketplaceRoutes } from './routes/marketplace'
import { registerHistoryRoutes } from './routes/history'

let serverPort: number | null = null

export function getServerPort(): number | null {
  return serverPort
}

export async function startServer(): Promise<number> {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  // 注册路由
  registerPluginRoutes(app)
  registerSkillRoutes(app)
  registerMarketplaceRoutes(app)
  registerHistoryRoutes(app)

  return new Promise((resolve, reject) => {
    const server = createServer(app)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        serverPort = addr.port
        console.log(`后端服务已启动: http://127.0.0.1:${serverPort}`)
        resolve(serverPort)
      } else {
        reject(new Error('无法获取服务器端口'))
      }
    })
    server.on('error', reject)
  })
}
```

---

### Task 4: 插件扫描服务

**文件:**
- 创建: `electron/server/services/plugin-scanner.ts`

- [ ] **Step 1: 实现插件扫描服务**

```typescript
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { PluginInfo, SkillSummary } from '../../../src/lib/types'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const PLUGINS_CACHE = path.join(CLAUDE_DIR, 'plugins', 'cache')
const INSTALLED_PLUGINS_PATH = path.join(CLAUDE_DIR, 'plugins', 'installed_plugins.json')
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json')

/**
 * 解析 SKILL.md 文件的 frontmatter
 */
function parseSkillFrontmatter(content: string): { name: string; description: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter: Record<string, string> = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.+)$/)
    if (kv) {
      frontmatter[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1')
    }
  }
  return {
    name: frontmatter.name || '',
    description: frontmatter.description || ''
  }
}

/**
 * 扫描插件目录下的所有 skill
 */
async function scanPluginSkills(pluginDir: string, pluginId: string): Promise<SkillSummary[]> {
  const skillsDir = path.join(pluginDir, 'skills')
  if (!(await fs.pathExists(skillsDir))) return []

  const entries = await fs.readdir(skillsDir, { withFileTypes: true })
  const skills: SkillSummary[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md')
    if (!(await fs.pathExists(skillMdPath))) continue

    try {
      const content = await fs.readFile(skillMdPath, 'utf-8')
      const fm = parseSkillFrontmatter(content)

      skills.push({
        id: `${pluginId}/${entry.name}`,
        name: fm?.name || entry.name,
        description: fm?.description || '',
        pluginId,
        filePath: skillMdPath
      })
    } catch {
      // 跳过无法读取的文件
    }
  }

  return skills
}

/**
 * 获取所有已安装插件
 */
export async function getAllPlugins(): Promise<PluginInfo[]> {
  const plugins: PluginInfo[] = []

  // 读取安装信息
  let installedPlugins: Record<string, Array<{ version: string; installPath: string }>> = {}
  try {
    const raw = await fs.readFile(INSTALLED_PLUGINS_PATH, 'utf-8')
    installedPlugins = JSON.parse(raw).plugins || {}
  } catch {
    return plugins
  }

  // 读取启用状态
  let enabledPlugins: Record<string, boolean> = {}
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    enabledPlugins = JSON.parse(raw).enabledPlugins || {}
  } catch {
    // settings.json 可能不存在
  }

  for (const [key, installs] of Object.entries(installedPlugins)) {
    const install = Array.isArray(installs) ? installs[0] : null
    if (!install?.installPath) continue

    const [name, marketplace] = key.split('@')
    const skills = await scanPluginSkills(install.installPath, key)

    plugins.push({
      id: key,
      name: name || key,
      version: install.version || 'unknown',
      marketplace: marketplace || '',
      enabled: enabledPlugins[key] !== false,
      installPath: install.installPath,
      skillCount: skills.length,
      skills
    })
  }

  return plugins
}

/**
 * 获取插件下的 skill 列表
 */
export async function getPluginSkills(pluginId: string): Promise<SkillSummary[]> {
  const plugins = await getAllPlugins()
  const plugin = plugins.find(p => p.id === pluginId)
  return plugin?.skills || []
}
```

- [ ] **Step 2: 验证扫描逻辑**

创建一个临时测试：
```bash
cd "c:/Users/14531/Desktop/project/skill manage"
npx tsx -e "
const { getAllPlugins } = require('./electron/server/services/plugin-scanner');
getAllPlugins().then(p => console.log(JSON.stringify(p, null, 2)));
"
```
期望：输出当前已安装的 superpowers 和 claude-hud 插件信息

---

### Task 5: 设置服务 + 备份服务

**文件:**
- 创建: `electron/server/services/settings-service.ts`
- 创建: `electron/server/services/backup-service.ts`

- [ ] **Step 1: 创建设置服务 settings-service.ts**

```typescript
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json')

export async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await fs.ensureDir(path.dirname(SETTINGS_PATH))
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

export async function togglePlugin(pluginId: string, enabled: boolean): Promise<void> {
  const settings = await getSettings()
  const enabledPlugins: Record<string, boolean> = (settings.enabledPlugins as Record<string, boolean>) || {}

  enabledPlugins[pluginId] = enabled
  settings.enabledPlugins = enabledPlugins

  await saveSettings(settings)
}

export async function getEnabledPlugins(): Promise<Record<string, boolean>> {
  const settings = await getSettings()
  return (settings.enabledPlugins as Record<string, boolean>) || {}
}
```

- [ ] **Step 2: 创建备份服务 backup-service.ts**

```typescript
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { HistoryEntry } from '../../../src/lib/types'

const BACKUP_DIR = path.join(os.homedir(), '.claude', 'skill-manage-backups')
const HISTORY_PATH = path.join(BACKUP_DIR, 'history.json')

export async function initBackupSystem(): Promise<void> {
  await fs.ensureDir(BACKUP_DIR)
  if (!(await fs.pathExists(HISTORY_PATH))) {
    await fs.writeFile(HISTORY_PATH, '[]', 'utf-8')
  }
}

export async function backupFile(originalPath: string, action: string, description: string): Promise<string> {
  await initBackupSystem()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFolder = path.join(BACKUP_DIR, `${timestamp}_${action}`)
  await fs.ensureDir(backupFolder)

  const fileName = path.basename(originalPath)
  const backupPath = path.join(backupFolder, fileName)

  if (await fs.pathExists(originalPath)) {
    await fs.copyFile(originalPath, backupPath)
  }

  // 记录历史
  const entry: HistoryEntry = {
    id: timestamp,
    timestamp: new Date().toISOString(),
    action,
    description,
    target: originalPath,
    backupPath,
    rolledBack: false
  }

  const history = await getHistory()
  history.unshift(entry)
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')

  return backupPath
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await fs.readFile(HISTORY_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function rollback(historyId: string): Promise<boolean> {
  const history = await getHistory()
  const entry = history.find(h => h.id === historyId)
  if (!entry) return false

  // 恢复文件
  if (await fs.pathExists(entry.backupPath)) {
    await fs.copyFile(entry.backupPath, entry.target)
  }

  // 标记已回滚
  entry.rolledBack = true
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')

  return true
}
```

---

### Task 6: Skill 编辑服务 + 市场服务

**文件:**
- 创建: `electron/server/services/skill-service.ts`
- 创建: `electron/server/services/marketplace-service.ts`

- [ ] **Step 1: 创建 Skill 编辑服务 skill-service.ts**

```typescript
import fs from 'fs-extra'
import path from 'path'
import { SkillDetail, SkillFrontmatter } from '../../../src/lib/types'
import { getAllPlugins } from './plugin-scanner'
import { backupFile } from './backup-service'

export async function getSkillDetail(skillId: string): Promise<SkillDetail | null> {
  const plugins = await getAllPlugins()
  for (const plugin of plugins) {
    const skill = plugin.skills.find(s => s.id === skillId)
    if (!skill) continue

    const rawContent = await fs.readFile(skill.filePath, 'utf-8')
    const body = rawContent.replace(/^---\n[\s\S]*?\n---\n?/, '')
    const fmMatch = rawContent.match(/^---\n([\s\S]*?)\n---/)

    let frontmatter: SkillFrontmatter = { name: '', description: '' }
    if (fmMatch) {
      const nameMatch = fmMatch[1].match(/^name:\s*(.+)$/m)
      const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m)
      frontmatter = {
        name: nameMatch?.[1]?.replace(/^"(.*)"$/, '$1') || skill.name,
        description: descMatch?.[1]?.replace(/^"(.*)"$/, '$1') || skill.description
      }
    }

    return {
      ...skill,
      rawContent,
      frontmatter,
      body: body.trim()
    }
  }
  return null
}

export async function updateSkill(
  skillId: string,
  frontmatter: SkillFrontmatter,
  body: string
): Promise<boolean> {
  const detail = await getSkillDetail(skillId)
  if (!detail) return false

  await backupFile(detail.filePath, 'edit-skill', `编辑 ${skillId}`)

  const fmBlock = [
    '---',
    `name: ${frontmatter.name}`,
    `description: "${frontmatter.description}"`,
    '---',
    ''
  ].join('\n')

  const newContent = fmBlock + body
  await fs.writeFile(detail.filePath, newContent, 'utf-8')
  return true
}

export async function createSkill(
  pluginId: string,
  folderName: string,
  frontmatter: SkillFrontmatter,
  body: string
): Promise<string | null> {
  const plugins = await getAllPlugins()
  const plugin = plugins.find(p => p.id === pluginId || p.name === pluginId)
  if (!plugin) return null

  const skillsDir = path.join(plugin.installPath, 'skills')
  await fs.ensureDir(skillsDir)

  const newSkillDir = path.join(skillsDir, folderName)
  if (await fs.pathExists(newSkillDir)) return null

  await fs.ensureDir(newSkillDir)

  const fmBlock = [
    '---',
    `name: ${frontmatter.name}`,
    `description: "${frontmatter.description}"`,
    '---',
    ''
  ].join('\n')

  const skillPath = path.join(newSkillDir, 'SKILL.md')
  await fs.writeFile(skillPath, fmBlock + body, 'utf-8')

  await backupFile(skillPath, 'create-skill', `创建 ${folderName}`)
  return `${pluginId}/${folderName}`
}

export async function deleteSkill(skillId: string): Promise<boolean> {
  const detail = await getSkillDetail(skillId)
  if (!detail) return false

  await backupFile(detail.filePath, 'delete-skill', `删除 ${skillId}`)

  const skillDir = path.dirname(detail.filePath)
  await fs.remove(skillDir)
  return true
}
```

- [ ] **Step 2: 创建市场服务 marketplace-service.ts**

```typescript
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import { MarketplaceInfo, MarketplacePlugin } from '../../../src/lib/types'
import { backupFile } from './backup-service'
import { getAllPlugins } from './plugin-scanner'

const MARKETPLACES_DIR = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces')
const KNOWN_MARKETPLACES_PATH = path.join(os.homedir(), '.claude', 'plugins', 'known_marketplaces.json')

export async function getMarketplaces(): Promise<MarketplaceInfo[]> {
  if (!(await fs.pathExists(KNOWN_MARKETPLACES_PATH))) return []

  const raw = await fs.readFile(KNOWN_MARKETPLACES_PATH, 'utf-8')
  const marketplaces: Record<string, { source: { source: string; repo?: string; url?: string } }> = JSON.parse(raw)

  return Object.entries(marketplaces).map(([id, info]) => ({
    id,
    name: id,
    source: info.source.repo || info.source.url || '',
    pluginCount: 0
  }))
}

export async function getMarketplacePlugins(marketplaceId: string): Promise<MarketplacePlugin[]> {
  const marketplaceDir = path.join(MARKETPLACES_DIR, marketplaceId)
  const pluginJsonPath = path.join(marketplaceDir, '.claude-plugin', 'marketplace.json')

  if (!(await fs.pathExists(pluginJsonPath))) return []

  const raw = await fs.readFile(pluginJsonPath, 'utf-8')
  const manifest = JSON.parse(raw)
  const plugins = manifest.plugins || []

  // 获取已安装列表
  const installed = await getAllPlugins()
  const installedNames = new Set(installed.map(p => p.name))

  return plugins.map((p: { name: string; description?: string; version?: string }) => ({
    id: p.name,
    name: p.name,
    description: p.description || '',
    version: p.version || 'latest',
    marketplace: marketplaceId,
    installed: installedNames.has(p.name)
  }))
}

export async function installPlugin(
  marketplaceId: string,
  pluginName: string,
  sourceUrl: string
): Promise<boolean> {
  const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', marketplaceId, pluginName)
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json')

  await backupFile(settingsPath, 'install-plugin', `安装 ${pluginName}`)

  // 如果已存在则 git pull，否则 git clone
  if (await fs.pathExists(cacheDir)) {
    const git = simpleGit(cacheDir)
    await git.pull()
  } else {
    await fs.ensureDir(cacheDir)
    await simpleGit().clone(sourceUrl, cacheDir)
  }

  return true
}
```

---

## 阶段三：API 路由

### Task 7: 插件路由 + Skill 路由

**文件:**
- 创建: `electron/server/routes/plugins.ts`
- 创建: `electron/server/routes/skills.ts`

- [ ] **Step 1: 创建插件路由 plugins.ts**

```typescript
import { Express, Request, Response } from 'express'
import { getAllPlugins, getPluginSkills } from '../services/plugin-scanner'
import { togglePlugin } from '../services/settings-service'

export function registerPluginRoutes(app: Express): void {
  // 获取所有插件
  app.get('/api/plugins', async (_req: Request, res: Response) => {
    try {
      const plugins = await getAllPlugins()
      res.json({ success: true, data: plugins })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 切换插件启用/禁用
  app.put('/api/plugins/:id/toggle', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { enabled } = req.body

      await togglePlugin(id, enabled)

      const plugins = await getAllPlugins()
      const updated = plugins.find(p => p.id === id)

      res.json({ success: true, data: updated })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 获取插件下的 skill 列表
  app.get('/api/plugins/:id/skills', async (req: Request, res: Response) => {
    try {
      const skills = await getPluginSkills(req.params.id)
      res.json({ success: true, data: skills })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
```

- [ ] **Step 2: 创建 Skill 路由 skills.ts**

```typescript
import { Express, Request, Response } from 'express'
import { getSkillDetail, updateSkill, createSkill, deleteSkill } from '../services/skill-service'
import { getAllPlugins } from '../services/plugin-scanner'
import { exportSkills, importSkills } from '../services/export-service'

export function registerSkillRoutes(app: Express): void {
  // 获取单个 skill 详情
  app.get('/api/skills/:id', async (req: Request, res: Response) => {
    try {
      const detail = await getSkillDetail(req.params.id)
      if (!detail) {
        return res.status(404).json({ success: false, error: '技能未找到' })
      }
      res.json({ success: true, data: detail })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 更新 skill
  app.put('/api/skills/:id', async (req: Request, res: Response) => {
    try {
      const { frontmatter, body } = req.body
      const success = await updateSkill(req.params.id, frontmatter, body)
      if (!success) {
        return res.status(404).json({ success: false, error: '技能未找到' })
      }
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 新建 skill
  app.post('/api/skills', async (req: Request, res: Response) => {
    try {
      const { pluginId, folderName, frontmatter, body } = req.body
      const newId = await createSkill(pluginId, folderName, frontmatter, body || '')
      if (!newId) {
        return res.status(400).json({ success: false, error: '无法创建技能，目录可能已存在' })
      }
      res.json({ success: true, data: { id: newId } })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 删除 skill
  app.delete('/api/skills/:id', async (req: Request, res: Response) => {
    try {
      const success = await deleteSkill(req.params.id)
      if (!success) {
        return res.status(404).json({ success: false, error: '技能未找到' })
      }
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 导出 skill
  app.post('/api/export', async (req: Request, res: Response) => {
    try {
      const { skillIds } = req.body
      const zipPath = await exportSkills(skillIds)
      res.json({ success: true, data: { path: zipPath } })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 导入 skill
  app.post('/api/import', async (req: Request, res: Response) => {
    try {
      const { zipPath, targetPluginId } = req.body
      const result = await importSkills(zipPath, targetPluginId)
      res.json({ success: true, data: result })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
```

---

### Task 8: 市场路由 + 历史路由 + 导出服务

**文件:**
- 创建: `electron/server/routes/marketplace.ts`
- 创建: `electron/server/routes/history.ts`
- 创建: `electron/server/services/export-service.ts`

- [ ] **Step 1: 创建市场路由 marketplace.ts**

```typescript
import { Express, Request, Response } from 'express'
import { getMarketplaces, getMarketplacePlugins, installPlugin } from '../services/marketplace-service'

export function registerMarketplaceRoutes(app: Express): void {
  app.get('/api/marketplaces', async (_req: Request, res: Response) => {
    try {
      const marketplaces = await getMarketplaces()
      res.json({ success: true, data: marketplaces })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.get('/api/marketplaces/:id/plugins', async (req: Request, res: Response) => {
    try {
      const plugins = await getMarketplacePlugins(req.params.id)
      res.json({ success: true, data: plugins })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.post('/api/marketplaces/install', async (req: Request, res: Response) => {
    try {
      const { marketplaceId, pluginName, sourceUrl } = req.body
      const success = await installPlugin(marketplaceId, pluginName, sourceUrl)
      res.json({ success: true, data: { installed: success } })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
```

- [ ] **Step 2: 创建历史路由 history.ts**

```typescript
import { Express, Request, Response } from 'express'
import { getHistory, rollback } from '../services/backup-service'

export function registerHistoryRoutes(app: Express): void {
  app.get('/api/history', async (_req: Request, res: Response) => {
    try {
      const history = await getHistory()
      res.json({ success: true, data: history })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.post('/api/history/rollback/:id', async (req: Request, res: Response) => {
    try {
      const success = await rollback(req.params.id)
      if (!success) {
        return res.status(404).json({ success: false, error: '历史记录未找到' })
      }
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
```

- [ ] **Step 3: 创建导出服务 export-service.ts**

```typescript
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import archiver from 'archiver'
import { getSkillDetail } from './skill-service'
import { ExportManifest, SkillFrontmatter } from '../../../src/lib/types'

export async function exportSkills(skillIds: string[]): Promise<string> {
  const exportDir = path.join(os.tmpdir(), 'skill-export-' + Date.now())
  await fs.ensureDir(exportDir)

  const manifest: ExportManifest = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    skills: []
  }

  for (const skillId of skillIds) {
    const detail = await getSkillDetail(skillId)
    if (!detail) continue

    const skillDir = path.join(exportDir, detail.name)
    await fs.ensureDir(skillDir)
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), detail.rawContent, 'utf-8')

    manifest.skills.push({
      name: detail.name,
      pluginName: detail.pluginId,
      frontmatter: detail.frontmatter,
      body: detail.body
    })
  }

  await fs.writeFile(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  )

  // 打包为 zip
  const zipPath = path.join(os.homedir(), 'Desktop', `skills-export-${Date.now()}.zip`)
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath))
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(exportDir, false)
    archive.finalize()
  })
}

export async function importSkills(
  zipPath: string,
  targetPluginId: string
): Promise<{ imported: string[] }> {
  const extractDir = path.join(os.tmpdir(), 'skill-import-' + Date.now())

  // 解压
  const extractZip = await import('extract-zip')
  await extractZip.default(zipPath, { dir: extractDir })

  const manifestPath = path.join(extractDir, 'manifest.json')
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error('无效的导出包：缺少 manifest.json')
  }

  const manifest: ExportManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  const imported: string[] = []

  for (const skill of manifest.skills) {
    const skillMdPath = path.join(extractDir, skill.name, 'SKILL.md')
    if (!(await fs.pathExists(skillMdPath))) continue

    const content = await fs.readFile(skillMdPath, 'utf-8')

    // 写入目标插件目录
    const { createSkill } = require('./skill-service')
    const newId = await createSkill(targetPluginId, skill.name, skill.frontmatter, skill.body)
    if (newId) imported.push(newId)
  }

  await fs.remove(extractDir)
  return { imported }
}
```

---

## 阶段四：前端基础

### Task 9: React 应用入口 + 布局

**文件:**
- 创建: `src/main.tsx`
- 创建: `src/App.tsx`

- [ ] **Step 1: 创建 main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff'
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: 创建 App.tsx（含布局和路由）**

```typescript
import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  EditOutlined,
  ShoppingOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import PluginList from './pages/PluginList'
import SkillEditor from './pages/SkillEditor'
import Marketplace from './pages/Marketplace'
import History from './pages/History'

const { Sider, Content, Header } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/plugins', icon: <AppstoreOutlined />, label: '插件管理' },
  { key: '/marketplace', icon: <ShoppingOutlined />, label: '技能市场' },
  { key: '/history', icon: <HistoryOutlined />, label: '操作历史' }
]

const BACKEND_PORT = 3001 // Express 服务器端口将通过 preload 获取

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const currentKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 18,
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? '🛠️' : '🛠️ Skill 管理器'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {menuItems.find(m => m.key === currentKey)?.label || 'Skill 管理器'}
          </Typography.Title>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plugins" element={<PluginList />} />
            <Route path="/editor/:skillId" element={<SkillEditor />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
```

- [ ] **Step 3: 创建 src/index.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
#root { height: 100vh; }
```

---

### Task 10: API 客户端

**文件:**
- 创建: `src/lib/api.ts`

- [ ] **Step 1: 创建 API 客户端**

```typescript
import axios from 'axios'
import type {
  PluginInfo,
  SkillSummary,
  SkillDetail,
  SkillFrontmatter,
  MarketplaceInfo,
  MarketplacePlugin,
  HistoryEntry,
  ApiResponse
} from './types'

const API_BASE = 'http://127.0.0.1:3001/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// ===== 插件 =====
export async function fetchPlugins(): Promise<PluginInfo[]> {
  const { data } = await api.get<ApiResponse<PluginInfo[]>>('/plugins')
  return data.data || []
}

export async function togglePlugin(id: string, enabled: boolean): Promise<void> {
  await api.put(`/plugins/${encodeURIComponent(id)}/toggle`, { enabled })
}

export async function fetchPluginSkills(pluginId: string): Promise<SkillSummary[]> {
  const { data } = await api.get<ApiResponse<SkillSummary[]>>(`/plugins/${encodeURIComponent(pluginId)}/skills`)
  return data.data || []
}

// ===== Skill =====
export async function fetchSkillDetail(skillId: string): Promise<SkillDetail | null> {
  const { data } = await api.get<ApiResponse<SkillDetail>>(`/skills/${encodeURIComponent(skillId)}`)
  return data.data || null
}

export async function saveSkill(skillId: string, frontmatter: SkillFrontmatter, body: string): Promise<void> {
  await api.put(`/skills/${encodeURIComponent(skillId)}`, { frontmatter, body })
}

export async function createNewSkill(
  pluginId: string,
  folderName: string,
  frontmatter: SkillFrontmatter,
  body: string
): Promise<string | null> {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/skills', {
    pluginId, folderName, frontmatter, body
  })
  return data.data?.id || null
}

export async function removeSkill(skillId: string): Promise<void> {
  await api.delete(`/skills/${encodeURIComponent(skillId)}`)
}

// ===== 市场 =====
export async function fetchMarketplaces(): Promise<MarketplaceInfo[]> {
  const { data } = await api.get<ApiResponse<MarketplaceInfo[]>>('/marketplaces')
  return data.data || []
}

export async function fetchMarketplacePlugins(marketplaceId: string): Promise<MarketplacePlugin[]> {
  const { data } = await api.get<ApiResponse<MarketplacePlugin[]>>(`/marketplaces/${encodeURIComponent(marketplaceId)}/plugins`)
  return data.data || []
}

export async function installMarketplacePlugin(
  marketplaceId: string,
  pluginName: string,
  sourceUrl: string
): Promise<void> {
  await api.post('/marketplaces/install', { marketplaceId, pluginName, sourceUrl })
}

// ===== 历史 =====
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const { data } = await api.get<ApiResponse<HistoryEntry[]>>('/history')
  return data.data || []
}

export async function rollbackHistory(historyId: string): Promise<void> {
  await api.post(`/history/rollback/${encodeURIComponent(historyId)}`)
}

// ===== 导入导出 =====
export async function exportSkills(skillIds: string[]): Promise<string> {
  const { data } = await api.post<ApiResponse<{ path: string }>>('/export', { skillIds })
  return data.data?.path || ''
}

export async function importSkills(zipPath: string, targetPluginId: string): Promise<{ imported: string[] }> {
  const { data } = await api.post<ApiResponse<{ imported: string[] }>>('/import', { zipPath, targetPluginId })
  return data.data || { imported: [] }
}
```

---

## 阶段五：前端页面

### Task 11: 插件管理页

**文件:**
- 创建: `src/pages/PluginList.tsx`
- 创建: `src/components/PluginCard.tsx`

- [ ] **Step 1: 创建 PluginCard 组件**

```typescript
import { Card, Switch, Tag, List, Typography, Space, Button, Popconfirm } from 'antd'
import { CaretDownOutlined, CaretRightOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PluginInfo } from '../lib/types'

interface Props {
  plugin: PluginInfo
  expanded: boolean
  onToggleExpand: () => void
  onToggleEnabled: (enabled: boolean) => void
  onEditSkill: (skillId: string) => void
  onDeleteSkill: (skillId: string) => void
}

export default function PluginCard({ plugin, expanded, onToggleExpand, onToggleEnabled, onEditSkill, onDeleteSkill }: Props) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      title={
        <Space>
          <Button
            type="text"
            size="small"
            icon={expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            onClick={onToggleExpand}
          />
          <span style={{ fontWeight: 600 }}>{plugin.name}</span>
          <Tag color="blue">{plugin.version}</Tag>
          <Typography.Text type="secondary">
            {plugin.skillCount} 个技能
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {plugin.marketplace}
          </Typography.Text>
        </Space>
      }
      extra={
        <Space>
          <Switch
            checked={plugin.enabled}
            onChange={onToggleEnabled}
            checkedChildren="已启用"
            unCheckedChildren="已禁用"
          />
        </Space>
      }
    >
      {expanded && (
        <List
          size="small"
          dataSource={plugin.skills}
          renderItem={skill => (
            <List.Item
              actions={[
                <Button type="link" icon={<EditOutlined />} onClick={() => onEditSkill(skill.id)}>
                  编辑
                </Button>,
                <Popconfirm
                  title="确定删除这个技能？"
                  description={`将删除 ${skill.name} 的 SKILL.md 文件`}
                  onConfirm={() => onDeleteSkill(skill.id)}
                  okText="确定删除"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={skill.name}
                description={skill.description || '无描述'}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
```

- [ ] **Step 2: 创建 PluginList 页面**

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Spin, message } from 'antd'
import PluginCard from '../components/PluginCard'
import { fetchPlugins, togglePlugin, removeSkill } from '../lib/api'
import type { PluginInfo } from '../lib/types'

export default function PluginList() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    loadPlugins()
  }, [])

  async function loadPlugins() {
    setLoading(true)
    try {
      const data = await fetchPlugins()
      setPlugins(data)
    } catch (err) {
      message.error('加载插件列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(plugin: PluginInfo, enabled: boolean) {
    try {
      await togglePlugin(plugin.id, enabled)
      setPlugins(prev =>
        prev.map(p => p.id === plugin.id ? { ...p, enabled } : p)
      )
      message.success(`${enabled ? '启用' : '禁用'} ${plugin.name} 成功`)
    } catch {
      message.error('操作失败')
    }
  }

  function handleExpand(pluginId: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(pluginId)) next.delete(pluginId)
      else next.add(pluginId)
      return next
    })
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      await removeSkill(skillId)
      message.success('技能已删除')
      loadPlugins()
    } catch {
      message.error('删除失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Typography.Title level={4}>已安装插件</Typography.Title>
      {plugins.length === 0 ? (
        <Typography.Text type="secondary">暂无已安装插件</Typography.Text>
      ) : (
        plugins.map(plugin => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            expanded={expandedIds.has(plugin.id)}
            onToggleExpand={() => handleExpand(plugin.id)}
            onToggleEnabled={(enabled) => handleToggle(plugin, enabled)}
            onEditSkill={(skillId) => navigate(`/editor/${encodeURIComponent(skillId)}`)}
            onDeleteSkill={handleDeleteSkill}
          />
        ))
      )}
    </div>
  )
}
```

---

### Task 12: Skill 编辑器页

**文件:**
- 创建: `src/pages/SkillEditor.tsx`

- [ ] **Step 1: 创建 SkillEditor 页面**

```typescript
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, Space, Typography, Spin, message, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchSkillDetail, saveSkill } from '../lib/api'
import type { SkillDetail } from '../lib/types'

export default function SkillEditor() {
  const { skillId } = useParams<{ skillId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    if (!skillId) return
    loadSkill(decodeURIComponent(skillId))
  }, [skillId])

  async function loadSkill(id: string) {
    setLoading(true)
    try {
      const data = await fetchSkillDetail(id)
      if (!data) {
        message.error('技能未找到')
        navigate('/plugins')
        return
      }
      setDetail(data)
      setEditName(data.frontmatter.name)
      setEditDesc(data.frontmatter.description)
      setEditBody(data.body)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!skillId) return
    setSaving(true)
    try {
      await saveSkill(decodeURIComponent(skillId), { name: editName, description: editDesc }, editBody)
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  if (!detail) return null

  // 构建完整 Markdown 用于预览
  const previewContent = [
    '---',
    `name: ${editName}`,
    `description: "${editDesc}"`,
    '---',
    '',
    editBody
  ].join('\n')

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/plugins')}>
          返回列表
        </Button>
        <Typography.Text strong>编辑 SKILL.md</Typography.Text>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存
        </Button>
      </Space>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Typography.Text strong>基本信息</Typography.Text>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary">名称</Typography.Text>
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div style={{ flex: 2 }}>
            <Typography.Text type="secondary">描述</Typography.Text>
            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <Typography.Text strong>Markdown 源码</Typography.Text>
          </div>
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={editBody}
            onChange={val => setEditBody(val || '')}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, overflow: 'auto', padding: 24 }}>
          <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
            <Typography.Text strong>👁 实时预览</Typography.Text>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {previewContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 13: 仪表盘 + 市场页 + 历史页

**文件:**
- 创建: `src/pages/Dashboard.tsx`
- 创建: `src/pages/Marketplace.tsx`
- 创建: `src/pages/History.tsx`

- [ ] **Step 1: 创建仪表盘 Dashboard.tsx**

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Typography, List, Spin, Tag } from 'antd'
import { AppstoreOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons'
import { fetchPlugins } from '../lib/api'
import { fetchHistory } from '../lib/api'
import type { PluginInfo, HistoryEntry } from '../lib/types'

export default function Dashboard() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [p, h] = await Promise.all([fetchPlugins(), fetchHistory()])
      setPlugins(p)
      setHistory(h)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const totalSkills = plugins.reduce((sum, p) => sum + p.skillCount, 0)
  const enabledPlugins = plugins.filter(p => p.enabled).length

  return (
    <div>
      <Typography.Title level={4}>仪表盘</Typography.Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已安装插件"
              value={plugins.length}
              prefix={<AppstoreOutlined />}
              suffix={`/ 启用 ${enabledPlugins}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="技能总数"
              value={totalSkills}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="操作记录"
              value={history.length}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="插件概览" extra={<a onClick={() => navigate('/plugins')}>查看全部 →</a>}>
            <List
              size="small"
              dataSource={plugins}
              renderItem={p => (
                <List.Item>
                  <List.Item.Meta
                    title={p.name}
                    description={`v${p.version} · ${p.skillCount} 个技能`}
                  />
                  <Tag color={p.enabled ? 'green' : 'red'}>
                    {p.enabled ? '已启用' : '已禁用'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近操作" extra={<a onClick={() => navigate('/history')}>查看全部 →</a>}>
            <List
              size="small"
              dataSource={history.slice(0, 5)}
              renderItem={h => (
                <List.Item>
                  <List.Item.Meta
                    title={h.description}
                    description={new Date(h.timestamp).toLocaleString('zh-CN')}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无操作记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
```

- [ ] **Step 2: 创建市场页 Marketplace.tsx**

```typescript
import { useState, useEffect } from 'react'
import { Card, List, Button, Tag, Typography, Spin, Input, message, Space } from 'antd'
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { fetchMarketplaces, fetchMarketplacePlugins, installMarketplacePlugin } from '../lib/api'
import type { MarketplaceInfo, MarketplacePlugin } from '../lib/types'

export default function Marketplace() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceInfo[]>([])
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMarketplaces()
  }, [])

  async function loadMarketplaces() {
    setLoading(true)
    try {
      const mps = await fetchMarketplaces()
      setMarketplaces(mps)
      // 加载第一个市场的插件
      if (mps.length > 0) {
        const p = await fetchMarketplacePlugins(mps[0].id)
        setPlugins(p)
      }
    } catch {
      message.error('加载市场失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleInstall(mp: MarketplacePlugin) {
    setInstalling(mp.id)
    try {
      // sourceUrl 需要从市场源获取
      const sourceUrl = `https://github.com/${mp.marketplace}`.replace('marketplace', mp.name)
      await installMarketplacePlugin(mp.marketplace, mp.name, sourceUrl)
      message.success(`${mp.name} 安装成功`)
    } catch {
      message.error('安装失败')
    } finally {
      setInstalling(null)
    }
  }

  const filteredPlugins = plugins.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>技能市场</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={loadMarketplaces}>刷新</Button>
      </Space>

      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索插件..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
      ) : (
        <List
          dataSource={filteredPlugins}
          renderItem={item => (
            <Card size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Tag style={{ marginLeft: 8 }}>{item.version}</Tag>
                  <br />
                  <Typography.Text type="secondary">{item.description}</Typography.Text>
                </div>
                <Button
                  type={item.installed ? 'default' : 'primary'}
                  icon={<DownloadOutlined />}
                  loading={installing === item.id}
                  disabled={item.installed}
                  onClick={() => handleInstall(item)}
                >
                  {item.installed ? '已安装' : '安装'}
                </Button>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建历史页 History.tsx**

```typescript
import { useState, useEffect } from 'react'
import { Timeline, Button, Typography, Spin, message, Popconfirm, Tag, Empty } from 'antd'
import { RollbackOutlined, HistoryOutlined } from '@ant-design/icons'
import { fetchHistory, rollbackHistory } from '../lib/api'
import type { HistoryEntry } from '../lib/types'

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading(true)
    try {
      const data = await fetchHistory()
      setEntries(data)
    } catch {
      message.error('加载历史失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRollback(entry: HistoryEntry) {
    try {
      await rollbackHistory(entry.id)
      message.success('回滚成功')
      loadHistory()
    } catch {
      message.error('回滚失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const actionLabels: Record<string, string> = {
    'edit-skill': '编辑技能',
    'create-skill': '创建技能',
    'delete-skill': '删除技能',
    'install-plugin': '安装插件',
    'toggle-plugin': '切换插件状态'
  }

  return (
    <div>
      <Typography.Title level={4}>
        <HistoryOutlined /> 操作历史
      </Typography.Title>

      {entries.length === 0 ? (
        <Empty description="暂无操作记录" />
      ) : (
        <Timeline
          items={entries.map(entry => ({
            color: entry.rolledBack ? 'gray' : 'blue',
            children: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Text>
                    {actionLabels[entry.action] || entry.action}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    {entry.description}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(entry.timestamp).toLocaleString('zh-CN')}
                  </Typography.Text>
                  {entry.rolledBack && <Tag color="orange" style={{ marginLeft: 8 }}>已回滚</Tag>}
                </div>
                {!entry.rolledBack && (
                  <Popconfirm
                    title="确定回滚到此操作前？"
                    description="将恢复操作前的文件状态"
                    onConfirm={() => handleRollback(entry)}
                    okText="确定回滚"
                    cancelText="取消"
                  >
                    <Button size="small" icon={<RollbackOutlined />} danger>
                      回滚
                    </Button>
                  </Popconfirm>
                )}
              </div>
            )
          }))}
        />
      )}
    </div>
  )
}
```

---

## 阶段六：集成与验证

### Task 14: 后端端口传递 + 前端连接

**文件:**
- 修改: `electron/main.ts`
- 修改: `electron/preload.ts`
- 修改: `src/lib/api.ts`

- [ ] **Step 1: 修改 main.ts 传递端口**

在 `electron/main.ts` 的 `createWindow` 中添加 IPC handler：

```typescript
// 在 createWindow 函数前添加：
import { getServerPort } from './server'

// 在 app.whenReady() 的 createWindow 之前添加 ipcMain handlers:
import { ipcMain } from 'electron'

ipcMain.handle('get-backend-port', () => {
  return getServerPort()
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
```

- [ ] **Step 2: 修改 api.ts 使用动态端口**

```typescript
// 将 api.ts 中的硬编码端口替换为动态获取：
let API_BASE = 'http://127.0.0.1:3001/api'

export async function initApiBase(): Promise<void> {
  try {
    const port = await window.electronAPI.getBackendPort()
    API_BASE = `http://127.0.0.1:${port}/api`
  } catch {
    // fallback to default
  }
}
```

- [ ] **Step 3: 修改 main.tsx 在启动时初始化 API**

```typescript
// 在 render 之前调用
import { initApiBase } from './lib/api'

async function bootstrap() {
  await initApiBase()
  // ... render
}
bootstrap()
```

---

### Task 15: 启动验证 + 打包

- [ ] **Step 1: 启动开发模式验证**

```bash
cd "c:/Users/14531/Desktop/project/skill manage"
npm run dev
```

期望：
1. Electron 窗口正常打开
2. 左侧导航显示仪表盘、插件管理、技能市场、操作历史
3. 插件管理页显示 superpowers 和 claude-hud 卡片
4. 展开 superpowers 可看到 14 个 skill
5. 开关可切换插件启用状态

- [ ] **Step 2: 验证编辑器功能**

1. 点击某个 skill 的"编辑"按钮
2. Monaco 编辑器显示 Markdown 内容
3. 右侧显示实时预览
4. 修改内容后点击保存
5. 确认文件实际被修改

- [ ] **Step 3: 验证历史与回滚**

1. 进入操作历史页
2. 确认刚才的编辑操作被记录
3. 点击回滚，确认文件恢复

- [ ] **Step 4: 打包**

```bash
npm run electron:build
```

期望：在 `release/` 目录下生成 `Skill Manager Setup x.x.x.exe`

---

## 验证清单

| # | 验证项 | 预期 |
|---|---|---|
| 1 | `npm run dev` 启动 | Electron 窗口打开，显示主界面 |
| 2 | 插件列表 | 显示 superpowers (14 skills) + claude-hud (2 commands) |
| 3 | 开关切换 | settings.json 中 enabledPlugins 正确更新 |
| 4 | Skill 编辑器 | Monaco 编辑 + Markdown 预览分栏显示 |
| 5 | 编辑器保存 | SKILL.md 文件实际内容变更 |
| 6 | 操作历史 | 生成新的历史记录条 |
| 7 | 回滚 | 文件恢复到操作前状态 |
| 8 | `npm run electron:build` | 生成 .exe 安装包 |
