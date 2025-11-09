#!/usr/bin/env node

import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFile, mkdir, writeFile } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import open from 'open'
import os from 'os'
import { generateCodexToml } from '../src/utils/codexConfig.js'

const execFileAsync = promisify(execFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const DATA_DIR = join(os.homedir(), '.cx-switch')
const CODEX_DIR_NAME = '.codex'

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

  // API: 系统信息
  if (req.url === '/api/system-info') {
    try {
      const info = await getSystemInfo()
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(info))
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: error.message }))
    }
    return
  }

  // API: 应用配置到 Codex 目录
  if (req.url === '/api/apply-config' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}')
        const { provider, globalConfig = {}, options = {} } = payload
        if (!provider) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing provider payload' }))
          return
        }

        const result = await applyCodexConfig({ provider, globalConfig, options })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, ...result }))
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

async function applyCodexConfig({ provider, globalConfig, options }) {
  const authJson = JSON.stringify(provider.auth || {}, null, 2)
  const configToml = generateCodexToml(provider, globalConfig)
  const systemInfo = await getSystemInfo()
  const targets = []

  await writeCodexFiles(systemInfo.primaryCodexDir, authJson, configToml)
  targets.push({
    type: 'primary',
    path: systemInfo.primaryCodexDir,
    platform: systemInfo.platform
  })

  if (options.dualSync && systemInfo.dualSyncAvailable) {
    if (systemInfo.platform === 'windows' && systemInfo.wsl?.canSync) {
      const linuxPath = await writeCodexFilesToWsl(systemInfo.wsl, authJson, configToml)
      targets.push({
        type: 'dual',
        path: linuxPath,
        platform: 'wsl'
      })
    } else if (systemInfo.dualSyncTargetPath) {
      await writeCodexFiles(systemInfo.dualSyncTargetPath, authJson, configToml)
      targets.push({
        type: 'dual',
        path: systemInfo.dualSyncTargetPath,
        platform: systemInfo.platform === 'windows' ? 'wsl' : 'windows'
      })
    }
  }

  return { targets, systemInfo }
}

async function writeCodexFiles(codexDir, authContent, configContent) {
  await mkdir(codexDir, { recursive: true })
  await writeFile(join(codexDir, 'auth.json'), authContent, 'utf-8')
  await writeFile(join(codexDir, 'config.toml'), configContent, 'utf-8')
}

async function writeCodexFilesToWsl(wslInfo, authContent, configContent) {
  if (!wslInfo?.defaultDistro || !wslInfo?.homeDir) {
    throw new Error('WSL information is incomplete, cannot sync')
  }

  const codexDir = ensurePosixPath(wslInfo.homeDir, CODEX_DIR_NAME)
  const authBase64 = Buffer.from(authContent, 'utf8').toString('base64')
  const configBase64 = Buffer.from(configContent, 'utf8').toString('base64')

  const script = `
set -e
CODEX_DIR=${shEscape(codexDir)}
mkdir -p "$CODEX_DIR"
printf '%s' ${shEscape(authBase64)} | base64 -d > "$CODEX_DIR/auth.json"
printf '%s' ${shEscape(configBase64)} | base64 -d > "$CODEX_DIR/config.toml"
`

  await execFileAsync('wsl.exe', ['-d', wslInfo.defaultDistro, '-e', 'sh', '-c', script])
  return codexDir
}

function ensurePosixPath(base, segment) {
  if (!base) return segment
  const cleanedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanedSegment = segment.startsWith('/') ? segment.slice(1) : segment
  return `${cleanedBase}/${cleanedSegment}`
}

function shEscape(str = '') {
  return `'${String(str).replace(/'/g, `'\"'\"'`)}'`
}

async function getSystemInfo() {
  const platform = detectPlatform()
  const primaryHomeDir = os.homedir()
  const primaryCodexDir = join(primaryHomeDir, CODEX_DIR_NAME)

  const info = {
    platform,
    primaryHomeDir,
    primaryCodexDir,
    dualSyncAvailable: false,
    dualSyncTargetPath: null,
    dualSyncTargetLabel: null,
    dualSyncReason: null,
    dualSyncTargetKind: null
  }

  if (platform === 'windows') {
    const wslInfo = await getWindowsWSLInfo()
    info.wsl = wslInfo
    if (wslInfo?.canSync && wslInfo.linuxCodexDir) {
      info.dualSyncAvailable = true
      info.dualSyncTargetPath = wslInfo.linuxCodexDir
      info.dualSyncTargetLabel = wslInfo.label
      info.dualSyncTargetKind = 'wsl'
    } else if (wslInfo?.error) {
      info.dualSyncReason = wslInfo.error
    }
  } else if (platform === 'wsl') {
    const windowsInfo = await getWindowsHostInfoFromWSL()
    info.windows = windowsInfo
    if (windowsInfo?.codexDir) {
      info.dualSyncAvailable = true
      info.dualSyncTargetPath = windowsInfo.codexDir
      info.dualSyncTargetLabel = windowsInfo.label || 'Windows'
      info.dualSyncTargetKind = 'windows'
    } else if (windowsInfo?.error) {
      info.dualSyncReason = windowsInfo.error
    }
  } else {
    info.dualSyncReason = 'Dual sync applies to Windows and WSL environments'
  }

  return info
}

