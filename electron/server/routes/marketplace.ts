import { Express, Request, Response } from 'express'
import { getMarketplaces, getMarketplacePlugins, getOfficialMarketplacePlugins, installPlugin } from '../services/marketplace-service'

export function registerMarketplaceRoutes(app: Express): void {
  // Claude 官方插件市场
  app.get('/api/marketplaces/official/plugins', async (_req: Request, res: Response) => {
    try {
      const plugins = await getOfficialMarketplacePlugins()
      res.json({ success: true, data: plugins })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
  app.get('/api/marketplaces', async (_req: Request, res: Response) => {
    try {
      const marketplaces = await getMarketplaces()
      res.json({ success: true, data: marketplaces })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.get('/api/marketplaces/:id/plugins', async (req: Request, res: Response) => {
    try {
      const plugins = await getMarketplacePlugins(req.params.id)
      res.json({ success: true, data: plugins })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.post('/api/marketplaces/install', async (req: Request, res: Response) => {
    try {
      const { marketplaceId, pluginName, sourceUrl } = req.body
      const success = await installPlugin(marketplaceId, pluginName, sourceUrl)
      res.json({ success: true, data: { installed: success } })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
