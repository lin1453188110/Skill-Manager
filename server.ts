import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { registerPluginRoutes } from './electron/server/routes/plugins'
import { registerSkillRoutes } from './electron/server/routes/skills'
import { registerMarketplaceRoutes } from './electron/server/routes/marketplace'
import { registerHistoryRoutes } from './electron/server/routes/history'

const app = express()
app.use(express.json())

// API
app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }))
registerPluginRoutes(app)
registerSkillRoutes(app)
registerMarketplaceRoutes(app)
registerHistoryRoutes(app)

// 前端静态文件
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

// 启动
const PORT = 3001
const server = createServer(app)
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  🛠️  Skill Manager 已启动`)
  console.log(`  👉 http://127.0.0.1:${PORT}\n`)
})
