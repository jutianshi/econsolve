import type { SolutionResult } from '@/types';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface SolutionViewProps {
  solution: SolutionResult;
}

export default function SolutionView({ solution }: SolutionViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedAlts, setExpandedAlts] = useState<Record<number, boolean>>({});

  const toggleAlt = useCallback((index: number) => {
    setExpandedAlts(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  // 渲染数学公式
  useEffect(() => {
    if (contentRef.current && window.renderMathInElement) {
      window.renderMathInElement(contentRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
      });
    }
  }, [solution]);

  const handleCopyFormula = async (formula: string) => {
    await navigator.clipboard.writeText(formula);
  };

  return (
    <div ref={contentRef} className="space-y-6 py-3 paper-texture rounded-lg p-6">
      {/* 主要内容 */}
      <div className="prose prose-sm max-w-none">
        <div
          dangerouslySetInnerHTML={{
            __html: formatContent(solution.content || solution.reasoningProcess || '', solution as SolutionResult & { commonPitfalls?: string[] }),
          }}
        />
      </div>

      {/* 步骤列表 */}
      {solution.steps?.length > 0 && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="text-base font-display font-semibold text-primary mb-4">
            解答步骤
          </h4>
          <div className="space-y-4">
            {solution.steps.map((step, idx) => (
              <div
                key={step.stepNumber}
                className={`relative pl-12 pb-5 ${idx < (solution.steps!.length - 1) ? 'border-l-2 border-dashed border-accent/30' : ''}`}
              >
                {/* 序号徽章 */}
                <div className="absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {step.stepNumber}
                </div>
                <h5 className="font-semibold text-gray-800 mb-2">
                  步骤 {step.stepNumber}: {step.title}
                </h5>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {step.content}
                </p>
                {step.formulas && step.formulas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {step.formulas.map((formula, fIdx) => (
                      <div key={fIdx} className="relative group px-4 py-2 bg-primary/5 rounded-lg text-center">
                        ${formula}$
                        {/* 复制公式按钮 */}
                        <button
                          onClick={() => handleCopyFormula(formula)}
                          className="absolute top-1.5 right-1.5 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                          title="复制公式"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 替代解法 */}
      {solution.alternativeSolutions && solution.alternativeSolutions.length > 0 && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="text-base font-display font-semibold text-primary mb-4">
            其他解法
          </h4>
          <div className="space-y-4">
            {solution.alternativeSolutions.map((alt, index) => (
              <div key={index} className="bg-blue-50/50 rounded-lg overflow-hidden border border-blue-100/50">
                {/* 对比分析标签 */}
                <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full ml-4 mt-3">
                  对比分析
                </span>
                <button
                  onClick={() => toggleAlt(index)}
                  className="w-full px-4 pb-3 flex items-center gap-2 cursor-pointer font-medium text-primary hover:text-primary-light transition-colors"
                >
                  {expandedAlts[index] ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                  )}
                  💡 {alt.name}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedAlts[index] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-gray-600 italic">{alt.reason}</p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{alt.content}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatContent(content: string, solution?: SolutionResult & { commonPitfalls?: string[] }): string {
  let result = content;

  // 代码块（必须在其他处理之前）
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) =>
    `<pre class="code-block-dark my-4 p-4 rounded-lg overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>`
  );

  // 独立公式块 $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) =>
    `<div class="formula-block my-4 p-4 bg-slate-100 rounded-lg text-center overflow-x-auto">$$${formula}$$</div>`
  );

  // 分割线 ---
  result = result.replace(/^---$/gm, '<hr class="my-6 border-t border-gray-200" />');

  // 引用块 > 
  result = result.replace(/^&gt;\s+(.*$)/gm, '<blockquote class="border-l-4 border-accent pl-4 py-2 bg-accent/5 italic text-gray-600">$1</blockquote>');

  // 表格 | ... |
  result = convertTables(result);

  // 有序列表 1. 2. 等
  result = convertOrderedList(result);

  // 无序列表 - 或 *
  result = convertUnorderedList(result);

  // 删除线 ~~text~~
  result = result.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // 行内代码 `code`
  result = result.replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-primary">$1</code>');

  // 标题（保留原有）
  result = result.replace(/^### (.*$)/gm, '<h3 class="text-lg font-display font-semibold text-primary mt-6 mb-3">$1</h3>');
  result = result.replace(/^## (.*$)/gm, '<h2 class="text-xl font-display font-bold text-primary mt-8 mb-4">$1</h2>');
  result = result.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-display font-bold text-primary mt-8 mb-4">$1</h1>');

  // 加粗和斜体
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  result = result.replace(/\*(?=\S)(.+?)(?<=\S)\*/g, '<em>$1</em>');

  // 原有列表项 • （作为后备）
  result = result.replace(/^• (.*$)/gm, '<li class="ml-4 list-disc">$1</li>');

  // 换行
  result = result.replace(/\n/g, '<br />');

  // 追加常见易错点区块
  if (solution?.commonPitfalls && solution.commonPitfalls.length > 0) {
    const pitfallsHtml = solution.commonPitfalls
      .map(p => `<li class="flex items-start gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" /><span>${escapeHtml(p)}</span></li>`)
      .join('');
    result += `<div class="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
      <h4 class="font-display font-semibold text-warning mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" /> 常见易错点
      </h4>
      <ul class="space-y-2">${pitfallsHtml}</ul>
    </div>`;
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function convertTables(text: string): string {
  const lines = text.split('\n');
  let inTable = false;
  let tableLines: string[] = [];
  let resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      // 跳过分隔行 |---|---|
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        resultLines.push(renderTable(tableLines));
        inTable = false;
        tableLines = [];
      }
      resultLines.push(lines[i]);
    }
  }
  if (inTable && tableLines.length > 0) {
    resultLines.push(renderTable(tableLines));
  }

  return resultLines.join('\n');
}

function renderTable(lines: string[]): string {
  if (lines.length === 0) return '';
  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map(cell => cell.trim());

  const headers = parseRow(lines[0]);
  const bodyRows = lines.slice(1).map(parseRow);

  const headerHtml = headers.map(h => `<th class="px-4 py-2 text-left text-sm font-semibold text-primary bg-gray-50 border-b border-gray-200">${escapeHtml(h)}</th>`).join('');
  const bodyHtml = bodyRows.map((row, idx) => {
    const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
    return `<tr class="${bgClass}">${row.map(cell => `<td class="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('');

  return `<div class="my-4 overflow-x-auto rounded-lg border border-gray-200"><table class="w-full"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function convertOrderedList(text: string): string {
  return text.replace(/^(\d+)\.\s+(.*$)/gm, (_match, num, content) =>
    `<ol start="${num}" class="ml-6 list-decimal space-y-1"><li class="text-sm text-gray-700">${content}</li></ol>`
  );
}

function convertUnorderedList(text: string): string {
  return text.replace(/^[-*]\s+(.*$)/gm, (_match, content) =>
    `<ul class="ml-6 list-disc space-y-1"><li class="text-sm text-gray-700">${content}</li></ul>`
  );
}
