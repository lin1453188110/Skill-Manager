import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import { MarketplaceInfo, MarketplacePlugin } from '../../../src/lib/types'
import { backupFile } from './backup-service'
import { getAllPlugins } from './plugin-scanner'

const MARKETPLACES_DIR = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces')
const KNOWN_MARKETPLACES_PATH = path.join(os.homedir(), '.claude', 'plugins', 'known_marketplaces.json')
const OFFICIAL_CATALOG_PATH = path.join(os.homedir(), '.claude', 'plugins', 'plugin-catalog-cache.json')
const PLUGINS_CACHE = path.join(os.homedir(), '.claude', 'plugins', 'cache')

// 官方市场 Git 仓库（所有相对路径插件均来自此仓库）
const OFFICIAL_REPO_URL = 'https://github.com/anthropics/claude-plugins-official.git'
const OFFICIAL_REPO_CACHE = path.join(PLUGINS_CACHE, 'claude-plugins-official', '_repo')

// 中文描述映射表（静态引入，确保被 esbuild 内联）
import chineseDescMap from './chinese-descriptions.json'

// ===== 安装进度跟踪 =====
export interface InstallProgress {
  key: string
  status: 'pending' | 'cloning' | 'zipping' | 'done' | 'error'
  percent: number
  message: string
}

const progressMap = new Map<string, InstallProgress>()

export function setProgress(key: string, status: InstallProgress['status'], percent: number, message: string): void {
  progressMap.set(key, { key, status, percent, message })
}

export function getProgress(key: string): InstallProgress | null {
  return progressMap.get(key) || null
}

export function clearProgress(key: string): void {
  progressMap.delete(key)
}

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

  const installed = await getAllPlugins()
  const installedNames = new Set(installed.map(p => p.name))

  return plugins.map((p: { name: string; description?: string; version?: string; source?: { url?: string } }) => ({
    id: p.name,
    name: p.name,
    description: p.description || '',
    version: p.version || 'latest',
    marketplace: marketplaceId,
    installed: installedNames.has(p.name),
    sourceUrl: p.source?.url || `https://github.com/${p.name}.git`
  }))
}

/**
 * 获取 Claude 官方插件市场
 */
export async function getOfficialMarketplacePlugins(): Promise<MarketplacePlugin[]> {
  if (!(await fs.pathExists(OFFICIAL_CATALOG_PATH))) return []

  const raw = await fs.readFile(OFFICIAL_CATALOG_PATH, 'utf-8')
  const catalog = JSON.parse(raw)
  const plugins = catalog.catalog?.plugins || {}

  const installed = await getAllPlugins()
  const installedNames = new Set(installed.map(p => p.name))

  return Object.entries(plugins).map(([key, p]: [string, any]) => {
    const name = p.marketplace_entry?.name || p.plugin || key
    const enDesc = p.marketplace_entry?.description || ''
    const cnDesc = chineseDescMap[name] || ''
    const src = p.marketplace_entry?.source || {}

    // 判断 source 类型并构建 sourceUrl
    let sourceUrl = src.url || ''
    let sourceType = src.source || 'url'

    if (src.source === 'git-subdir') {
      // git-subdir：独立仓库中的子目录（有自己的 git URL）
      sourceUrl = src.url
      sourceType = 'git-subdir'
    } else if (typeof src.source === 'string' && src.source.startsWith('.')) {
      // 相对路径：来自官方大仓库 anthropics/claude-plugins-official
      sourceUrl = OFFICIAL_REPO_URL
      sourceType = 'git-subdir'
    } else if (src.source === 'github') {
      // GitHub 仓库类型
      sourceUrl = `https://github.com/${src.repo}.git`
      sourceType = 'github'
    }

    return {
      id: key,
      name,
      description: cnDesc || enDesc,
      version: src.ref || 'latest',
      marketplace: 'claude-plugins-official',
      installed: installedNames.has(p.plugin || ''),
      sourceUrl,
      sourceType,
      sourcePath: src.path || '',
      category: p.marketplace_entry?.category || '',
      installs: p.unique_installs || 0
    }
  })
}

/**
 * 删除目录，遇文件占用时重试
 */
