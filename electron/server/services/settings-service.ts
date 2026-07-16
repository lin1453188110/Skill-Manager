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
