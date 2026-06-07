// 题目类型枚举
export type ProblemType = 'choice' | 'calculation' | 'proof' | 'short_answer' | 'essay';

// 难度枚举
export type Difficulty = 'basic' | 'medium' | 'hard';

// 任务状态
export type TaskStatus = 'pending' | 'analyzing' | 'solving' | 'generating' | 'validating' | 'completed' | 'failed';

// 模型ID
export type ModelId = 'gpt-4o' | 'o3-mini' | 'claude-3.7-sonnet' | 'deepseek-r1' | 'auto';

export interface AnalysisResult {
  problemType: ProblemType;
  knowledgePoints: string[];
  knownConditions: string[];
  solveTarget: string;
  difficulty: Difficulty;
  rawJson: string;
}

export interface SolutionResult {
  content: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    content: string;
    formulas?: string[];
  }>;
  alternativeSolutions?: Array<{
    name: string;
    reason: string;
    content: string;
  }>;
}

export interface LatexCodeResult {
  code: string;
  validationResult: {
    isValid: boolean;
    errors: Array<{
      line: number;
      message: string;
      suggestion: string;
    }>;
    warnings: string[];
  };
}

export interface SolveResult {
  analysis: AnalysisResult;
  solution: SolutionResult;
  latexCode: LatexCodeResult;
  metadata: {
    modelUsed: string;
    templateUsed: string;
    totalProcessingTime: number;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'calculation' | 'proof' | 'choice' | 'custom';
  isPreset: boolean;
  content: string;
  variableCount: number;
  usageCount: number;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  problemContent: string;
  problemType: ProblemType;
  modelUsed: string;
  templateUsed: string;
  status: TaskStatus;
  createdAt: string;
  result?: SolveResult;
}

export interface AppSettings {
  defaultModel: ModelId;
  defaultTemplateId: string;
  detailLevel: 'concise' | 'standard' | 'detailed';
  outputLanguage: 'zh-CN' | 'en';
}

// ==================== 大模型配置相关类型 ====================

/** 支持的LLM提供商 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek';

/** LLM提供商配置 */
export interface LLMProviderConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isEnabled: boolean;
  createdAt: string;
}

/** 预设模型选项 */
export interface ModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  models: string[];
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    maxContext: number;
    recommendedUse: string;
  };
}

/** 解析任务的新状态（扩展版） */
export type ExtendedTaskStatus =
  | 'idle'
  | 'ocr_recognizing'
  | 'analyzing'
  | 'reasoning'
  | 'latex_generating'
  | 'quality_checking'
  | 'completed'
  | 'failed';

/** Agent执行记录 */
export interface AgentExecutionRecord {
  agentName: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  inputSummary?: string;
  outputSummary?: string;
  error?: string;
}

/** 扩展的解析结果 */
export interface ExtendedSolveResult extends SolveResult {
  pipeline: {
    orchestratorId: string;
    agentRecords: AgentExecutionRecord[];
    totalDuration: number;
    qualityScores?: {
      completeness: number;
      conciseness: number;
      integrity: number;
      overall: number;
    };
    retryCount: number;
  };
}
