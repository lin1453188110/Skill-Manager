// Skill Manager Launcher (跨平台)
// 自动检查依赖和构建产物，然后启动服务器并打开浏览器
const { exec, spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const URL = 'http://127.0.0.1:3001'

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts })
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} 退出码 ${code}`)))
    child.on('error', reject)
  })
}

async function main() {
  console.log('🛠️  Skill Manager 正在启动...')

  // 1. 检查 Node.js
  try {
    execSync('node --version', { stdio: 'ignore' })
  } catch {
    console.error('❌ 未检测到 Node.js，请先安装 https://nodejs.org/')
    process.exit(1)
  }

  // 2. 检查依赖
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    console.log('📦 正在安装依赖 (npm install)...')
    await run('npm', ['install'])
  }

  // 3. 检查前端构建产物
  if (!fs.existsSync(path.join(ROOT, 'dist'))) {
    console.log('🏗️  正在构建前端 (npm run build)...')
    await run('npm', ['run', 'build'])
  }

  // 4. 启动服务器
  console.log('✅ 启动成功，正在打开浏览器 ' + URL)
  const server = spawn('npm', ['run', 'dev:server'], { cwd: ROOT, stdio: 'inherit' })

  // 5. 等待启动后打开浏览器
  setTimeout(() => {
    const platform = process.platform
    if (platform === 'win32') exec(`start ${URL}`)
    else if (platform === 'darwin') exec(`open ${URL}`)
    else exec(`xdg-open ${URL}`)
  }, 2000)

  server.on('error', err => { console.error('❌ 启动失败:', err.message); process.exit(1) })
}

main()
