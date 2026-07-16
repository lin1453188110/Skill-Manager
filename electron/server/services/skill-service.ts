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
