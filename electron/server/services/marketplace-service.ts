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

// 中文描述映射表（静态引入，确保被 esbuild 内联）
import chineseDescMap from './chinese-descriptions.json'

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
    return {
      id: key,
      name,
      description: cnDesc || enDesc,
      version: p.marketplace_entry?.source?.ref || 'latest',
      marketplace: 'claude-plugins-official',
      installed: installedNames.has(p.plugin || ''),
      sourceUrl: p.marketplace_entry?.source?.url || '',
      category: p.marketplace_entry?.category || '',
      installs: p.unique_installs || 0
    }
  })
}

export async function installPlugin(
  marketplaceId: string,
  pluginName: string,
  sourceUrl: string
): Promise<boolean> {
  const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', marketplaceId, pluginName)
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json')
  const installedPluginsPath = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json')

  await backupFile(settingsPath, 'install-plugin', `安装 ${pluginName}`)

  // 如果已存在则 git pull，否则 git clone
  if (await fs.pathExists(path.join(cacheDir, '.git'))) {
    const git = simpleGit(cacheDir)
    await git.pull()
  } else {
    await fs.ensureDir(cacheDir)
    await simpleGit().clone(sourceUrl, cacheDir)
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
    installPath: cacheDir,
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

  return true
}
