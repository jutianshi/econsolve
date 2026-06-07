import { useState, useRef, useEffect } from 'react';
import type { SolveResult, ExtendedTaskStatus } from '@/types';
import AnalysisView from './AnalysisView';
import SolutionView from './SolutionView';
import LatexCodeView from './LatexCodeView';
import {
  Copy,
  Download,
  RefreshCw,
  BarChart3,
  FileText,
  Code,
  Maximize2,
  FileDown,
  Check,
} from 'lucide-react';

interface ResultPanelProps {
  result: SolveResult | null;
  status: ExtendedTaskStatus;
  onRegenerate?: () => void;
}

export default function ResultPanel({ result, status, onRegenerate }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { id: 'analysis', title: '题目分析', icon: BarChart3 },
    { id: 'solution', title: '详细解答', icon: FileText },
    { id: 'latex', title: 'LaTeX代码', icon: Code },
  ];

  // 更新滑动指示器位置
  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  // Toast 反馈
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // 复制功能
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.solution.content);
      showToast('已复制到剪贴板');
    }
  };

  // 下载 LaTeX
  const handleDownloadTex = () => {
    if (result) {
      const blob = new Blob([result.latexCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solution_${Date.now()}.tex`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('已下载 .tex 文件');
    }
  };

  // 导出 Markdown
  const handleExportMarkdown = () => {
    if (result) {
      const markdown = `# 题目解析\n\n## 分析\n\n${result.analysis.summary}\n\n## 解答\n\n${result.solution.content}\n\n---\n*由 EconSolve 智能生成*`;
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solution_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('已导出 Markdown');
    }
  };

  // 全屏查看
  const handleFullscreen = () => {
    window.print();
  };

  if (status === 'idle') {
    return (
      <div className="h-full flex items-center justify-center">
        {/* 设计感空状态插图 - CSS 几何图形 */}
        <div className="relative w-48 h-48">
          {/* 外圈渐变圆环 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary-light/20 animate-pulse" />
          {/* 中圈 */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-accent/30 to-primary/10" />
          {/* 内圈 */}
          <div className="absolute inset-14 rounded-full bg-gradient-to-bl from-primary/40 to-accent/20 shadow-lg" />
          {/* 核心点 */}
          <div className="absolute inset-[88px] rounded-full bg-accent shadow-md shadow-accent/50" />
          {/* 装饰小圆点 */}
          <div className="absolute top-4 right-8 w-3 h-3 rounded-full bg-primary/60" />
          <div className="absolute bottom-8 left-4 w-2 h-2 rounded-full bg-accent/60" />
          <div className="absolute top-1/2 left-2 w-2.5 h-2.5 rounded-full bg-primary-light/60" />
        </div>
        <div className="ml-6 text-left">
          <p className="text-lg font-medium text-gray-600 mb-1">等待输入</p>
          <p className="text-sm text-gray-400">提交题目后将在此显示解析结果</p>
        </div>
      </div>
    );
  }

  if (!result && status !== 'completed') {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab 导航栏 */}
      <div className="relative border-b border-gray-200 bg-white rounded-t-xl">
        <div className="flex px-4">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
              {tab.title}
            </button>
          ))}
        </div>
        {/* 滑动下划线指示器 */}
        <div
          className="absolute bottom-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>

      {/* Tab 内容区域 */}
      <div className="flex-1 overflow-auto p-4 bg-white/50 rounded-b-xl animate-fade-in">
        {activeTab === 'analysis' && result && <AnalysisView analysis={result.analysis} />}
        {activeTab === 'solution' && result && <SolutionView solution={result.solution} />}
        {activeTab === 'latex' && result && <LatexCodeView latexCode={result.latexCode} />}
      </div>

      {/* 工具栏 + Toast */}
      <div className="relative mt-4">
        {status === 'completed' && result && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all hover:shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">复制解答</span>
            </button>

            <button
              onClick={handleDownloadTex}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/10 text-accent-dark rounded-lg hover:bg-accent/20 transition-all hover:shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">下载 .tex</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-all hover:shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-sm font-medium">导出 Markdown</span>
            </button>

            <button
              onClick={handleFullscreen}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all hover:shadow-sm"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-sm font-medium">全屏查看</span>
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-warning/10 text-warning-dark rounded-lg hover:bg-warning/20 transition-all hover:shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">重新生成</span>
              </button>
            )}
          </div>
        )}

        {/* Toast 反馈 */}
        {toastMessage && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-fade-in z-50">
            <Check className="w-4 h-4 text-green-400" />
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
