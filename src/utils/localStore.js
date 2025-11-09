// 本地文件存储管理工具（存储到服务器项目目录）
export class LocalStore {
  static API_BASE = '/api'

  // 初始化
  static async init() {
    return true
  }

  // 读取 JSON 文件
  static async readJSON(filename) {
    try {
      const response = await fetch(`${this.API_BASE}/read/${filename}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Read ${filename} error:`, error)
      return null
    }
  }

  // 写入 JSON 文件
  static async writeJSON(filename, data) {
    try {
      const response = await fetch(`${this.API_BASE}/write/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error(`Write ${filename} error:`, error)
      throw error
    }
  }
}
