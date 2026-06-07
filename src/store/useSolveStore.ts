import { create } from 'zustand';
import type { TaskStatus, SolveResult, ModelId, ExtendedTaskStatus, AgentExecutionRecord } from '@/types';

interface SolveState {
  problemContent: string;
  setProblemContent: (content: string) => void;
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  detailLevel: 'concise' | 'standard' | 'detailed';
  setDetailLevel: (level: 'concise' | 'standard' | 'detailed') => void;
  taskId: string | null;
  taskStatus: ExtendedTaskStatus;
  progress: number;
  currentStage: string;
  result: SolveResult | null;
  error: string | null;
  agentRecords: AgentExecutionRecord[];
  currentAgentIndex: number;
  qualityScores: { completeness: number; conciseness: number; integrity: number; overall: number } | null;
  startSolve: () => Promise<void>;
  resetSolve: () => void;
  pollTaskStatus: (taskId: string) => Promise<void>;
  getActiveAgents: () => string[];
  getCurrentAgentName: () => string;
}

const AGENT_STAGES: { key: ExtendedTaskStatus; label: string; agentName: string }[] = [
  { key: 'ocr_recognizing', label: 'OCR识别', agentName: 'OCR识别Agent' },
  { key: 'analyzing', label: '题目分析', agentName: '题目分析Agent' },
  { key: 'reasoning', label: '深度推理', agentName: '深度推理Agent' },
  { key: 'latex_generating', label: 'LaTeX生成', agentName: 'LaTeX生成Agent' },
  { key: 'quality_checking', label: '质量检验', agentName: '质量检验Agent' },
];

function stageToExtendedStatus(status: TaskStatus): ExtendedTaskStatus {
  const map: Record<string, ExtendedTaskStatus> = {
    pending: 'idle',
    analyzing: 'analyzing',
    solving: 'reasoning',
    generating: 'latex_generating',
    validating: 'quality_checking',
    completed: 'completed',
    failed: 'failed',
  };
  return map[status] ?? 'idle';
}

function getProgressForStage(stage: ExtendedTaskStatus): number {
  const map: Record<ExtendedTaskStatus, number> = {
    idle: 0,
    ocr_recognizing: 10,
    analyzing: 30,
    reasoning: 50,
    latex_generating: 75,
    quality_checking: 90,
    completed: 100,
    failed: 0,
  };
  return map[stage] ?? 0;
}

export const useSolveStore = create<SolveState>((set, get) => ({
  problemContent: '',
  setProblemContent: (content) => set({ problemContent: content }),

  selectedModel: 'auto',
  setSelectedModel: (model) => set({ selectedModel: model }),

  selectedTemplateId: '',
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  detailLevel: 'standard',
  setDetailLevel: (level) => set({ detailLevel: level }),

  taskId: null,
  taskStatus: 'idle',
  progress: 0,
  currentStage: '',

  result: null,
  error: null,

  agentRecords: [],
  currentAgentIndex: -1,
  qualityScores: null,

  getActiveAgents: () => {
    const { agentRecords } = get();
    return agentRecords.map((r) => r.agentName);
  },

  getCurrentAgentName: () => {
    const { agentRecords, currentAgentIndex } = get();
    if (currentAgentIndex >= 0 && currentAgentIndex < agentRecords.length) {
      return agentRecords[currentAgentIndex].agentName;
    }
    return '';
  },

  startSolve: async () => {
    const { problemContent, selectedModel, selectedTemplateId, detailLevel } = get();

    if (!problemContent.trim()) {
      set({ error: '请输入题目内容' });
      return;
    }

    set({
      taskStatus: 'ocr_recognizing',
      progress: 10,
      currentStage: '正在识别题目内容...',
      error: null,
      result: null,
      agentRecords: [],
      currentAgentIndex: 0,
      qualityScores: null,
    });

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: problemContent,
          templateId: selectedTemplateId || undefined,
          modelPreference: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('提交失败');
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || '提交失败');
      }

      const taskId = json.data.taskId;
      set({
        taskId,
        taskStatus: 'ocr_recognizing',
        progress: 10,
        currentStage: '正在识别题目内容...',
      });

      await get().pollTaskStatus(taskId);
    } catch (error) {
      set({
        taskStatus: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
        currentStage: '',
      });
    }
  },

  pollTaskStatus: async (taskId: string) => {
    try {
      const response = await fetch(`/api/solve/${taskId}/status`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '获取状态失败');
      }

      const data = json.data;

      if (data.status === 'completed') {
        const resultResponse = await fetch(`/api/solve/${taskId}/result`);
        const resultJson = await resultResponse.json();

        if (resultJson.success && resultJson.data) {
          const taskData = resultJson.data;
          const pipeline = taskData.pipeline;
          set({
            taskStatus: 'completed',
            progress: 100,
            currentStage: '解析完成！',
            result: {
              analysis: taskData.analysis,
              solution: taskData.solution,
              latexCode: taskData.latexCode,
              metadata: {
                modelUsed: taskData.modelUsed || 'gpt-4o',
                templateUsed: taskData.templateUsed || '通用标准模板',
                totalProcessingTime: taskData.totalProcessingTime || 0,
                tokenUsage: taskData.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              },
            },
            agentRecords: pipeline?.agentRecords ?? [],
            qualityScores: pipeline?.qualityScores ?? null,
          });
        }
      } else if (data.status === 'failed') {
        set({
          taskStatus: 'failed',
          error: '解析失败，请重试',
          progress: 0,
        });
      } else {
        const extStatus = stageToExtendedStatus(data.status);
        const stageInfo = AGENT_STAGES.find((s) => s.key === extStatus);
        const agentIndex = AGENT_STAGES.findIndex((s) => s.key === extStatus);

        // 更新agent记录
        const existingRecords = get().agentRecords;
        let updatedRecords = [...existingRecords];
        if (agentIndex >= 0 && !existingRecords.find((r) => r.agentName === stageInfo?.agentName)) {
          updatedRecords.push({
            agentName: stageInfo?.agentName ?? data.status,
            status: 'running',
            startTime: new Date().toISOString(),
          });
        }

        set({
          taskStatus: extStatus,
          currentStage: data.message || stageInfo?.label || '处理中...',
          progress: getProgressForStage(extStatus),
          agentRecords: updatedRecords,
          currentAgentIndex: agentIndex,
        });

        setTimeout(() => get().pollTaskStatus(taskId), 2000);
      }
    } catch (error) {
      set({
        taskStatus: 'failed',
        error: '获取任务状态失败',
      });
    }
  },

  resetSolve: () => set({
    taskId: null,
    taskStatus: 'idle',
    progress: 0,
    currentStage: '',
    result: null,
    error: null,
    agentRecords: [],
    currentAgentIndex: -1,
    qualityScores: null,
  }),
}));
