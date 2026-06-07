import type { Template } from '@/types';
import { FileText, Users, Star } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onClick: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700 border-blue-200',
  calculation: 'bg-green-100 text-green-700 border-green-200',
  proof: 'bg-purple-100 text-purple-700 border-purple-200',
  choice: 'bg-orange-100 text-orange-700 border-orange-200',
  custom: 'bg-pink-100 text-pink-700 border-pink-200',
};

const categoryNames: Record<string, string> = {
  general: '通用',
  calculation: '计算题',
  proof: '证明题',
  choice: '选择题',
  custom: '自定义',
};

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      onClick={() => onClick(template.id)}
      className="group bg-white rounded-xl border border-gray-200 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-accent/50 hover:-translate-y-1"
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-primary group-hover:text-primary-light transition-colors">
            {template.name}
          </h3>
        </div>
        {template.isPreset && (
          <span className="px-2 py-0.5 bg-accent/10 text-accent-dark text-xs font-medium rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            预设
          </span>
        )}
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {template.description}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[template.category]}`}>
          {categoryNames[template.category]}
        </span>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">{template.usageCount} 次使用</span>
        </div>
      </div>
    </div>
  );
}
