// 提供商管理工具
import { LocalStore } from './localStore.js'
import { generateCodexToml } from './codexConfig.js'

const PROVIDERS_FILE = 'providers.json'
const ACTIVE_PROVIDER_FILE = 'active-provider.json'
const GLOBAL_CONFIG_FILE = 'global-config.json'

export class ProviderManager {
  // 获取所有提供商
  static async getAllProviders() {
    const data = await LocalStore.readJSON(PROVIDERS_FILE)
    return data || []
  }

  // 保存所有提供商
  static async saveAllProviders(providers) {
    await LocalStore.writeJSON(PROVIDERS_FILE, providers)
  }

  // 添加新提供商
  static async addProvider(provider) {
    const providers = await this.getAllProviders()
    providers.push({
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...provider
    })
    await this.saveAllProviders(providers)
    return providers
  }

  // 更新提供商
  static async updateProvider(id, updatedProvider) {
    const providers = await this.getAllProviders()
    const index = providers.findIndex(p => p.id === id)
    if (index !== -1) {
      providers[index] = { ...providers[index], ...updatedProvider }
      await this.saveAllProviders(providers)
    }
    return providers
  }

  // 删除提供商
  static async deleteProvider(id) {
    const providers = (await this.getAllProviders()).filter(p => p.id !== id)
    await this.saveAllProviders(providers)
    return providers
  }

  // 获取当前激活的提供商
  static async getActiveProvider() {
    const data = await LocalStore.readJSON(ACTIVE_PROVIDER_FILE)
    return data?.id || null
  }

  // 设置激活的提供商
  static async setActiveProvider(id) {
    await LocalStore.writeJSON(ACTIVE_PROVIDER_FILE, { id })
  }

  // 获取全局配置（项目信任级别等）
  static async getGlobalConfig() {
    const data = await LocalStore.readJSON(GLOBAL_CONFIG_FILE)
    return data || { projects: {} }
  }

  // 保存全局配置
  static async saveGlobalConfig(config) {
    await LocalStore.writeJSON(GLOBAL_CONFIG_FILE, config)
  }

  // 导出提供商配置到文件
  static async exportProvider(provider, globalConfig) {
    try {
      // 生成 auth.json 内容
      const authJson = JSON.stringify(provider.auth || {}, null, 2)

      // 生成 config.toml 内容
      const configToml = this.generateToml(provider, globalConfig)

      return { authJson, configToml }
    } catch (error) {
      console.error('Export provider error:', error)
      throw error
    }
  }

  // 生成 TOML 格式
  static generateToml(provider, globalConfig = {}) {
    return generateCodexToml(provider, globalConfig)
  }

}
