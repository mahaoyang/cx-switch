import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import es from './locales/es.json'

// 检测浏览器语言
function getBrowserLocale() {
  const browserLang = navigator.language || navigator.userLanguage

  // 匹配语言代码
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  } else if (browserLang.startsWith('es')) {
    return 'es'
  } else {
    return 'en'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: getBrowserLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    es
  }
})

export default i18n
