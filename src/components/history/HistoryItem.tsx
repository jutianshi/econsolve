import type { HistoryItem, ProblemType, TaskStatus } from '@/types';
import { Clock, Trash2, ChevronDown, ChevronRight, Brain, Calculator, PenTool, MessageSquare, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface HistoryItemProps {
  item: HistoryItem;
  onDelete: (id: string) => void;
}

const typeIcons: Record<ProblemType, React.ElementType> = {
  choice: Brain,
  calculation: Calculator,
  proof: PenTool,
  short_answer: MessageSquare,
  essay: BookOpen,
};

const typeNames: Record<ProblemType, string> = {
  choice: '选择题',
  calculation: '计算题',
  proof: '证明题',
  short_answer: '简答题',
  essay: '论述题',
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  analyzing: 'bg-blue-100 text-blue-600',
  solving: 'bg-purple-100 text-purple-600',
  generating: 'bg-indigo-100 text-indigo-600',
  validating: 'bg-cyan-100 text-cyan-600',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
};

const statusNames: Record<TaskStatus, string> = {
  pending: '等待中',
  analyzing: '分析中',
  solving: '解答中',
  generating: '生成中',
  validating: '验证中',
  completed: '已完成',
  failed: '失败',
};

export default function HistoryItemComponent({ item, onDelete }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = typeIcons[item.problemType];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="group relative pl-8 pb-6">
      {/* 时间线 */}
      <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200 last:h-0" />

      {/* 圆点 */}
      <div
        className={`absolute left-0 top-5 w-6 h-6 rounded-full border-2 ${
          item.status === 'completed'
            ? 'border-success bg-white'
            : item.status === 'failed'
            ? 'border-danger bg-white'
            : 'border-primary bg-white'
        } flex items-center justify-center`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            item.status === 'completed'
              ? 'bg-success'
              : item.status === 'failed'
              ? 'bg-danger'
              : 'bg-primary'
          }`}
        />
      </div>

      {/* 内容卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
        {/* 头部 - 可点击展开 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start justify-between text-left"
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                {statusNames[item.status]}
              </span>
              <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-relaxed">
              {item.problemContent}
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          )}
        </button>

        {/* 展开内容 */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">题型：</span>
                <span className="font-medium text-gray-800">{typeNames[item.problemType]}</span>
              </div>
              <div>
                <span className="text-gray-500">模型：</span>
                <span className="font-medium text-gray-800">{item.modelUsed}</span>
              </div>
              <div>
                <span className="text-gray-500">模板：</span>
                <span className="font-medium text-gray-800">{item.templateUsed || '默认'}</span>
              </div>
              <div>
                <span className="text-gray-500">时间：</span>
                <span className="font-medium text-gray-800">
                  {new Date(item.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>

            {/* 完整题目内容 */}
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.problemContent}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('确定要删除这条记录吗？')) {
                    onDelete(item.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">删除</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