function detectPlatform() {
  if (process.platform === 'win32') return 'windows'
  if (process.platform === 'darwin') return 'macos'
  if (process.platform === 'linux' && isWSL()) return 'wsl'
  if (process.platform === 'linux') return 'linux'
  return process.platform
}

function isWSL() {
  if (process.platform !== 'linux') return false
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true
  return os.release().toLowerCase().includes('microsoft')
}

async function getWindowsWSLInfo() {
  try {
    const { stdout } = await execFileAsync('wsl.exe', ['-l', '-v'])
    const lines = stdout.split(/\r?\n/).slice(1)
    let defaultDistro = null
    let state = null

    for (const line of lines) {
      if (!line.trim()) continue
      const isDefault = line.trimStart().startsWith('*')
      const cleanLine = line.replace(/^\s*\*/, '').trim()
      const tokens = cleanLine.split(/\s+/)
      const name = tokens[0]
      const distroState = tokens[1] || ''

      if (isDefault) {
        defaultDistro = name
        state = distroState
        break
      }
    }

    if (!defaultDistro) {
      return { error: 'No default WSL distribution configured' }
    }

    const isRunning = state?.toLowerCase() === 'running'
    if (!isRunning) {
      return { defaultDistro, state, error: 'Default WSL distribution is not running' }
    }

    const homeDir = await getWslHomeDir(defaultDistro)
    if (!homeDir) {
      return { defaultDistro, state, error: 'Unable to read WSL home directory' }
    }

    const uncHomeDir = buildWslUncPath(defaultDistro, homeDir)
    const linuxCodexDir = ensurePosixPath(homeDir, CODEX_DIR_NAME)

    return {
      defaultDistro,
      state,
      isRunning,
      homeDir,
      uncHomeDir,
      linuxCodexDir,
      canSync: true,
      label: `WSL (${defaultDistro})`
    }
  } catch (error) {
    return { error: error.message }
  }
}

async function getWslHomeDir(distro) {
  try {
    const { stdout } = await execFileAsync('wsl.exe', ['-d', distro, '-e', 'sh', '-c', 'printf %s "$HOME"'])
    return stdout.toString().trim()
  } catch (error) {
    return null
  }
}

function buildWslUncPath(distro, linuxPath = '') {
  const trimmedPath = linuxPath.replace(/^\/+/, '')
  return `\\\\wsl$\\${distro}\\${trimmedPath.replace(/\//g, '\\')}`
}

async function getWindowsHostInfoFromWSL() {
  try {
    const { stdout } = await execFileAsync('cmd.exe', ['/c', 'echo', '%USERPROFILE%'])
    const winPath = stdout.toString().trim()
    if (!winPath) {
      return { error: 'Unable to determine Windows home directory' }
    }
    const linuxPath = convertWindowsPathToWslPath(winPath)
    if (!linuxPath) {
      return { error: 'Unable to convert Windows home path', winPath }
    }
    return {
      winPath,
      homeDir: linuxPath,
      codexDir: join(linuxPath, CODEX_DIR_NAME),
      canSync: true,
      label: 'Windows'
    }
  } catch (error) {
    return { error: error.message }
  }
}

function convertWindowsPathToWslPath(pathStr) {
  const match = pathStr.match(/^([A-Za-z]):\\(.*)$/)
  if (!match) return null
  const drive = match[1].toLowerCase()
  const rest = match[2].replace(/\\+/g, '/')
  return `/mnt/${drive}/${rest}`
}

// 智能查找可用端口
async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const testServer = createServer()
    testServer.listen(startPort, () => {
      const port = testServer.address().port
      testServer.close(() => resolve(port))
    })
    testServer.on('error', () => {
      resolve(findAvailablePort(startPort + 1))
    })
  })
}

const PORT = await findAvailablePort(3000)

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
