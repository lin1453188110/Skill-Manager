import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App'
import { initApiBase } from './lib/api'
import './index.css'

async function bootstrap() {
  try {
    await initApiBase()

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ConfigProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ConfigProvider>
      </React.StrictMode>
    )
    console.log('[Skill Manager] React 渲染完成')
  } catch (e: any) {
    console.error('[Skill Manager] 启动失败:', e.message, e.stack)
    const el = document.getElementById('error-fallback')
    if (el) {
      el.style.display = 'block'
      el.innerHTML = '❌ 启动错误:\n' + e.message + '\n\n' + (e.stack || '')
    }
  }
}

bootstrap()
