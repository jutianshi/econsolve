import { CheckCircle, XCircle, Loader2, Circle, Clock, AlertCircle } from 'lucide-react';
import type { ExtendedTaskStatus, AgentExecutionRecord } from '@/types';

interface ProgressIndicatorProps {
  status: ExtendedTaskStatus;
  progress: number;
  currentStage?: string;
  agentRecords?: AgentExecutionRecord[];
  qualityScores?: { completeness: number; conciseness: number; integrity: number; overall: number } | null;
}

const PIPELINE_STAGES = [
  { key: 'ocr_recognizing' as const, label: 'OCR识别', icon: '📷' },
  { key: 'analyzing' as const, label: '题目分析', icon: '🔍' },
  { key: 'reasoning' as const, label: '深度推理', icon: '🧠' },
  { key: 'latex_generating' as const, label: 'LaTeX生成', icon: '📝' },
  { key: 'quality_checking' as const, label: '质量检验', icon: '✅' },
];

function getStageStatus(
  stageKey: string,
  currentStatus: ExtendedTaskStatus,
  records: AgentExecutionRecord[]
): 'completed' | 'running' | 'pending' | 'failed' {
  if (currentStatus === 'completed') return 'completed';
  if (currentStatus === 'failed') {
    const failedRecord = records.find((r) => r.status === 'failed');
    if (failedRecord && failedRecord.agentName.includes(stageKey.replace('_', ''))) return 'failed';
    const stageIdx = PIPELINE_STAGES.findIndex((s) => s.key === stageKey);
    const failedIdx = failedRecord
      ? PIPELINE_STAGES.findIndex((s) => s.label.includes(failedRecord.agentName.replace('Agent', '')))
      : -1;
    if (failedIdx >= 0 && stageIdx > failedIdx) return 'pending';
    return stageIdx < PIPELINE_STAGES.findIndex((s) => s.key === stageKey) ? 'completed' : 'pending';
  }

  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === currentStatus);
  const stageIdx = PIPELINE_STAGES.findIndex((s) => s.key === stageKey);
  if (stageIdx < currentIdx) return 'completed';
  if (stageIdx === currentIdx) return 'running';
  return 'pending';
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ProgressIndicator({
  status,
  progress,
  currentStage,
  agentRecords = [],
  qualityScores,
}: ProgressIndicatorProps) {
  const isActive = status !== 'idle' && status !== 'completed' && status !== 'failed';

  return (
    <div className="space-y-4">
      {/* 进度条 */}
      {isActive && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{currentStage || '处理中...'}</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Agent 管道可视化 */}
      <div className="relative">
        {/* 连接线 */}
        <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-gray-200 -z-10" />

        <div className="flex justify-between items-start">
          {PIPELINE_STAGES.map((stage) => {
            const stageStatus = getStageStatus(stage.key, status, agentRecords);
            const record = agentRecords.find((r) =>
              r.agentName.includes(stage.label)
            );

            return (
              <div key={stage.key} className="flex flex-col items-center gap-2 flex-1">
                {/* 节点圆圈 */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                    stageStatus === 'completed'
                      ? 'bg-success/10 border-success text-success'
                      : stageStatus === 'running'
                      ? 'bg-primary/10 border-primary text-primary animate-pulse'
                      : stageStatus === 'failed'
                      ? 'bg-danger/10 border-danger text-danger'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {stageStatus === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : stageStatus === 'running' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : stageStatus === 'failed' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>

                {/* 标签 */}
                <span
                  className={`text-xs font-medium text-center leading-tight ${
                    stageStatus === 'completed'
                      ? 'text-success'
                      : stageStatus === 'running'
                      ? 'text-primary'
                      : stageStatus === 'failed'
                      ? 'text-danger'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>

                {/* 耗时或状态 */}
                {stageStatus === 'completed' && record?.durationMs && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDuration(record.durationMs)}
                  </span>
                )}
                {stageStatus === 'running' && (
                  <span className="text-[10px] text-primary">处理中...</span>
                )}
                {stageStatus === 'pending' && (
                  <span className="text-[10px] text-gray-400">等待中</span>
                )}
                {stageStatus === 'failed' && record?.error && (
                  <span className="text-[10px] text-danger max-w-[80px] truncate" title={record.error}>
                    {record.error}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 完成状态 */}
      {status === 'completed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 bg-success/10 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">解析完成！</span>
          </div>

          {qualityScores && (
            <div className="grid grid-cols-4 gap-2 px-2">
              {[
                { label: '完整度', value: qualityScores.completeness },
                { label: '简洁度', value: qualityScores.conciseness },
                { label: '准确性', value: qualityScores.integrity },
                { label: '综合', value: qualityScores.overall },
              ].map((score) => (
                <div key={score.label} className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-lg font-bold text-primary">{score.value}</p>
                  <p className="text-[10px] text-gray-500">{score.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 失败状态 */}
      {status === 'failed' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-danger" />
          <span className="text-sm font-medium text-danger">解析失败</span>
        </div>
      )}
    </div>
  );
}
