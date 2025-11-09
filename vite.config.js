import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/postcss'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'api-server',
      configureServer(server) {
        // 确保数据目录存在
        fs.mkdir(DATA_DIR, { recursive: true })

        server.middlewares.use(async (req, res, next) => {
          // 处理读取请求
          if (req.url.startsWith('/api/read/')) {
            const filename = req.url.split('/api/read/')[1]
            const filePath = path.join(DATA_DIR, filename)

            try {
              const data = await fs.readFile(filePath, 'utf-8')
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

          // 处理写入请求
          if (req.url.startsWith('/api/write/') && req.method === 'POST') {
            const filename = req.url.split('/api/write/')[1]
            const filePath = path.join(DATA_DIR, filename)

            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                await fs.writeFile(filePath, body, 'utf-8')
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true }))
              } catch (error) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: error.message }))
              }
            })
            return
          }

          next()
        })
      }
    }
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss
      ]
    }
  },
  server: {
    port: 3000
  }
})
