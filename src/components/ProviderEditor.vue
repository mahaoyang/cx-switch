<template>
  <div class="mb-8">
    <!-- 核心配置：API URL 和 Key -->
    <section class="mb-6 p-4 bg-teal-500/10 rounded-lg border-2 border-teal-500/30">
      <div class="grid grid-cols-1 gap-4">
        <!-- API Base URL -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">{{ t('providerEditor.baseUrl') }} *</label>
          <input
            v-model="localProvider.baseUrl"
            :placeholder="t('providerEditor.baseUrlPlaceholder')"
            @input="handleBaseUrlChange"
            class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
          />
        </div>

        <!-- API Key -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">{{ t('providerEditor.openaiApiKey') }} *</label>
          <div class="relative">
            <input
              v-model="localProvider.auth.OPENAI_API_KEY"
              placeholder="sk-..."
              :type="showApiKey ? 'text' : 'password'"
              @input="emitChange"
              class="w-full px-3 py-2 pr-10 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
            />
            <button
              @click="showApiKey = !showApiKey"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors hover:!-translate-y-1/2"
            >
              <component :is="showApiKey ? EyeOff : Eye" :size="18" />
            </button>
          </div>
        </div>

        <!-- 模型名称 -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">{{ t('providerEditor.model') }}</label>
          <input
            v-model="localProvider.model"
            :placeholder="t('providerEditor.modelPlaceholder')"
            @input="emitChange"
            class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
          />
        </div>

        <!-- 推理强度 -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">{{ t('providerEditor.reasoningEffort') }}</label>
          <Select v-model="localProvider.modelReasoningEffort" @update:modelValue="emitChange">
            <option value="">{{ t('providerEditor.reasoningEffortOptions.notSet') }}</option>
            <option value="low">{{ t('providerEditor.reasoningEffortOptions.low') }}</option>
            <option value="medium">{{ t('providerEditor.reasoningEffortOptions.medium') }}</option>
            <option value="high">{{ t('providerEditor.reasoningEffortOptions.high') }}</option>
          </Select>
        </div>
      </div>
    </section>

    <!-- 高级配置（默认折叠） -->
    <details class="mb-6">
      <summary class="cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <span class="text-base font-semibold text-white">{{ t('providerEditor.advancedConfig') }}</span>
      </summary>

      <div class="mt-4 space-y-6">
        <!-- 提供商类型选择 -->
        <div class="flex gap-8 p-4 bg-teal-500/10 rounded-lg">
          <label class="flex items-center gap-2 cursor-pointer text-white">
            <input type="radio" :value="false" v-model="localProvider.isCustom" @change="emitChange" class="w-4 h-4 text-teal-500" />
            {{ t('providerEditor.providerType.official') }}
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-white">
            <input type="radio" :value="true" v-model="localProvider.isCustom" @change="emitChange" class="w-4 h-4 text-teal-500" />
            {{ t('providerEditor.providerType.custom') }}
          </label>
        </div>

        <!-- 基础配置 -->
        <section class="p-4 bg-white/5 rounded-lg">
          <h4 class="text-base font-semibold text-teal-400 mb-4">{{ t('providerEditor.basicConfig') }}</h4>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('modal.configName') }} *</label>
            <input
              :value="configName"
              @input="updateConfigName($event.target.value)"
              :placeholder="t('modal.configNamePlaceholder')"
              class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
            />
          </div>

          <div class="mb-6">
            <Switch v-model="localProvider.disableResponseStorage" @update:modelValue="emitChange">
              {{ t('providerEditor.disableResponseStorage') }}
            </Switch>
          </div>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.askForApproval') }}</label>
            <Select v-model="localProvider.askForApproval" @update:modelValue="emitChange">
              <option value="">{{ t('providerEditor.notSet') }}</option>
              <option value="never">never</option>
              <option value="always">always</option>
              <option value="auto">auto</option>
            </Select>
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.askForApprovalHint') }}</small>
          </div>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.sandbox') }}</label>
            <Select v-model="localProvider.sandbox" @update:modelValue="emitChange">
              <option value="">{{ t('providerEditor.notSet') }}</option>
              <option value="workspace-write">workspace-write</option>
              <option value="workspace-read">workspace-read</option>
              <option value="none">none</option>
            </Select>
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.sandboxHint') }}</small>
          </div>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.skipGitRepoCheck') }}</label>
            <Select v-model="localProvider.skipGitRepoCheck" @update:modelValue="emitChange">
              <option value="">{{ t('providerEditor.notSet') }}</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </Select>
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.skipGitRepoCheckHint') }}</small>
          </div>
        </section>

        <!-- 自定义提供商配置 -->
        <section v-if="localProvider.isCustom" class="p-4 bg-teal-500/5 rounded-lg border-l-4 border-teal-500">
          <h4 class="text-base font-semibold text-teal-400 mb-4">{{ t('providerEditor.providerConfig') }}</h4>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.providerKey') }}</label>
            <input
              v-model="localProvider.providerKey"
              :placeholder="t('providerEditor.providerKeyPlaceholder')"
              @input="emitChange"
              class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
            />
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.providerKeyHint') }}</small>
          </div>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.providerNameLabel') }}</label>
            <input
              v-model="localProvider.providerName"
              :placeholder="t('providerEditor.providerNamePlaceholder')"
              @input="emitChange"
              class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
            />
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.providerNameHint') }}</small>
          </div>

          <div class="mb-6">
            <label class="block text-sm text-gray-300 mb-2">{{ t('providerEditor.wireApi') }}</label>
            <input
              v-model="localProvider.wireApi"
              :placeholder="t('providerEditor.wireApiPlaceholder')"
              @input="emitChange"
              class="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
            />
            <small class="text-gray-500 text-xs mt-1 block">{{ t('providerEditor.wireApiHint') }}</small>
          </div>

          <div class="mb-6">
            <Switch v-model="localProvider.requiresOpenAIAuth" @update:modelValue="emitChange">
              {{ t('providerEditor.requiresOpenAIAuth') }}
            </Switch>
          </div>

          <!-- 自定义字段 -->
          <div v-if="hasCustomFields" class="mt-4">
            <h5 class="text-sm font-medium text-gray-300 mb-3">{{ t('providerEditor.customFields') }}</h5>
            <div v-for="(value, key) in localProvider.customFields" :key="key" class="mb-4 p-3 bg-teal-500/10 rounded">
              <label class="block text-sm text-gray-300 mb-2">{{ key }}</label>
              <div class="flex gap-2">
                <input v-model="localProvider.customFields[key]" @input="emitChange" class="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50" />
                <button @click="removeCustomField(key)" class="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-all flex items-center justify-center" title="删除">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>

          <details class="mt-4 p-3 bg-white/5 rounded cursor-pointer">
            <summary class="text-sm text-gray-400 select-none flex items-center gap-2">
              <Plus :size="16" />
              {{ t('providerEditor.addCustomField') }}
            </summary>
            <div class="flex gap-2 mt-3">
              <input v-model="newFieldKey" :placeholder="t('providerEditor.fieldName')" class="w-40 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50" />
              <input v-model="newFieldValue" :placeholder="t('providerEditor.fieldValue')" class="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50" />
              <button @click="addCustomField" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded transition-all flex items-center gap-2">
                <Plus :size="16" />
                {{ t('providerEditor.add') }}
              </button>
            </div>
          </details>
        </section>

        <!-- Auth 自定义字段 -->
        <section class="p-4 bg-white/5 rounded-lg">
          <h4 class="text-base font-semibold text-teal-400 mb-4">{{ t('providerEditor.apiAuth') }}</h4>

          <div v-if="hasAuthCustomFields">
            <div v-for="(value, key) in authCustomFields" :key="key" class="mb-4 p-3 bg-teal-500/10 rounded">
              <label class="block text-sm text-gray-300 mb-2">{{ key }}</label>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <input
                    v-model="localProvider.auth[key]"
                    @input="emitChange"
                    :type="showAuthFields[key] ? 'text' : 'password'"
                    class="w-full px-3 py-2 pr-10 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50"
                  />
                  <button
                    @click="toggleAuthFieldVisibility(key)"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors hover:!-translate-y-1/2"
                  >
                    <component :is="showAuthFields[key] ? EyeOff : Eye" :size="16" />
                  </button>
                </div>
                <button @click="removeAuthField(key)" class="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-all flex items-center justify-center" title="删除">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>

          <details class="mt-4 p-3 bg-white/5 rounded cursor-pointer">
            <summary class="text-sm text-gray-400 select-none flex items-center gap-2">
              <Plus :size="16" />
              {{ t('providerEditor.addOtherAuthField') }}
            </summary>
            <div class="flex gap-2 mt-3">
              <input v-model="newAuthKey" :placeholder="t('providerEditor.fieldName')" class="w-40 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50" />
              <input v-model="newAuthValue" :placeholder="t('providerEditor.fieldValue')" type="password" class="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white focus:ring-2 focus:ring-teal-400/50" />
              <button @click="addAuthField" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded transition-all flex items-center gap-2">
                <Plus :size="16" />
                {{ t('providerEditor.add') }}
              </button>
            </div>
          </details>
        </section>

        <!-- 原始配置预览 -->
        <section class="p-4 bg-white/10 rounded-lg">
          <h4 class="text-base font-semibold text-white mb-4">{{ t('providerEditor.configPreview') }}</h4>

          <div class="flex justify-between items-center mb-2">
            <h5 class="text-sm font-medium text-gray-300">auth.json</h5>
            <button
              @click="showSensitiveData = !showSensitiveData"
              class="flex items-center gap-2 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors text-gray-300 hover:!translate-y-0"
            >
              <component :is="showSensitiveData ? EyeOff : Eye" :size="14" />
              {{ showSensitiveData ? t('detail.hideKeys') : t('detail.showKeys') }}
            </button>
          </div>
          <pre class="bg-slate-900 border border-white/10 rounded p-4 overflow-x-auto font-mono text-sm leading-relaxed text-gray-300 mb-4">{{ showSensitiveData ? unmaskedAuthPreview : maskedAuthPreview }}</pre>

          <h5 class="text-sm font-medium text-gray-300 mb-2">config.toml</h5>
          <pre class="bg-slate-900 border border-white/10 rounded p-4 overflow-x-auto font-mono text-sm leading-relaxed text-gray-300 m-0">{{ tomlPreview }}</pre>
        </section>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ProviderManager } from '../utils/providerManager.js'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-vue-next'
