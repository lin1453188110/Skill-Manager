import { Express, Request, Response } from 'express'
import { getSkillDetail, updateSkill, createSkill, deleteSkill } from '../services/skill-service'
import { exportSkills, importSkills } from '../services/export-service'

export function registerSkillRoutes(app: Express): void {
  // 导出 skill
  app.post('/api/export', async (req: Request, res: Response) => {
    try {
      const { skillIds } = req.body
      if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要导出的 skill ID 列表' })
      }
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
      if (!zipPath) {
        return res.status(400).json({ success: false, error: '请提供 zip 文件路径' })
      }
      if (!targetPluginId) {
        return res.status(400).json({ success: false, error: '请提供目标插件 ID' })
      }
      const result = await importSkills(zipPath, targetPluginId)
      res.json({ success: true, data: result })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

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
}
