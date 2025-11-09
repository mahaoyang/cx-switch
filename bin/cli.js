#!/usr/bin/env node

import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFile, mkdir, writeFile } from 'fs/promises'
import open from 'open'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const DATA_DIR = join(os.homedir(), '.cx-switch')

console.log('🚀 Starting CX Switch...')

// 确保数据目录存在
await mkdir(DATA_DIR, { recursive: true })

const server = createServer(async (req, res) => {
  // API: 读取文件
  if (req.url.startsWith('/api/read/')) {
    const filename = req.url.split('/api/read/')[1]
    const filePath = join(DATA_DIR, filename)

    try {
      const data = await readFile(filePath, 'utf-8')
      res.setHeader('Content-Type', 'application/json')
      res.end(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'File not found' }))
      } else {
        res.statusCode = 500
        res.end(JSON.stringify({ error: error.message }))
      }
    }
    return
  }

  // API: 写入文件
  if (req.url.startsWith('/api/write/') && req.method === 'POST') {
    const filename = req.url.split('/api/write/')[1]
    const filePath = join(DATA_DIR, filename)

    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', async () => {
      try {
        await writeFile(filePath, body, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true }))
      } catch (error) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: error.message }))
      }
    })
    return
  }

  // 静态文件服务
  let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url)

  try {
    const content = await readFile(filePath)
    const ext = filePath.split('.').pop()
    const contentTypes = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    }

    res.setHeader('Content-Type', contentTypes[ext] || 'text/plain')
    res.end(content)
  } catch (error) {
    if (req.url !== '/' && error.code === 'ENOENT') {
      // SPA fallback
      try {
        const indexHtml = await readFile(join(distDir, 'index.html'))
        res.setHeader('Content-Type', 'text/html')
        res.end(indexHtml)
      } catch {
        res.statusCode = 404
        res.end('Not Found')
      }
    } else {
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }
})

const PORT = 3000

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
  console.log('🌐 Opening browser...')
  open(`http://localhost:${PORT}`)
})

// 处理退出信号
const cleanup = () => {
  console.log('\n👋 Shutting down CX Switch...')
  server.close()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