async function removeDirRetry(dir: string): Promise<void> {
  for (let i = 0; i < 3; i++) {
    try {
      await fs.remove(dir)
      return
    } catch {
      // 等待文件解锁后重试
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  // 最后尝试强制删除
  await fs.remove(dir)
}

/**
 * 判断是否为 GitHub 仓库 URL
 */
function isGithubUrl(url: string): boolean {
  return /^https:\/\/github\.com\//.test(url)
}

/**
 * 从 GitHub URL 生成 zip 下载地址
 * https://github.com/user/repo.git -> https://github.com/user/repo/archive/refs/heads/main.zip
 */
function githubUrlToZip(url: string): string | null {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/)
  if (!match) return null
  const [, user, repo] = match
  return `https://github.com/${user}/${repo}/archive/refs/heads/main.zip`
}

/**
 * 下载 GitHub 仓库 zip 并解压到目标目录
 * @param progressKey 进度跟踪 key
 */
async function downloadZipAndExtract(
  zipUrl: string,
  destDir: string,
  progressKey?: string
): Promise<void> {
  const tmpZip = path.join(os.tmpdir(), 'plugin-download-' + Date.now() + '.zip')
  const extractDir = path.join(os.tmpdir(), 'plugin-extract-' + Date.now())

  const report = (status: InstallProgress['status'], percent: number, message: string) => {
    if (progressKey) setProgress(progressKey, status, percent, message)
  }

  try {
    await removeDirRetry(destDir)
    await fs.ensureDir(destDir)
    await fs.ensureDir(extractDir)

    // 用 spawn 流式下载 zip，实时解析 curl 进度
    const { spawn } = require('child_process')
    const child = spawn('curl', ['-L', '--retry', '3', '--retry-delay', '3', '--connect-timeout', '30', '-sS', '-o', tmpZip, zipUrl])

    // curl 用 -sS 静默但显示错误，进度通过读取目标文件大小推断
    const totalUnknown = true
    let lastSize = 0
    const sizeTimer = setInterval(() => {
      try {
        const stat = fs.statSync(tmpZip)
        if (stat.size !== lastSize) {
          lastSize = stat.size
          // 不知道总大小，显示已下载 MB 数
          report('zipping', 15, `正在下载 zip... ${(stat.size / 1024 / 1024).toFixed(1)} MB`)
        }
      } catch {
        // 文件还没创建
      }
    }, 500)

    const exitCode: number = await new Promise((resolve, reject) => {
      child.on('close', (code: number) => resolve(code))
      child.on('error', (err: any) => reject(err))
    })
    clearInterval(sizeTimer)

    if (exitCode !== 0) {
      throw new Error(`zip 下载失败 (curl 退出码 ${exitCode})`)
    }

    if (!(await fs.pathExists(tmpZip))) {
      throw new Error('zip 下载失败')
    }

    report('zipping', 80, '下载完成，正在解压...')

    // 解压
    const extractZip = require('extract-zip')
    await extractZip(tmpZip, { dir: extractDir })

    // zip 内含一个顶层文件夹（如 codegraph-main），取其中的内容
    const entries = await fs.readdir(extractDir)
    if (entries.length === 0) throw new Error('zip 为空')

    const topDir = path.join(extractDir, entries[0])
    const isDir = (await fs.stat(topDir)).isDirectory()
    const sourceContent = isDir ? topDir : extractDir

    // 复制内容到目标目录
    report('zipping', 95, '正在复制文件...')
    await fs.copy(sourceContent, destDir)

    // 清理临时文件
    await fs.remove(tmpZip).catch(() => {})
    await fs.remove(extractDir).catch(() => {})
  } catch (err: any) {
    await fs.remove(tmpZip).catch(() => {})
    await fs.remove(extractDir).catch(() => {})
    throw err
  }
}

/**
 * 健壮克隆：先尝试 git clone，失败后自动降级为 zip 下载解压
 * @param progressKey 进度跟踪 key，可为空（不报告进度）
 */
async function robustClone(
  sourceUrl: string,
  destDir: string,
  progressKey?: string
): Promise<void> {
  const report = (status: InstallProgress['status'], percent: number, message: string) => {
    if (progressKey) setProgress(progressKey, status, percent, message)
  }

  // 先尝试 git clone 3 次
  let lastError: any
  for (const attempt of [0, 1, 2]) {
    try {
      await removeDirRetry(destDir)
      await fs.ensureDir(destDir)
      report('cloning', attempt === 0 ? 5 : 5 + attempt * 5, `git clone 尝试 ${attempt + 1}/3...`)

      // 使用 outputHandler 捕获 git 进度（git 进度输出在 stderr）
      await simpleGit().outputHandler((_command, _stdout, stderr) => {
        stderr.on('data', (chunk: Buffer) => {
          const text = chunk.toString()
          // 解析 "Receiving objects:  45% (55/123)"
          const m = text.match(/Receiving objects:\s*(\d+)%/)
          if (m && progressKey) {
            const pct = Math.min(90, 5 + Math.round(Number(m[1]) * 0.85))
            report('cloning', pct, `正在下载... ${m[1]}%`)
          }
          // 解析 "remote: Compressing objects: 60%"
          const cm = text.match(/Compressing objects:\s*(\d+)%/)
          if (cm && progressKey) {
            report('cloning', 3, `正在压缩对象... ${cm[1]}%`)
          }
        })
      }).clone(sourceUrl, destDir, [
        '--depth', '1',
        '--single-branch',
        '-c', 'http.postBuffer=524288000',
        '-c', 'http.lowSpeedLimit=0',
        '-c', 'http.lowSpeedTime=999999',
        '-c', 'core.compression=0'
      ])
      report('done', 100, 'git clone 完成')
      return
    } catch (err: any) {
      lastError = err
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
    }
  }

  // git 全部失败，尝试 zip 下载（仅 GitHub 仓库支持）
  const zipUrl = githubUrlToZip(sourceUrl)
  if (zipUrl) {
    try {
      report('zipping', 10, 'git clone 失败，改为下载 zip 包...')
      await downloadZipAndExtract(zipUrl, destDir, progressKey)
      report('done', 100, 'zip 下载并解压完成')
      return
    } catch (zipErr: any) {
      lastError = new Error(`git clone 失败 (${lastError?.message || ''})，zip 下载也失败 (${zipErr?.message || ''})`)
    }
  }

  throw lastError || new Error('安装失败')
}

/**
 * 安装插件 - 支持 url / git-subdir / github 三种 source 类型
 */
export async function installPlugin(
  marketplaceId: string,
  pluginName: string,
  sourceUrl: string,
  sourceType?: string,
  sourcePath?: string,
  progressKey?: string
): Promise<boolean> {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json')
  const installedPluginsPath = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json')

  if (progressKey) {
    setProgress(progressKey, 'pending', 0, '准备安装...')
  }
  await backupFile(settingsPath, 'install-plugin', `安装 ${pluginName}`)

  let actualInstallPath: string

  if (sourceType === 'git-subdir' && sourcePath) {
    // 子目录类型：克隆到独立缓存目录，避免不同 repo 冲突
    const repoHash = Buffer.from(sourceUrl).toString('base64').replace(/[/+=]/g, '').substring(0, 12)
    const repoCache = path.join(PLUGINS_CACHE, '_repo_' + repoHash)

    if (await fs.pathExists(path.join(repoCache, '.git'))) {
      try {
        const git = simpleGit(repoCache)
        await git.status()
      } catch {
        await robustClone(sourceUrl, repoCache, progressKey)
      }
    } else {
      await robustClone(sourceUrl, repoCache, progressKey)
    }
    actualInstallPath = path.join(repoCache, sourcePath)

    if (!(await fs.pathExists(actualInstallPath))) {
      throw new Error(`子目录 ${sourcePath} 在仓库中不存在`)
    }
  } else {
    // 独立仓库：直接克隆
    const cacheDir = path.join(PLUGINS_CACHE, marketplaceId, pluginName)
    actualInstallPath = cacheDir

    if (await fs.pathExists(path.join(cacheDir, '.git'))) {
      // 验证仓库是否有效，无效则删除重新克隆
      try {
        const git = simpleGit(cacheDir)
        await git.status()
        await git.pull()
      } catch {
        await robustClone(sourceUrl, cacheDir, progressKey)
      }
    } else {
      await robustClone(sourceUrl, cacheDir, progressKey)
    }
  }

  // 注册到 installed_plugins.json
  const pluginKey = `${pluginName}@${marketplaceId}`
  let installedPlugins: Record<string, any> = {}
  try {
    if (await fs.pathExists(installedPluginsPath)) {
      const raw = await fs.readFile(installedPluginsPath, 'utf-8')
      installedPlugins = JSON.parse(raw)
    }
  } catch {}

  if (!installedPlugins.plugins) installedPlugins.plugins = {}
  installedPlugins.plugins[pluginKey] = [{
    scope: 'user',
    installPath: actualInstallPath,
    version: 'latest',
    gitCommitSha: ''
  }]
  installedPlugins.version = 2
  await fs.writeFile(installedPluginsPath, JSON.stringify(installedPlugins, null, 2), 'utf-8')

  // 启用插件
  let settings: Record<string, any> = {}
  try {
    const raw = await fs.readFile(settingsPath, 'utf-8')
    settings = JSON.parse(raw)
  } catch {}
  if (!settings.enabledPlugins) settings.enabledPlugins = {}
  settings.enabledPlugins[pluginKey] = true
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')

  if (progressKey) {
    setProgress(progressKey, 'done', 100, '安装完成')
  }
  return true
}
