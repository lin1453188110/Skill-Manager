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
