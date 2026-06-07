import type { LLMProviderConfig } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Brain, Cpu, Sparkles, Zap, Check } from 'lucide-react';

const providerIcons: Record<string, React.ElementType> = {
  openai: Sparkles,
  anthropic: Brain,
  deepseek: Zap,
};

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  deepseek: 'DeepSeek',
};

interface ModelSelectorProps {
  value: string;
  onChange: (configId: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { settings } = useSettingsStore();
  const configs = settings.llmConfigs.filter((c) => c.isEnabled);
  const activeConfig = configs.find((c) => c.id === value);

  if (configs.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">选择模型配置</label>
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            暂无可用的大模型配置，请先在设置页面添加 API Key。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">选择模型配置</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
      >
        {configs.map((config) => {
          const Icon = providerIcons[config.provider] || Cpu;
          return (
            <option key={config.id} value={config.id}>
              [{providerLabels[config.provider]}] {config.name} ({config.model})
            </option>
          );
        })}
      </select>

      {activeConfig && (() => {
        const Icon = providerIcons[activeConfig.provider] || Cpu;
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              {providerLabels[activeConfig.provider]} · {activeConfig.model}
            </span>
            <Check className="w-3.5 h-3.5 text-success ml-auto" />
          </div>
        );
      })()}
    </div>
  );
}
