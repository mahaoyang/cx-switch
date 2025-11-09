#!/usr/bin/env node

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import open from 'open'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🚀 Starting Codex Switch...')

// 启动 Vite 开发服务器
const vite = spawn('npm', ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
})

// 等待服务器启动后打开浏览器
setTimeout(() => {
  console.log('🌐 Opening browser at http://localhost:3000')
  open('http://localhost:3000')
}, 3000)

// 处理退出信号
const cleanup = () => {
  console.log('\n👋 Shutting down Codex Switch...')
  vite.kill()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

vite.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`)
    process.exit(code)
  }
})