import Switch from './Switch.vue'
import Select from './Select.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
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
    })
  },
  globalConfig: {
    type: Object,
    default: () => ({ projects: {} })
  },
  configName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:name', 'update:providerKey'])

function normalizeProviderValue(value = {}) {
  const normalized = {
    providerName: '',
    ...value
  }
  if (normalized.providerName === undefined || normalized.providerName === null) {
    normalized.providerName = ''
  }
  return normalized
}

const localProvider = ref(normalizeProviderValue(props.modelValue))
const newFieldKey = ref('')
const newFieldValue = ref('')
const newAuthKey = ref('')
const newAuthValue = ref('')
const showSensitiveData = ref(false)
const showApiKey = ref(false)
const showAuthFields = ref({})

const isCustom = computed(() => localProvider.value.isCustom)

const hasCustomFields = computed(() => {
  return localProvider.value.customFields && Object.keys(localProvider.value.customFields).length > 0
})

const authCustomFields = computed(() => {
  const fields = { ...localProvider.value.auth }
  delete fields.OPENAI_API_KEY
  return fields
})

const hasAuthCustomFields = computed(() => {
  return Object.keys(authCustomFields.value).length > 0
})

const tomlPreview = computed(() => {
  return ProviderManager.generateToml(localProvider.value, props.globalConfig)
})

