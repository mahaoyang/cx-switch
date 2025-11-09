// 文件写入工具（使用 File System Access API）
export class FileWriter {
  // 写入 auth.json
  static async writeAuthJson(content) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'auth.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()

      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Write auth.json error:', error)
        throw error
      }
      return false
    }
  }

  // 写入 config.toml
  static async writeConfigToml(content) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'config.toml',
        types: [{
          description: 'TOML Files',
          accept: { 'text/plain': ['.toml'] }
        }]
      })

      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()

      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Write config.toml error:', error)
        throw error
      }
      return false
    }
  }

  // 一键导出配置到 ~/.codex
  static async exportToCodexDir(authContent, tomlContent) {
    try {
      // 请求目录访问权限
      const dirHandle = await window.showDirectoryPicker()

      // 写入 auth.json
      const authHandle = await dirHandle.getFileHandle('auth.json', { create: true })
      const authWritable = await authHandle.createWritable()
      await authWritable.write(authContent)
      await authWritable.close()

      // 写入 config.toml
      const configHandle = await dirHandle.getFileHandle('config.toml', { create: true })
      const configWritable = await configHandle.createWritable()
      await configWritable.write(tomlContent)
      await configWritable.close()

      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Export to directory error:', error)
        throw error
      }
      return false
    }
  }

  // 复制到剪贴板
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Copy to clipboard error:', error)
      return false
    }
  }
}
