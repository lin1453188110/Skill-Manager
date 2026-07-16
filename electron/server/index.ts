import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { registerPluginRoutes } from './routes/plugins'
import { registerSkillRoutes } from './routes/skills'
import { registerMarketplaceRoutes } from './routes/marketplace'
import { registerHistoryRoutes } from './routes/history'

let serverPort: number | null = null

export function getServerPort(): number | null {
  return serverPort
}

export async function startServer(): Promise<number> {
  const app = express()

  app.use(express.json())

  // API 路由
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })
  registerPluginRoutes(app)
  registerSkillRoutes(app)
  registerMarketplaceRoutes(app)
  registerHistoryRoutes(app)

  // 前端静态文件 — 放在路由后面，避免拦截 API
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA 回退：非 API 请求都返回 index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  const tryPorts = [3001, 3002, 3003, 3004, 3005]

  return new Promise((resolve, reject) => {
    function tryListen(index: number) {
      if (index >= tryPorts.length) {
        reject(new Error('所有端口均被占用'))
        return
      }
      const port = tryPorts[index]
      const server = createServer(app)
      server.listen(port, '127.0.0.1', () => {
        serverPort = port
        console.log(`Skill Manager: http://127.0.0.1:${serverPort}`)
        resolve(serverPort)
      })
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          tryListen(index + 1)
        } else {
          reject(err)
        }
      })
    }
    tryListen(0)
  })
}
