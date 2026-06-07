/**
 * 共享类型定义
 * 经济学考研题目解析系统 - 多Agent协作版本
 */

// ==================== OCR相关类型 ====================

/** OCR识别请求 */
export interface OcrRequest {
  image: string // base64编码的图片
}

/** OCR识别响应 */
export interface OcrResponse {
  success: boolean
  text: string
  confidence: number
  processingTime: number
}

// ==================== 题目解析相关类型 ====================

/** 题目解析请求（增强版） */
export interface SolveRequest {
  problemText?: string           // 文本输入（与image二选一）
  image?: string                 // 图片base64输入（与problemText二选一）
  templateId?: string            // 模板ID
  modelPreference?: string       // 模型偏好
  inputType?: 'text' | 'image'   // 输入类型（可选，自动检测）
}

/** 题目分析结果（多Agent版本） */
export interface AnalysisResult {
  /** 题目类型 */
  problemType: 'choice' | 'calculation' | 'proof' | 'short_answer' | 'essay'
  /** 涉及的知识点（到三级目录） */
  knowledgePoints: string[]
  /** 已知条件列表 */
  knownConditions: Array<{
    id: string
    variable: string
    description: string
    value?: string
    unit?: string
  }>
  /** 明确的求解目标 */
  solveTarget: string
  /** 难度评估 */
  difficulty: 'basic' | 'medium' | 'hard'
  /** 难度判断依据 */
  difficultyReason: string
  /** 可能涉及的核心方程 */
  keyEquations: string[]
  /** 建议解题思路 */
  suggestedApproach: string
  /** 预估步骤数 */
  estimatedSteps: number

  // 兼容旧字段（从新字段映射）
  subject: string
  keyPoints: string[]
  approach: string
  formulas: string[]
}

/** 解答结果（多Agent版本） */
export interface SolutionResult {
  /** 完整思考链 */
  reasoningProcess: string
  /** 详细解题步骤 */
  steps: SolutionStep[]
  /** 最终答案 */
  finalAnswer: string
  /** 方法总结 */
  methodSummary: string
  /** 备选解法 */
  alternativeSolution?: {
    name: string
    reason: string
    briefContent: string
  }
  /** 易错点提示 */
  commonMistakes: string[]

  // 兼容旧字段
  commonPitfalls: string[]
}

/** 解题步骤（多Agent版本） */
export interface SolutionStep {
  stepNumber: number
  title: string
  thinking: string               // 该步的思考过程
  content: string                // 执行的操作/推导（兼容旧字段）
  action: string                 // 执行的操作/推导
  result: string                 // 该步的结果/中间结论
  formula?: string               // 该步涉及的LaTeX公式
  justification: string          // 为什么这一步是合理的
}

/** LaTeX代码结果（多Agent版本） */
export interface LatexCodeResult {
  /** 可编译的LaTeX正文代码 */
  code: string
  /** 使用的环境列表 */
  usedEnvironments: string[]
  /** 需要的宏包 */
  packageRequirements: string[]
  /** 编译注意事项 */
  compilationNote: string

  // 兼容旧字段
  templateName: string
  qualityScore: number
}

/** 质量检查结果 */
export interface QualityCheckResult {
  passed: boolean
  scores: {
    completeness: number
    conciseness: number
    integrity: number
    overall: number
  }
  feedback: string
  issues: Array<{
    category: string
    severity: string
    location: string
    description: string
    fixSuggestion: string
  }>
  suggestion: string
}

/** 完整的解析结果（多Agent版本） */
export interface SolveResult {
  taskId: string
  status: TaskStatus
  progress: number
  analysis: AnalysisResult | null
  solution: SolutionResult | null
  latexCode: LatexCodeResult | null
  qualityCheck: QualityCheckResult | null  // 新增：质检结果
  pipelineInfo: {                          // 新增：管道执行信息
    totalDuration: number                  // 总耗时ms
    retryCount: number                     // 重试次数
    stagesCompleted: string[]              // 已完成的阶段
    errors: Array<{ stage: string; error: string }>
  } | null
  createdAt: string
  completedAt?: string
}

/** 任务状态 */
export type TaskStatus = 'pending' | 'ocr_processing' | 'analyzing' | 'solving' | 'generating' | 'quality_checking' | 'completed' | 'failed'

/** 任务状态查询响应 */
export interface TaskStatusResponse {
  taskId: string
  status: TaskStatus
  progress: number
  message: string
  currentStage?: string  // 当前阶段
}

// ==================== LLM配置相关类型 ====================

/** LLM平台配置 */
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek'
  apiKey: string
  baseUrl?: string
  model: string
}

/** 连接测试请求 */
export interface TestConnectionRequest {
  provider: 'openai' | 'anthropic' | 'deepseek'
  apiKey: string
  baseUrl?: string
  model: string
}

/** 连接测试响应 */
export interface TestConnectionResponse {
  success: boolean
  model: string
  latency: number
  error?: string
}

// ==================== 模板相关类型 ====================

/** 模板数据 */
export interface Template {
  id: string
  name: string
  description: string
  content: string // LaTeX模板内容
  category: 'general' | 'calculation' | 'proof'
  isPreset: boolean // 是否为预设模板
  createdAt: string
  updatedAt: string
}

// ==================== 历史记录相关类型 ====================

/** 历史记录项 */
export interface HistoryItem {
  id: string
  problemText: string
  problemType: string
  status: TaskStatus
  result?: SolveResult
  createdAt: string
}

// ==================== 设置相关类型 ====================

/** 系统设置（增强版） */
export interface Settings {
  defaultModel: string
  defaultTemplateId: string
  ocrLanguage: string
  autoSaveHistory: boolean
  maxHistoryItems: number
  latexRenderer: string
  // 新增：LLM配置
  llmConfig?: LLMConfig
  enableQualityCheck?: boolean
  maxRetries?: number
}

// ==================== LaTeX校验相关类型 ====================

/** LaTeX校验请求 */
export interface LatexValidateRequest {
  code: string
}

/** 校验检查项 */
export interface ValidationCheck {
  name: string
  passed: boolean
  message: string
}

/** LaTeX校验响应 */
export interface LatexValidateResponse {
  isValid: boolean
  score: number // 0-100
  checks: ValidationCheck[]
  errors: string[]
}
