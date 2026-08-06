import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { backupFile } from './backup-service'

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json')
const INSTALLED_PLUGINS_PATH = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json')

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

/**
 * 新建插件：创建目录结构并注册
 */
export async function createPlugin(
  name: string,
  marketplace: string,
  description?: string
): Promise<string> {
  const pluginId = `${name}@${marketplace}`
  const installPath = path.join(os.homedir(), '.claude', 'plugins', 'cache', marketplace, name)

  if (await fs.pathExists(installPath)) {
    throw new Error(`插件目录已存在: ${installPath}`)
  }

  // 创建目录结构
  await fs.ensureDir(path.join(installPath, '.claude-plugin'))
  await fs.ensureDir(path.join(installPath, 'skills'))

  // 创建 plugin.json
  const pluginJson = {
    name,
    version: '0.1.0',
    description: description || '',
    skills: './skills/'
  }
  await fs.writeFile(
    path.join(installPath, '.claude-plugin', 'plugin.json'),
    JSON.stringify(pluginJson, null, 2),
    'utf-8'
  )

  // 注册到 installed_plugins.json
  let installedPlugins: Record<string, any> = { version: 2, plugins: {} }
  try {
    if (await fs.pathExists(INSTALLED_PLUGINS_PATH)) {
      const raw = await fs.readFile(INSTALLED_PLUGINS_PATH, 'utf-8')
      installedPlugins = JSON.parse(raw)
    }
  } catch {}
  if (!installedPlugins.plugins) installedPlugins.plugins = {}
  installedPlugins.plugins[pluginId] = [{
    scope: 'user',
    installPath,
    version: '0.1.0',
    gitCommitSha: ''
  }]
  await fs.writeFile(INSTALLED_PLUGINS_PATH, JSON.stringify(installedPlugins, null, 2), 'utf-8')

  // 启用
  await togglePlugin(pluginId, true)

  await backupFile(INSTALLED_PLUGINS_PATH, 'create-plugin', `新建插件 ${pluginId}`)

  return pluginId
}

/**
 * 删除插件：从 installed_plugins.json 和 settings.json 中移除
 */
export async function removePlugin(pluginId: string): Promise<void> {
  // 备份
  await backupFile(INSTALLED_PLUGINS_PATH, 'delete-plugin', `删除插件 ${pluginId}`)

  // 从 installed_plugins.json 删除
  try {
    const raw = await fs.readFile(INSTALLED_PLUGINS_PATH, 'utf-8')
    const data = JSON.parse(raw)
    if (data.plugins) {
      delete data.plugins[pluginId]
    }
    await fs.writeFile(INSTALLED_PLUGINS_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch {}

  // 从 settings.json 的 enabledPlugins 删除
  const settings = await getSettings()
  const enabledPlugins: Record<string, boolean> = (settings.enabledPlugins as Record<string, boolean>) || {}
  delete enabledPlugins[pluginId]
  settings.enabledPlugins = enabledPlugins
  await saveSettings(settings)
}
