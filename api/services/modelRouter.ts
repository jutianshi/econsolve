/**
 * 模型路由服务
 * 根据题目类型和用户偏好选择最合适的AI模型
 */

/** 题目类型 */
type ProblemType = 'calculation' | 'proof' | 'analysis'

/** 模型路由规则 */
interface RoutingRule {
  /** 适用的题目类型 */
  problemType: ProblemType
  /** 推荐模型列表（按优先级排序） */
  models: string[]
  /** 选择理由 */
  reason: string
}

/** 路由规则映射表 */
const ROUTING_RULES: Record<ProblemType, RoutingRule> = {
  calculation: {
    problemType: 'calculation',
    models: ['o3-mini', 'deepseek-v4-pro', 'deepseek-r1', 'gpt-4o'],
    reason: '计算题需要强大的数学推理能力，o3-mini在数学计算方面表现优异'
  },
  proof: {
    problemType: 'proof',
    models: ['claude-3.7-sonnet', 'deepseek-v4-pro', 'o3-mini', 'deepseek-r1'],
    reason: '证明题需要严密的逻辑推理，Claude在逻辑链推理上具有优势'
  },
  analysis: {
    problemType: 'analysis',
    models: ['gpt-4o', 'deepseek-v4-pro', 'claude-3.7-sonnet', 'deepseek-r1'],
    reason: '分析题需要综合理解能力，GPT-4o在综合分析任务上表现均衡'
  }
}

/** 可用的模型列表 */
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: '通用性强，适合大多数场景' },
  { id: 'o3-mini', name: 'o3-mini', provider: 'OpenAI', description: '擅长数学推理和计算' },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: '逻辑推理能力强' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: '性价比高，中文能力强' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', description: '最新旗舰，多模态+深度推理全能' }
]

/**
 * 根据题目类型和用户偏好选择模型
 * @param problemType 题目类型
 * @param userPreference 用户偏好的模型ID（可选）
 * @returns 选定的模型ID
 */
export function selectModel(problemType: ProblemType, userPreference?: string): string {
  // 如果用户有明确偏好且模型可用，优先使用用户选择的模型
  if (userPreference) {
    const isAvailable = AVAILABLE_MODELS.some(m => m.id === userPreference)
    if (isAvailable) {
      return userPreference
    }
  }

  // 否则根据路由规则选择最佳模型
  const rule = ROUTING_RULES[problemType]
  return rule.models[0] // 返回优先级最高的模型
}

/**
 * 获取指定题目类型的推荐模型列表
 * @param problemType 题目类型
 */
export function getRecommendedModels(problemType: ProblemType): RoutingRule {
  return ROUTING_RULES[problemType]
}

/**
 * 获取所有路由规则（用于管理界面展示）
 */
export function getAllRoutingRules(): Record<ProblemType, RoutingRule> {
  return ROUTING_RULES
}
