import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import archiver from 'archiver'
import { ExportManifest } from '../../../src/lib/types'
import { getSkillDetail } from './skill-service'
import { createSkill } from './skill-service'

/**
 * 导出选中的 skill 为 .zip 文件
 * @returns zip 文件路径（在桌面上）
 */
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

    // 用 skill 的文件夹名创建目录
    const folderName = path.basename(path.dirname(detail.filePath))
    const skillDir = path.join(exportDir, folderName)
    await fs.ensureDir(skillDir)
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), detail.rawContent, 'utf-8')

    manifest.skills.push({
      name: folderName,
      pluginName: detail.pluginId,
      frontmatter: detail.frontmatter,
      body: detail.body
    })
  }

  if (manifest.skills.length === 0) {
    await fs.remove(exportDir)
    throw new Error('没有找到可导出的技能')
  }

  // 写入 manifest
  await fs.writeFile(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  )

  // 打包为 zip 到桌面
  const zipFileName = `skills-export-${Date.now()}.zip`
  const zipPath = path.join(os.homedir(), 'Desktop', zipFileName)
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      // 清理临时目录
      fs.remove(exportDir).catch(() => {})
      resolve(zipPath)
    })
    archive.on('error', (err) => {
      fs.remove(exportDir).catch(() => {})
      reject(err)
    })
    archive.pipe(output)
    archive.directory(exportDir, 'skills')
    archive.finalize()
  })
}

/**
 * 从 .zip 文件导入 skill 到指定插件
 * @returns 导入成功的 skill id 列表
 */
export async function importSkills(
  zipPath: string,
  targetPluginId: string
): Promise<{ imported: string[]; errors: string[] }> {
  const extractDir = path.join(os.tmpdir(), 'skill-import-' + Date.now())
  const imported: string[] = []
  const errors: string[] = []

  // 解压
  try {
    const extractZip = require('extract-zip')
    await extractZip(zipPath, { dir: extractDir })
  } catch (err: any) {
    throw new Error('无法解压文件: ' + err.message)
  }

  // 查找 manifest.json — 可能在根目录或 skills 子目录
  let manifestPath = path.join(extractDir, 'manifest.json')
  if (!(await fs.pathExists(manifestPath))) {
    manifestPath = path.join(extractDir, 'skills', 'manifest.json')
  }
  if (!(await fs.pathExists(manifestPath))) {
    await fs.remove(extractDir)
    throw new Error('无效的导出包：缺少 manifest.json')
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf-8')
  const manifest: ExportManifest = JSON.parse(manifestRaw)
  const skillsBaseDir = path.dirname(manifestPath) // manifest 所在目录即 skill 文件夹所在目录

  for (const skill of manifest.skills) {
    const skillMdPath = path.join(skillsBaseDir, skill.name, 'SKILL.md')
    if (!(await fs.pathExists(skillMdPath))) {
      errors.push(`${skill.name}: SKILL.md 未找到`)
      continue
    }

    try {
      const newId = await createSkill(
        targetPluginId,
        skill.name,
        skill.frontmatter,
        skill.body
      )
      if (newId) {
        imported.push(newId)
      } else {
        errors.push(`${skill.name}: 目录已存在或插件无效`)
      }
    } catch (err: any) {
      errors.push(`${skill.name}: ${err.message}`)
    }
  }

  // 清理临时目录
  await fs.remove(extractDir)
  return { imported, errors }
}
