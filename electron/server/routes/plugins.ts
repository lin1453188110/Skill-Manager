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
