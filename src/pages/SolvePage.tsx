import { useState, useEffect } from 'react';
import { useSolveStore } from '@/store/useSolveStore';
import ImageUploader from '@/components/upload/ImageUploader';
import ModelSelector from '@/components/solve/ModelSelector';
import TemplateSelector from '@/components/solve/TemplateSelector';
import ProgressIndicator from '@/components/solve/ProgressIndicator';
import ResultPanel from '@/components/solve/ResultPanel';
import { Send, FileText, Image as ImageIcon, Loader2, RotateCcw } from 'lucide-react';

export default function SolvePage() {
  const {
    problemContent,
    setProblemContent,
    selectedModel,
    setSelectedModel,
    selectedTemplateId,
    setSelectedTemplateId,
    detailLevel,
    setDetailLevel,
    taskStatus,
    progress,
    currentStage,
    result,
    error,
    startSolve,
    resetSolve,
  } = useSolveStore();

  const [inputMode, setInputMode] = useState<'image' | 'text'>('text');

  // 初始化时从设置加载默认值
  useEffect(() => {
    const savedSettings = localStorage.getItem('econsolve-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.defaultModel) setSelectedModel(settings.defaultModel);
      if (settings.defaultTemplateId) setSelectedTemplateId(settings.defaultTemplateId);
      if (settings.detailLevel) setDetailLevel(settings.detailLevel);
    }
  }, []);

  // OCR识别完成回调：将识别文本填入输入框并切换到文本模式
  const handleImageRecognized = (text: string) => {
    setProblemContent(text);
    setInputMode('text');
  };

  const handleStartSolve = async () => {
    await startSolve();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左栏 - 输入面板 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-display font-semibold text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              题目输入
            </h3>

            {/* Tab 切换 */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'text'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                文本输入
              </button>
              <button
                onClick={() => setInputMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'image'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                图片上传
              </button>
            </div>

            {/* 内容区 */}
            {inputMode === 'text' ? (
              <div className="space-y-3">
                <textarea
                  value={problemContent}
                  onChange={(e) => setProblemContent(e.target.value)}
                  placeholder="请在此输入或粘贴题目内容...&#10;&#10;例如：假设某完全竞争市场中，厂商的成本函数为 TC = Q³ - 6Q² + 20Q + 100，求该厂商的短期供给曲线。"
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>支持 Ctrl+V 粘贴</span>
                  <span>{problemContent.length} 字符</span>
                </div>
              </div>
            ) : (
              <ImageUploader onImageRecognized={handleImageRecognized} />
            )}
          </div>
        </div>

        {/* 中栏 - 控制面板 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h3 className="font-display font-semibold text-primary mb-4 flex items-center gap-2">
              ⚙️ 解析配置
            </h3>

            <div className="space-y-5">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />

              <TemplateSelector value={selectedTemplateId} onChange={setSelectedTemplateId} />

              {/* 详细程度 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  详细程度
                </label>
                <select
                  value={detailLevel}
                  onChange={(e) =>
                    setDetailLevel(e.target.value as 'concise' | 'standard' | 'detailed')
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="concise">简洁模式</option>
                  <option value="standard">标准模式（推荐）</option>
                  <option value="detailed">详细模式</option>
                </select>
              </div>

              {/* 进度指示器 */}
              {(taskStatus !== 'idle' && taskStatus !== 'completed' && taskStatus !== 'failed') && (
                <ProgressIndicator
                  status={taskStatus}
                  progress={progress}
                  currentStage={currentStage}
                  agentRecords={useSolveStore.getState().agentRecords}
                  qualityScores={useSolveStore.getState().qualityScores}
                />
              )}

              {/* 错误提示 */}
              {error && (
                <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3 pt-2">
                {taskStatus === 'idle' || taskStatus === 'failed' ? (
                  <button
                    onClick={handleStartSolve}
                    disabled={!problemContent.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                    开始解析
                  </button>
                ) : taskStatus !== 'completed' ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-300 text-gray-600 font-semibold rounded-xl cursor-not-allowed"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    处理中...
                  </button>
                ) : (
                  <button
                    onClick={resetSolve}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border-2 border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    重新开始
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右栏 - 结果展示区 */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 min-h-[600px]">
            <h3 className="font-display font-semibold text-primary mb-4 flex items-center gap-2">
              📊 解析结果
            </h3>
            <ResultPanel result={result} status={taskStatus} onRegenerate={startSolve} />
          </div>
        </div>
      </div>
    </div>
  );
}
