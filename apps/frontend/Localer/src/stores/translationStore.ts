import { defineStore } from 'pinia'

export const useTranslationStore = defineStore({
  id: 'translation',
  state: () => ({
    locales: ['en_US', 'ko_KR', 'hu_HU'],
    keys: ['hoarderBadgeName', 'hoarderBadgeDescription', 'HomeButton', 'Welcome'],
    translations: {} as Record<string, Record<string, string>>
  }),
  getters: {
    translationsForKey: (state) => (key: string) =>
      state.locales.reduce((acc, locale) => {
        acc[locale] = state.translations[locale]?.[key] ?? null
        return acc
      }, {} as Record<string, string>)
  },
  actions: {
    async loadTranslations() {
      const translationModules = import.meta.glob('../../../../../locales/*.json')
      const translations = await Promise.all(
        Object.entries(translationModules).map(async ([path, loader]) => {
          const locale = path.match(/\/(\w+)\.json$/)?.[1] ?? ''
          const module = (await loader()) as { default: Record<string, string> }
          return [locale, module.default] as const
        })
      )
      this.translations = Object.fromEntries(translations)
    },
    checkKey(key: string) {
      return this.translationsForKey(key)[this.locales[0]] !== null
    }
  }
})