const maskedAuthPreview = computed(() => {
  const masked = {}
  for (const [key, value] of Object.entries(localProvider.value.auth || {})) {
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
})

const unmaskedAuthPreview = computed(() => {
  return JSON.stringify(localProvider.value.auth || {}, null, 2)
})

watch(() => props.modelValue, (newVal) => {
  localProvider.value = normalizeProviderValue(newVal)
}, { deep: true })

watch(() => props.configName, (newName, oldName) => {
  if (!newName) return
  const providerName = localProvider.value.providerName
  if (!providerName || providerName === oldName) {
    localProvider.value.providerName = newName
    emitChange()
  }
}, { immediate: true })

function extractDomainName(url) {
  try {
    const urlObj = new URL(url)
    const parts = urlObj.hostname.split('.')
    // 取中间部分，比如 api.openai.com -> openai
    if (parts.length >= 2) {
      return parts[parts.length - 2]
    }
    return parts[0]
  } catch (e) {
    return ''
  }
}

function handleBaseUrlChange() {
  const domain = extractDomainName(localProvider.value.baseUrl)
  if (domain) {
    // 自动更新 providerKey
    localProvider.value.providerKey = domain
    // 通知父组件更新配置名称
    emit('update:name', domain)
  }
  emitChange()
}

function updateConfigName(value) {
  emit('update:name', value)
}

function emitChange() {
  emit('update:modelValue', { ...localProvider.value })
}

function addCustomField() {
  if (newFieldKey.value && newFieldValue.value) {
    if (!localProvider.value.customFields) {
      localProvider.value.customFields = {}
    }
    localProvider.value.customFields[newFieldKey.value] = newFieldValue.value
    newFieldKey.value = ''
    newFieldValue.value = ''
    emitChange()
  }
}

function removeCustomField(key) {
  delete localProvider.value.customFields[key]
  emitChange()
}

function addAuthField() {
  if (newAuthKey.value && newAuthValue.value) {
    if (!localProvider.value.auth) {
      localProvider.value.auth = {}
    }
    localProvider.value.auth[newAuthKey.value] = newAuthValue.value
    newAuthKey.value = ''
    newAuthValue.value = ''
    emitChange()
  }
}

function removeAuthField(key) {
  delete localProvider.value.auth[key]
  delete showAuthFields.value[key]
  emitChange()
}

function toggleAuthFieldVisibility(key) {
  showAuthFields.value[key] = !showAuthFields.value[key]
}
</script>

<style scoped>
/* All styles handled by Tailwind CSS */
</style>
