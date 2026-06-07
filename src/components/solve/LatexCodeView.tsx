import { useState, useRef, useEffect } from 'react';
import type { LatexCodeResult } from '@/types';
import { Code, Eye, Copy, ExternalLink } from 'lucide-react';

interface LatexCodeViewProps {
  latexCode: LatexCodeResult;
}

// LaTeX 关键字语法高亮规则
const LATEX_PATTERNS: Array<{ pattern: RegExp; className: string }> = [
  { pattern: /(\\begin\{[^}]+\})/g, className: 'text-purple-600 font-semibold' },
  { pattern: /(\\end\{[^}]+\})/g, className: 'text-purple-600 font-semibold' },
  { pattern: /(\\section\*?|\\subsection\*?|\\subsubsection\*?)\s*\{[^}]*\}/g, className: 'text-blue-700 font-bold' },
  { pattern: /(\\frac|\\sqrt|\\sum|\\prod|\\int|\\lim|\\sin|\\cos|\\tan|\\log|\\ln)(?=\b|\{)/g, className: 'text-orange-600 font-semibold' },
  { pattern: /(\\textbf|\\textit|\\underline|\\emph)\{[^}]*\}/g, className: 'text-green-700' },
  { pattern: /(\\[a-zA-Z]+)/g, className: 'text-pink-600' }, // 其他命令
  { pattern: /(\{[^}]*\})/g, className: 'text-gray-700' }, // 参数
  { pattern: /(%.*$)/gm, className: 'text-gray-400 italic' }, // 注释
];

function highlightLatex(code: string): string {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  LATEX_PATTERNS.forEach(({ pattern, className }) => {
    escaped = escaped.replace(pattern, `<span class="${className}">$&</span>`);
  });

  return escaped;
}

export default function LatexCodeView({ latexCode }: LatexCodeViewProps) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [copyText, setCopyText] = useState<string>('复制');
  const previewRef = useRef<HTMLDivElement>(null);

  const code = latexCode.code || '';

  useEffect(() => {
    if (viewMode === 'preview' && previewRef.current && window.renderMathInElement) {
      window.renderMathInElement(previewRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
      });
    }
  }, [viewMode, code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyText('已复制!');
      setTimeout(() => setCopyText('复制'), 2000);
    } catch {
      setCopyText('失败');
      setTimeout(() => setCopyText('复制'), 2000);
    }
  };

  const handleNewWindowPreview = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LaTeX 预览</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; background: #fafafa; }
    .preview-content { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="preview-content">${code}</div>
  <script>
    renderMathInElement(document.body, {
      delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]
    });
  <\/script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="py-3 space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'code'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Code className="w-4 h-4" />
          源码
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'preview'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          预览
        </button>
      </div>

      {/* 源码视图 */}
      {viewMode === 'code' && (
        <div className="relative group">
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              onClick={handleNewWindowPreview}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
              title="在新窗口预览"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm text-xs font-medium text-gray-700 whitespace-nowrap"
            >
              {copyText}
            </button>
          </div>

          <pre className="code-block-dark max-h-96 overflow-auto text-sm leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlightLatex(code) }} />
          </pre>
        </div>
      )}

      {/* 预览视图 */}
      {viewMode === 'preview' && (
        <div className="max-h-96 overflow-auto bg-white rounded-lg border border-gray-200 p-6">
          <div ref={previewRef} className="latex-preview-content">
            {code.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: code }} />
            ) : (
              <p className="text-gray-500 text-center py-8">无 LaTeX 内容</p>
            )}
          </div>
        </div>
      )}

      {/* 验证结果 */}
      {latexCode.validationResult && (
        <div className="space-y-3">
          {/* 状态卡片 + 进度条分数 */}
          <div className={`px-4 py-3 rounded-lg ${
            latexCode.validationResult.isValid
              ? 'bg-success/10 border border-success/30'
              : 'bg-danger/10 border border-danger/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${
                latexCode.validationResult.isValid ? 'text-success' : 'text-danger'
              }`}>
                {latexCode.validationResult.isValid ? '✅ 验证通过' : '❌ 存在错误'}
              </span>
              <span className="text-xs text-gray-500">
                {latexCode.validationResult.isValid ? '100%' : '0%'}
              </span>
            </div>
            {/* 进度条样式的分数展示 */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  latexCode.validationResult.isValid ? 'bg-success w-full' : 'bg-danger w-0'
                }`}
              />
            </div>
          </div>

          {/* 错误列表 */}
          {!latexCode.validationResult.isValid &&
            latexCode.validationResult.errors &&
            latexCode.validationResult.errors.length > 0 && (
            <div className="space-y-2">
              {latexCode.validationResult.errors.map((error, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-danger/5 rounded-lg border border-danger/20"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-danger font-mono text-xs mt-0.5 shrink-0">
                      行 {error.line}:
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-danger font-medium">{error.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{error.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 警告列表 */}
          {latexCode.validationResult.warnings &&
            latexCode.validationResult.warnings.length > 0 && (
            <div className="space-y-2">
              {latexCode.validationResult.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <p className="text-sm text-yellow-800">⚠️ {warning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
