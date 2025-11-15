<template>
  <div class="min-h-screen p-6">
    <header class="glass-header text-center mb-8 p-8 rounded-2xl relative">
      <!-- 语言选择器 -->
      <div class="absolute top-4 left-4">
        <div class="relative">
          <button
            @click="showLangMenu = !showLangMenu"
            class="p-2 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white"
          >
            <Languages :size="20" />
          </button>

          <!-- 下拉菜单 -->
          <div
            v-if="showLangMenu"
            @click="showLangMenu = false"
            class="absolute top-full left-0 mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <button
              v-for="lang in languages"
              :key="lang.value"
              @click="locale = lang.value"
              class="block w-full px-4 py-2 text-left text-white hover:bg-teal-500/20 transition-colors text-sm whitespace-nowrap"
              :class="{ 'bg-teal-500/30': locale === lang.value }"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>
      </div>

      <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-500 to-cyan-400 bg-clip-text text-transparent">
        {{ t('app.title') }}
      </h1>
      <p class="text-white/70">{{ t('app.subtitle') }}</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 min-h-[600px]">
      <!-- 左侧：提供商列表 -->
      <aside class="glass-card rounded-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-white">{{ t('sidebar.title') }}</h2>
          <button @click="showAddModal = true" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
            <Plus :size="18" />
            {{ t('sidebar.addNew') }}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="provider in providers"
            :key="provider.id"
            class="provider-item p-4 rounded-lg cursor-pointer relative group"
            :class="{
              'provider-item--selected': provider.id === selectedProviderId
            }"
            @click="selectProvider(provider.id)"
          >
            <!-- 右上角：编辑和删除按钮 -->
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                @click.stop="editProvider(provider)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300"
                :title="t('provider.edit')"
              >
                <Edit :size="16" />
              </button>
              <button
                @click.stop="deleteProviderConfirm(provider.id)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                :title="t('provider.delete')"
              >
                <Trash2 :size="16" />
              </button>
            </div>

            <span
              v-if="provider.id === activeProviderId"
              class="absolute bottom-3 right-3 px-2 py-0.5 bg-teal-500 text-white text-xs rounded font-medium shadow-md"
            >
              {{ t('sidebar.current') }}
            </span>

            <!-- 主标题 -->
            <h3 class="text-lg font-semibold text-white mb-2 pr-24">
              {{ provider.name }}
            </h3>

            <!-- 次要信息 -->
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5">
                <Server :size="12" class="text-gray-500" />
                <span class="text-[10px] text-gray-400">{{ provider.isCustom ? provider.providerKey : t('providerEditor.officialOpenAI') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Cpu :size="12" class="text-gray-500" />
                <span class="text-[10px] text-gray-400">{{ provider.model || t('provider.notSet') }}</span>
              </div>
            </div>
          </div>

          <div v-if="providers.length === 0" class="text-center py-12 text-gray-500">
            <p>{{ t('sidebar.empty') }}</p>
          </div>
        </div>
      </aside>

      <!-- 右侧：提供商详情和操作 -->
      <main class="glass-card rounded-2xl p-6">
        <div v-if="selectedProvider" class="h-full">
          <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 class="text-2xl font-bold text-white m-0">{{ selectedProvider.name }}</h2>
            <div class="flex items-center gap-4">
              <div
                v-if="selectedProvider.id !== activeProviderId && systemInfo.dualSyncAvailable"
                class="relative group"
              >
                <Switch v-model="dualSyncEnabled">
                  {{ t('detail.dualSyncLabel', { target: dualSyncTargetName || 'Windows/WSL' }) }}
                </Switch>
                <div class="absolute left-0 top-full mt-2 w-64 text-xs leading-relaxed text-white bg-black/80 rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {{ dualSyncTooltipText }}
                </div>
              </div>
              <div
                v-else-if="selectedProvider.id !== activeProviderId && systemInfo.dualSyncReason"
                class="text-xs text-gray-400 max-w-xs"
                :title="systemInfo.dualSyncReason"
              >
                {{ t('detail.dualSyncUnavailable') }}
              </div>
              <button
                v-if="selectedProvider.id !== activeProviderId"
                @click="activateProvider(selectedProvider.id)"
                class="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Check :size="18" />
                {{ t('detail.switchTo') }}
              </button>
            </div>
          </div>

          <div class="flex gap-2 mb-4 border-b border-white/10 pb-2">
            <button
              :class="activeTab === 'preview' ? 'border-b-2 border-teal-400 text-teal-400' : 'border-b-2 border-transparent text-gray-400 hover:text-white'"
              @click="activeTab = 'preview'"
              class="px-4 py-2 bg-transparent transition-all duration-200"
            >
              {{ t('detail.tabs.preview') }}
            </button>
            <button
              :class="activeTab === 'export' ? 'border-b-2 border-teal-400 text-teal-400' : 'border-b-2 border-transparent text-gray-400 hover:text-white'"
              @click="activeTab = 'export'"
              class="px-4 py-2 bg-transparent transition-all duration-200"
            >
              {{ t('detail.tabs.export') }}
            </button>
            <button
              :class="activeTab === 'projects' ? 'border-b-2 border-teal-400 text-teal-400' : 'border-b-2 border-transparent text-gray-400 hover:text-white'"
              @click="activeTab = 'projects'"
              class="px-4 py-2 bg-transparent transition-all duration-200"
            >
              {{ t('detail.tabs.projects') }}
            </button>
          </div>

          <!-- 预览标签页 -->
          <div v-show="activeTab === 'preview'" class="animate-[fadeIn_0.3s]">
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-white">auth.json</h3>
                <button
                  @click="showSensitiveData = !showSensitiveData"
                  class="flex items-center gap-2 px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded transition-colors text-gray-300 hover:!translate-y-0"
                >
                  <component :is="showSensitiveData ? EyeOff : Eye" :size="16" />
                  {{ showSensitiveData ? t('detail.hideKeys') : t('detail.showKeys') }}
                </button>
              </div>
              <pre class="bg-slate-900 border border-white/10 rounded-lg p-4 overflow-x-auto font-mono text-sm leading-relaxed text-gray-300">{{ showSensitiveData ? formatJson(selectedProvider.auth) : formatJsonWithMaskedKeys(selectedProvider.auth) }}</pre>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white mb-2">config.toml</h3>
              <pre class="bg-slate-900 border border-white/10 rounded-lg p-4 overflow-x-auto font-mono text-sm leading-relaxed text-gray-300">{{ generateToml(selectedProvider) }}</pre>
            </div>
          </div>

          <!-- 导出标签页 -->
          <div v-show="activeTab === 'export'" class="animate-[fadeIn_0.3s]">
            <div class="flex flex-col gap-4">
              <h3 class="text-lg font-semibold text-white mb-2">{{ t('export.title') }}</h3>
              <button @click="exportToDirectory" class="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
                <FolderDown :size="20" />
                {{ t('export.toDirectory') }}
              </button>
              <button @click="copyAuthToClipboard" class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
                <Copy :size="20" />
                {{ t('export.copyAuth') }}
              </button>
              <button @click="copyConfigToClipboard" class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
                <Copy :size="20" />
                {{ t('export.copyConfig') }}
              </button>
            </div>
          </div>

          <!-- 项目管理标签页 -->
          <div v-show="activeTab === 'projects'" class="animate-[fadeIn_0.3s]">
            <div>
              <h3 class="text-lg font-semibold text-white mb-2">{{ t('projects.title') }}</h3>
              <p class="text-gray-400 text-sm mb-4">{{ t('projects.description') }}</p>

              <div
                v-for="(project, path) in globalConfig.projects"
                :key="path"
                class="mb-4 p-4 bg-white/5 rounded border-l-4 border-teal-500"
              >
                <div class="flex justify-between items-center mb-2">
                  <h5 class="text-sm font-medium text-white m-0 break-all">{{ path }}</h5>
                  <button @click="removeProject(path)" class="px-2 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-all flex items-center justify-center" :title="t('projects.deleteProject')">
                    <Trash2 :size="16" />
                  </button>
                </div>
                <div class="mb-6">
                  <label class="block text-sm text-gray-300 mb-2">{{ t('projects.trustLevel') }}</label>
                  <Select v-model="project.trust_level" @update:modelValue="saveGlobalConfig">
                    <option value="trusted">{{ t('projects.trusted') }}</option>
                    <option value="untrusted">{{ t('projects.untrusted') }}</option>
                  </Select>
                </div>
              </div>

              <div class="flex gap-2 mt-4">
                <input
                  v-model="newProjectPath"
                  :placeholder="t('projects.pathPlaceholder')"
                  class="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
                />
                <Select v-model="newProjectTrust">
                  <option value="trusted">trusted</option>
                  <option value="untrusted">untrusted</option>
                </Select>
                <button @click="addProject" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded transition-all flex items-center gap-2">
                  <Plus :size="18" />
                  {{ t('projects.addProject') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <p>{{ t('sidebar.selectPrompt') }}</p>
        </div>
      </main>
    </div>

    <!-- 添加/编辑提供商模态框 -->
    <div v-if="showAddModal || editingProvider" class="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000]" @mousedown.self="closeModal">
      <div class="glass-card rounded-2xl w-[90%] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-6 border-b border-white/10">
          <h2 class="text-2xl font-bold text-white m-0">{{ editingProvider ? t('modal.editProvider') : t('modal.addProvider') }}</h2>
          <button @click="closeModal" class="w-8 h-8 flex items-center justify-center bg-transparent border-0 text-gray-400 hover:text-white cursor-pointer p-0 transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="p-6">
          <ProviderEditor
            v-model="formData.provider"
            :globalConfig="globalConfig"
            :configName="formData.name"
            @update:name="formData.name = $event"
          />
        </div>

        <div class="flex justify-end gap-2 p-6 border-t border-white/10">
          <button @click="closeModal" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all flex items-center gap-2">
            <X :size="18" />
            {{ t('modal.cancel') }}
          </button>
          <button @click="saveProvider" class="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all flex items-center gap-2">
            <Check :size="18" />
            {{ t('modal.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 通知提示 -->
    <div v-if="notification.show" class="fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg animate-[slideIn_0.3s] z-[2000]" :class="notification.type === 'success' ? 'bg-teal-500 text-white' : 'bg-red-500 text-white'">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ProviderManager } from './utils/providerManager.js'
import { FileWriter } from './utils/fileWriter.js'
import { LocalStore } from './utils/localStore.js'
import ProviderEditor from './components/ProviderEditor.vue'
import Select from './components/Select.vue'
import Switch from './components/Switch.vue'
import { Plus, Edit, Trash2, Check, FolderDown, Copy, X, Languages, Server, Cpu, Eye, EyeOff } from 'lucide-vue-next'

const { t, locale } = useI18n()

const providers = ref([])
const activeProviderId = ref(null)
const selectedProviderId = ref(null)
const showAddModal = ref(false)
const editingProvider = ref(null)
const activeTab = ref('preview')
const globalConfig = ref({ projects: {} })
const showLangMenu = ref(false)
const showSensitiveData = ref(false)
const systemInfo = ref({
  platform: 'unknown',
  dualSyncAvailable: false,
  dualSyncReason: ''
})
const dualSyncEnabled = ref(false)

const dualSyncTargetName = computed(() => {
  if (systemInfo.value?.dualSyncTargetLabel) {
    return systemInfo.value.dualSyncTargetLabel
  }
  if (systemInfo.value?.platform === 'windows') return 'WSL'
  if (systemInfo.value?.platform === 'wsl') return 'Windows'
  return 'Windows/WSL'
})

const dualSyncTooltipText = computed(() => {
  if (systemInfo.value.dualSyncAvailable) {
    return t('detail.dualSyncTooltip', { target: dualSyncTargetName.value })
  }
  return systemInfo.value.dualSyncReason || t('detail.dualSyncUnavailable')
})

watch(
  () => systemInfo.value.dualSyncAvailable,
  (available) => {
    if (!available) {
      dualSyncEnabled.value = false
    }
  }
)

const languages = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'es', label: 'Español' }
]

const formData = ref({
  name: '',
  provider: {
    isCustom: true,
    auth: {},
    model: 'gpt-5-codex',
    modelReasoningEffort: 'high',
    disableResponseStorage: true,
    baseUrl: '',
    providerName: '',
    providerKey: '',
    wireApi: 'responses',
    requiresOpenAIAuth: true,
    customFields: {},
    askForApproval: '',
    sandbox: '',
    skipGitRepoCheck: ''
  }
})

const newProjectPath = ref('')
const newProjectTrust = ref('trusted')

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

const selectedProvider = computed(() => {
  return providers.value.find(p => p.id === selectedProviderId.value)
})

onMounted(async () => {
  // 初始化本地存储
  await LocalStore.init()
  await loadProviders()
  await loadGlobalConfig()
  await loadSystemInfo()
})

async function loadProviders() {
  try {
    providers.value = await ProviderManager.getAllProviders()
    activeProviderId.value = await ProviderManager.getActiveProvider()

    // 默认选中当前激活的提供商
    if (activeProviderId.value) {
      selectedProviderId.value = activeProviderId.value
    } else if (providers.value.length > 0) {
      selectedProviderId.value = providers.value[0].id
    }
  } catch (error) {
    console.error('Load providers error:', error)
    showNotification('Failed to load providers', 'error')
  }
}

async function loadGlobalConfig() {
  globalConfig.value = await ProviderManager.getGlobalConfig()
}

async function loadSystemInfo() {
  try {
    const response = await fetch('/api/system-info')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    systemInfo.value = await response.json()
  } catch (error) {
    console.warn('Load system info error:', error)
  }
}

async function saveGlobalConfig() {
  await ProviderManager.saveGlobalConfig(globalConfig.value)
}

function selectProvider(id) {
  selectedProviderId.value = id
  activeTab.value = 'preview'
}

function editProvider(provider) {
  editingProvider.value = provider
  const { name, ...providerData } = provider
  formData.value = {
    name: name,
    provider: { ...providerData }
  }
}

async function deleteProviderConfirm(id) {
  if (confirm(t('provider.confirmDelete'))) {
    await ProviderManager.deleteProvider(id)
    if (activeProviderId.value === id) {
      activeProviderId.value = null
      await ProviderManager.setActiveProvider('')
    }
    if (selectedProviderId.value === id) {
      selectedProviderId.value = null
    }
    await loadProviders()
    showNotification(t('notification.providerDeleted'), 'success')
  }
}

async function saveProvider() {
  try {
    if (!formData.value.name) {
      showNotification(t('modal.configNameRequired'), 'error')
      return
    }

    if (formData.value.provider.isCustom) {
      if (!formData.value.provider.providerKey) {
        showNotification(t('providerEditor.providerKeyRequired'), 'error')
        return
      }
      if (!formData.value.provider.baseUrl) {
        showNotification(t('providerEditor.baseUrlRequired'), 'error')
        return
      }
    }

    const providerData = {
      name: formData.value.name,
      ...formData.value.provider
    }

    if (editingProvider.value) {
      await ProviderManager.updateProvider(editingProvider.value.id, providerData)
      showNotification(t('notification.providerUpdated'), 'success')
    } else {
      await ProviderManager.addProvider(providerData)
      showNotification(t('notification.providerAdded'), 'success')
    }

    closeModal()
    await loadProviders()
  } catch (error) {
    showNotification(t('notification.saveFailed') + ': ' + error.message, 'error')
  }
}

function closeModal() {
  showAddModal.value = false
  editingProvider.value = null
  formData.value = {
    name: '',
    provider: {
      isCustom: true,
      auth: {},
      model: 'gpt-5-codex',
      modelReasoningEffort: 'high',
      disableResponseStorage: true,
      baseUrl: '',
      providerName: '',
      providerKey: '',
      wireApi: 'responses',
      requiresOpenAIAuth: true,
      customFields: {},
      askForApproval: '',
      sandbox: '',
      skipGitRepoCheck: ''
    }
  }
}

async function applySelectedProviderConfig(provider = selectedProvider.value) {
  if (!provider) {
    throw new Error('No provider selected')
  }

  const payload = {
    provider,
    globalConfig: JSON.parse(JSON.stringify(globalConfig.value || {})),
    options: {
      dualSync: dualSyncEnabled.value
    }
  }

  const response = await fetch('/api/apply-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  let data = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to apply configuration')
  }

  if (data.systemInfo) {
    systemInfo.value = data.systemInfo
  }

  return data
}

async function activateProvider(id) {
  try {
    const provider = providers.value.find(p => p.id === id)
    if (!provider) {
      throw new Error('Provider not found')
    }

    await applySelectedProviderConfig(provider)
    activeProviderId.value = id
    await ProviderManager.setActiveProvider(id)
    showNotification(t('notification.providerSwitched'), 'success')
  } catch (error) {
    console.error('Activate provider error:', error)
    showNotification(t('notification.applyFailed') + ': ' + error.message, 'error')
  }
}

async function exportToDirectory() {
  try {
    const { authJson, configToml } = await ProviderManager.exportProvider(
      selectedProvider.value,
      globalConfig.value
    )
    const success = await FileWriter.exportToCodexDir(authJson, configToml)
    if (success) {
      showNotification(t('notification.exportedToDirectory'), 'success')
    }
  } catch (error) {
    showNotification(t('notification.exportFailed') + ': ' + error.message, 'error')
  }
}

async function copyAuthToClipboard() {
  try {
    const { authJson } = await ProviderManager.exportProvider(
      selectedProvider.value,
      globalConfig.value
    )
    const success = await FileWriter.copyToClipboard(authJson)
    if (success) {
      showNotification(t('notification.authCopied'), 'success')
    }
  } catch (error) {
    showNotification(t('notification.copyFailed'), 'error')
  }
}

async function copyConfigToClipboard() {
  try {
    const { configToml } = await ProviderManager.exportProvider(
      selectedProvider.value,
      globalConfig.value
    )
    const success = await FileWriter.copyToClipboard(configToml)
    if (success) {
      showNotification(t('notification.configCopied'), 'success')
    }
  } catch (error) {
    showNotification(t('notification.copyFailed'), 'error')
  }
}

function addProject() {
  if (newProjectPath.value) {
    if (!globalConfig.value.projects) {
      globalConfig.value.projects = {}
    }
    globalConfig.value.projects[newProjectPath.value] = {
      trust_level: newProjectTrust.value
    }
    newProjectPath.value = ''
    saveGlobalConfig()
    showNotification(t('notification.projectAdded'), 'success')
  }
}

function removeProject(path) {
  if (confirm(t('projects.confirmDelete'))) {
    delete globalConfig.value.projects[path]
    saveGlobalConfig()
    showNotification(t('notification.projectDeleted'), 'success')
  }
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2)
}

function formatJsonWithMaskedKeys(obj) {
  const masked = {}
  for (const [key, value] of Object.entries(obj)) {
    // 将包含 key、token、password、secret 等敏感字段的值替换为星号
    if (key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret')) {
      masked[key] = value ? '********' : ''
    } else {
      masked[key] = value
    }
  }
  return JSON.stringify(masked, null, 2)
}

function generateToml(provider) {
  return ProviderManager.generateToml(provider, globalConfig.value)
}

function showNotification(message, type = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}
</script>

<style scoped>
/* Most styles are now handled by Tailwind CSS classes */
/* Only custom animations and provider-item specific styles remain here */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
