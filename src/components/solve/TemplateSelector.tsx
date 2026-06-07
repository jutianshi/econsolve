import { useEffect } from 'react';
import { useTemplateStore } from '@/store/useTemplateStore';

interface TemplateSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const { templates, isLoading, fetchTemplates } = useTemplateStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const categoryColors: Record<string, string> = {
    general: 'bg-blue-100 text-blue-800',
    calculation: 'bg-green-100 text-green-800',
    proof: 'bg-purple-100 text-purple-800',
    choice: 'bg-orange-100 text-orange-800',
    custom: 'bg-pink-100 text-pink-800',
  };

  const categoryNames: Record<string, string> = {
    general: '通用',
    calculation: '计算题',
    proof: '证明题',
    choice: '选择题',
    custom: '自定义',
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        选择模板
      </label>

      {isLoading ? (
        <div className="px-4 py-6 text-center text-gray-500 animate-pulse">
          加载模板列表...
        </div>
      ) : (
        <>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="">默认模板（自动选择）</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.isPreset ? '[预设] ' : ''}{template.name}
                {` (${categoryNames[template.category]})`}
              </option>
            ))}
          </select>

          {value && templates.find((t) => t.id === value) && (() => {
            const template = templates.find((t) => t.id === value)!;
            return (
              <div className="px-3 py-2 bg-surface-card rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-primary">{template.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[template.category]}`}>
                    {categoryNames[template.category]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                <p className="text-xs text-gray-400 mt-1">使用次数：{template.usageCount}</p>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
