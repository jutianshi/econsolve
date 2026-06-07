import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnalysisResult } from '@/types';
import { Copy, Check, ChevronDown, ChevronRight, Target, BookOpen } from 'lucide-react';

interface AnalysisViewProps {
  analysis: AnalysisResult;
}

const difficultyConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  basic: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', icon: '🟢' },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '🟡' },
  hard: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', icon: '🔴' },
};

const difficultyNames: Record<string, string> = {
  basic: '基础',
  medium: '中等',
  hard: '困难',
};

const problemTypeNames: Record<string, string> = {
  choice: '选择题',
  calculation: '计算题',
  proof: '证明题',
  short_answer: '简答题',
  essay: '论述题',
};

// JSON 语法着色
function syntaxHighlightJson(jsonStr: string): string {
  const escaped = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/(".*?")\s*:/g, '<span class="text-purple-600 font-semibold">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="text-green-600">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-orange-500">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-blue-600">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="text-gray-400">$1</span>');
}

export default function AnalysisView({ analysis }: AnalysisViewProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [copiedPoint, setCopiedPoint] = useState<string | null>(null);
  const formulaRef = useRef<HTMLDivElement>(null);

  // 渲染已知条件中的公式
  useEffect(() => {
    if (formulaRef.current && window.renderMathInElement) {
      window.renderMathInElement(formulaRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
      });
    }
  }, [analysis.knownConditions]);

  const handleCopyPoint = useCallback(async (point: string) => {
    try {
      await navigator.clipboard.writeText(point);
      setCopiedPoint(point);
      setTimeout(() => setCopiedPoint(null), 1500);
    } catch {
      // ignore
    }
  }, []);

  const diffConfig = difficultyConfig[analysis.difficulty] || difficultyConfig.medium;

  return (
    <div className="space-y-4 py-3" ref={formulaRef}>
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="px-4 py-3 bg-surface rounded-lg">
          <p className="text-xs text-gray-500 mb-1">题目类型</p>
          <p className="text-sm font-semibold text-primary">
            {problemTypeNames[analysis.problemType] || analysis.problemType}
          </p>
        </div>
        <div className={`px-4 py-3 rounded-lg ${diffConfig.bg} border ${diffConfig.border}`}>
          <p className="text-xs text-gray-500 mb-1">难度等级</p>
          <div className="flex items-center gap-2">
            <span className="text-base">{diffConfig.icon}</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${diffConfig.color}`}>
              {difficultyNames[analysis.difficulty] || analysis.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* 知识点 - Pill 标签（可点击复制） */}
      <div className="px-4 py-3 bg-surface rounded-lg">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> 涉及知识点
        </p>
        <div className="flex flex-wrap gap-2">
          {analysis.knowledgePoints.map((point, index) => (
            <button
              key={index}
              onClick={() => handleCopyPoint(point)}
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs rounded-full font-medium hover:from-primary/20 hover:to-accent/20 transition-all cursor-pointer border border-primary/10 hover:border-primary/30"
              title="点击复制"
            >
              {copiedPoint === point ? (
                <>
                  <Check className="w-3 h-3 text-success" />
                  <span className="text-success">已复制!</span>
                </>
              ) : (
                <>
                  <span>{point}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 已知条件 - 卡片式列表 */}
      <div className="px-4 py-3 bg-surface rounded-lg">
        <p className="text-xs text-gray-500 mb-3">已知条件</p>
        <div className="grid gap-2">
          {analysis.knownConditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-accent/30 transition-colors"
            >
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed flex-1">{condition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 求解目标 - 渐变背景高亮 */}
      <div className="relative overflow-hidden rounded-lg p-4 bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border border-accent/20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
        <p className="relative flex items-center gap-2 text-xs text-gray-500 mb-1.5">
          <Target className="w-3.5 h-3.5 text-accent" /> 求解目标
        </p>
        <p className="relative text-base font-semibold text-gray-800 leading-relaxed">
          {analysis.solveTarget}
        </p>
      </div>

      {/* 原始JSON（可折叠 + 语法着色） */}
      {analysis.rawJson && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setJsonExpanded(!jsonExpanded)}
            className="w-full px-4 py-2.5 flex items-center gap-2 text-xs text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
          >
            {jsonExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            查看原始分析数据 (JSON)
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              jsonExpanded ? 'max-h-[400px]' : 'max-h-0'
            }`}
          >
            <pre className="m-0 p-4 code-block-dark text-xs overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto">
              <code
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlightJson(JSON.stringify(JSON.parse(analysis.rawJson), null, 2)),
                }}
              />
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
