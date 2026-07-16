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
