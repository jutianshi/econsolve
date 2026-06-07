import { create } from 'zustand';
import type { AppSettings, LLMProviderConfig, LLMProvider } from '@/types';
import { testLlmConnection } from '@/services/api';

interface ExtendedAppSettings extends AppSettings {
  llmConfigs: LLMProviderConfig[];
  activeConfigId: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  maxRetryCount: number;
}

interface SettingsState {
  settings: ExtendedAppSettings;
  updateSettings: (settings: Partial<ExtendedAppSettings>) => void;
  addLlmConfig: (config: Omit<LLMProviderConfig, 'id' | 'createdAt' | 'isEnabled'>) => void;
  removeLlmConfig: (id: string) => void;
  updateLlmConfig: (id: string, updates: Partial<LLMProviderConfig>) => void;
  setActiveConfig: (id: string) => void;
  testConnection: (config: LLMProviderConfig) => Promise<boolean>;
  getActiveLlmConfig: () => LLMProviderConfig | undefined;
}

const defaultSettings: ExtendedAppSettings = {
  defaultModel: 'auto',
  defaultTemplateId: '',
  detailLevel: 'standard',
  outputLanguage: 'zh-CN',
  llmConfigs: [],
  activeConfigId: '',
  reasoningEffort: 'medium',
  maxRetryCount: 2,
};

const loadSettings = (): ExtendedAppSettings => {
  try {
    const saved = localStorage.getItem('econsolve-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),

  updateSettings: (newSettings: Partial<ExtendedAppSettings>) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem('econsolve-settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  addLlmConfig: (config) => {
    const newConfig: LLMProviderConfig = {
      ...config,
      id: `llm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      isEnabled: true,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = {
        ...state.settings,
        llmConfigs: [...state.settings.llmConfigs, newConfig],
        activeConfigId: state.settings.activeConfigId || newConfig.id,
      };
      localStorage.setItem('econsolve-settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  removeLlmConfig: (id) => {
    set((state) => {
      const filtered = state.settings.llmConfigs.filter((c) => c.id !== id);
      const updated = {
        ...state.settings,
        llmConfigs: filtered,
        activeConfigId:
          state.settings.activeConfigId === id
            ? filtered[0]?.id || ''
            : state.settings.activeConfigId,
      };
      localStorage.setItem('econsolve-settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateLlmConfig: (id, updates) => {
    set((state) => {
      const updated = {
        ...state.settings,
        llmConfigs: state.settings.llmConfigs.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      };
      localStorage.setItem('econsolve-settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  setActiveConfig: (id) => {
    set((state) => {
      const updated = { ...state.settings, activeConfigId: id };
      localStorage.setItem('econsolve-settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  testConnection: async (config) => {
    try {
      const result = await testLlmConnection({
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      });
      return result.success && !!result.data?.success;
    } catch {
      return false;
    }
  },

  getActiveLlmConfig: () => {
    const { settings } = get();
    return settings.llmConfigs.find((c) => c.id === settings.activeConfigId);
  },
}));
