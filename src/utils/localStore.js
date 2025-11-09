// 本地文件存储管理工具（使用 File System Access API）
export class LocalStore {
  static dirHandle = null

  // 初始化：请求或获取存储目录
  static async init() {
    try {
      // 尝试从 IndexedDB 恢复目录句柄
      const savedHandle = await this.getSavedDirHandle()
      if (savedHandle) {
        // 验证权限
        const permission = await savedHandle.queryPermission({ mode: 'readwrite' })
        if (permission === 'granted') {
          this.dirHandle = savedHandle
          return true
        }
      }

      // 请求用户选择目录
      return await this.requestDirectory()
    } catch (error) {
      console.error('LocalStore init error:', error)
      return false
    }
  }

  // 请求用户选择存储目录
  static async requestDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      })

      this.dirHandle = dirHandle
      await this.saveDirHandle(dirHandle)
      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Request directory error:', error)
      }
      return false
    }
  }

  // 保存目录句柄到 IndexedDB
  static async saveDirHandle(dirHandle) {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['handles'], 'readwrite')
      const store = transaction.objectStore('handles')
      await store.put(dirHandle, 'dataDir')
    } catch (error) {
      console.error('Save dir handle error:', error)
    }
  }

  // 从 IndexedDB 获取目录句柄
  static async getSavedDirHandle() {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['handles'], 'readonly')
      const store = transaction.objectStore('handles')
      return await store.get('dataDir')
    } catch (error) {
      console.error('Get saved dir handle error:', error)
      return null
    }
  }

  // 打开 IndexedDB
  static openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CodexSwitchDB', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles')
        }
      }
    })
  }

  // 读取 JSON 文件
  static async readJSON(filename) {
    try {
      if (!this.dirHandle) {
        const initialized = await this.init()
        if (!initialized) return null
      }

      const fileHandle = await this.dirHandle.getFileHandle(filename, { create: false })
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return null
      }
      console.error(`Read ${filename} error:`, error)
      return null
    }
  }

  // 写入 JSON 文件
  static async writeJSON(filename, data) {
    try {
      if (!this.dirHandle) {
        const initialized = await this.init()
        if (!initialized) {
          throw new Error('No directory selected')
        }
      }

      const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
      return true
    } catch (error) {
      console.error(`Write ${filename} error:`, error)
      throw error
    }
  }
}
