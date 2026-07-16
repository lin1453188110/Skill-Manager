import { app, BrowserWindow } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import { startServer, getServerPort } from './server'

let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

async function createWindow() {
  const port = getServerPort()

  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      },
      title: 'Skill Manager'
    })

    if (VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(VITE_DEV_SERVER_URL)
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.loadURL(`http://127.0.0.1:${port}`)
    }

    mainWindow.on('closed', () => { mainWindow = null })
  } catch (err: any) {
    // 窗口创建失败，自动打开浏览器
    console.error('窗口创建失败，打开浏览器:', err?.message || err)
    exec(`start http://127.0.0.1:${port}`)
  }
}

// 顶层 try/catch：处理 require('electron') 根本不可用的情况
if (app && BrowserWindow) {
  app.whenReady().then(async () => {
    await startServer()
    await createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
} else {
  // 回退：纯 HTTP 服务器 + 浏览器
  startServer().then(port => {
    exec(`start http://127.0.0.1:${port}`)
  })
}
