// Skill Manager Launcher
// 启动服务器 + 自动打开浏览器
const { exec } = require('child_process')
require('./dist-server/bundle.cjs')

// 给服务器一点启动时间，然后打开浏览器
setTimeout(() => {
  const url = 'http://127.0.0.1:3001'
  const platform = process.platform
  if (platform === 'win32') {
    exec(`start ${url}`)
  } else if (platform === 'darwin') {
    exec(`open ${url}`)
  } else {
    exec(`xdg-open ${url}`)
  }
}, 1500)
