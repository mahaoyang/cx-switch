// Shared Codex config generator used by both the frontend and CLI
export function generateCodexToml(provider = {}, globalConfig = {}) {
  if (!provider || typeof provider !== 'object') {
    return ''
  }

  let toml = ''

  // 全局设置（可选）
  if (provider.askForApproval) toml += `ask_for_approval = "${provider.askForApproval}"\n`
  if (provider.sandbox) toml += `sandbox = "${provider.sandbox}"\n`
  if (provider.skipGitRepoCheck !== undefined && provider.skipGitRepoCheck !== null && provider.skipGitRepoCheck !== '') {
    toml += `skip_git_repo_check = ${provider.skipGitRepoCheck}\n`
  }

  // 如果有全局设置，添加一个空行
  if (provider.askForApproval || provider.sandbox || (provider.skipGitRepoCheck !== undefined && provider.skipGitRepoCheck !== null && provider.skipGitRepoCheck !== '')) {
    toml += '\n'
  }

  // 基础配置
  if (provider.model) toml += `model = "${provider.model}"\n`
  if (provider.modelReasoningEffort) {
    toml += `model_reasoning_effort = "${provider.modelReasoningEffort}"\n`
  }

  // 如果是自定义提供商
  if (provider.isCustom) {
    const providerKey = provider.providerKey || ''
    toml += `model_provider = "${providerKey}"\n`
    toml += '\n'
    toml += `[model_providers.${providerKey}]\n`
    const providerConfigName = provider.providerName || provider.name || providerKey || 'custom'
    toml += `name = "${providerConfigName}"\n`
    if (provider.baseUrl) toml += `base_url = "${provider.baseUrl}"\n`
    if (provider.wireApi) toml += `wire_api = "${provider.wireApi}"\n`
    if (provider.requiresOpenAIAuth !== undefined) {
      toml += `requires_openai_auth = ${provider.requiresOpenAIAuth}\n`
    }

    // 自定义字段
    if (provider.customFields) {
      Object.entries(provider.customFields).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          toml += `${key} = ${value}\n`
        } else if (typeof value === 'number') {
          toml += `${key} = ${value}\n`
        } else {
          toml += `${key} = "${value}"\n`
        }
      })
    }
  } else {
    // 默认提供商（OpenAI）
    if (provider.baseUrl) toml += `base_url = "${provider.baseUrl}"\n`
  }

  if (provider.disableResponseStorage) {
    toml += '\ndisable_response_storage = true\n'
  }

  // 全局配置：项目信任级别
  if (globalConfig.projects && Object.keys(globalConfig.projects).length > 0) {
    toml += '\n'
    Object.entries(globalConfig.projects).forEach(([path, config]) => {
      toml += `[projects."${path}"]\n`
      if (config.trust_level) toml += `trust_level = "${config.trust_level}"\n`
      toml += '\n'
    })
  }

  return toml.trim()
}
