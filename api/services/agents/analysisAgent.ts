/**
 * Analysis Agent - 深度分析Agent
 * 负责对题目进行深度分析：题型识别、知识图谱构建、难度评估、策略规划
 * 必须启用深度思考模式
 */

import type { UnifiedLLMClient } from '../llmClient.js'
import { getAnalysisSystemPrompt } from '../../core/prompts.js'

// ==================== 类型定义 ====================

/** 已知条件结构 */
export interface Condition {
  id: string
  variable: string      // 变量符号
  description: string   // 描述
  value?: string        // 数值（如果有）
  unit?: string         // 单位
}

/** 分析Agent输出结构 */
export interface AnalysisAgentOutput {
  problemType: 'choice' | 'calculation' | 'proof' | 'short_answer' | 'essay'
  knowledgePoints: string[]     // 涉及的知识点（到三级目录）
  knownConditions: Condition[]   // 已知条件列表
  solveTarget: string           // 明确的求解目标
  difficulty: 'basic' | 'medium' | 'hard'
  difficultyReason: string      // 难度判断依据
  keyEquations: string[]        // 可能涉及的核心方程
  suggestedApproach: string     // 建议解题思路
  estimatedSteps: number        // 预估步骤数
}

// ==================== Analysis Agent 类 ====================

/**
 * Analysis Agent
 * 对经济学考研题目进行深度的结构性分析
 * 启用深度思考模式确保分析质量
 */
export class AnalysisAgent {
  private llmClient: UnifiedLLMClient

  constructor(llmClient: UnifiedLLMClient) {
    this.llmClient = llmClient
  }

  /**
   * 执行深度分析
   * @param problemText 题目文本
   * @returns 结构化的分析结果
   */
  async execute(problemText: string): Promise<AnalysisAgentOutput> {
    const startTime = Date.now()
    console.log('[AnalysisAgent] 开始深度分析题目...')

    try {
      const systemPrompt = getAnalysisSystemPrompt()

      // 构建用户消息 - 包含待分析的题目
      const userMessage = `请对以下经济学考研题目进行深度分析：

## 待分析的题目
${problemText}

请按照要求进行四层思考后，输出完整的JSON格式分析结果。`

      // 调用LLM - 启用深度思考模式
      const response = await this.llmClient.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.2,  // 低温度保证分析稳定性
        maxTokens: 4096,
        reasoningEffort: 'high'  // 启用深度思考
      })

      // 解析响应
      const result = this.parseResponse(response.content)

      const elapsed = Date.now() - startTime
      console.log(`[AnalysisAgent] 分析完成 (${elapsed}ms)`)
      console.log(`[AnalysisAgent] 题型: ${result.problemType}, 难度: ${result.difficulty}, 步骤预估: ${result.estimatedSteps}`)

      return result

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[AnalysisAgent] 分析失败 (${elapsed}ms):`, error)

      // 返回基础的分析结果作为降级
      return this.getFallbackAnalysis(problemText, error)
    }
  }

  /**
   * 解析LLM响应为结构化对象
   */
  private parseResponse(content: string): AnalysisAgentOutput {
    try {
      const cleaned = this.extractJson(content)
      const parsed = JSON.parse(cleaned) as Partial<AnalysisAgentOutput>

      // 字段验证和默认值填充
      return {
        problemType: this.validateProblemType(parsed.problemType),
        knowledgePoints: Array.isArray(parsed.knowledgePoints) ? parsed.knowledgePoints : [],
        knownConditions: Array.isArray(parsed.knownConditions)
          ? parsed.knownConditions.map((c, i) => ({
              id: c.id || `cond_${i + 1}`,
              variable: c.variable || '',
              description: c.description || '',
              value: c.value,
              unit: c.unit
            }))
          : [],
        solveTarget: parsed.solveTarget || '完成题目要求',
        difficulty: this.validateDifficulty(parsed.difficulty),
        difficultyReason: parsed.difficultyReason || '无法判断',
        keyEquations: Array.isArray(parsed.keyEquations) ? parsed.keyEquations : [],
        suggestedApproach: parsed.suggestedApproach || '根据题目要求逐步求解',
        estimatedSteps: typeof parsed.estimatedSteps === 'number' && parsed.estimatedSteps > 0
          ? parsed.estimatedSteps
          : 3
      }

    } catch (error) {
      console.warn('[AnalysisAgent] JSON解析失败:', error)
      throw new Error('分析结果解析失败')
    }
  }

  /**
   * 提取JSON内容
   */
  private extractJson(content: string): string {
    const jsonCodeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonCodeBlockMatch) {
      return jsonCodeBlockMatch[1].trim()
    }

    const braceMatch = content.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      return braceMatch[0]
    }

    return content.trim()
  }

  /**
   * 验证并规范化题型
   */
  private validateProblemType(type?: string): AnalysisAgentOutput['problemType'] {
    const validTypes: AnalysisAgentOutput['problemType'][] = [
      'choice', 'calculation', 'proof', 'short_answer', 'essay'
    ]
    if (type && validTypes.includes(type as AnalysisAgentOutput['problemType'])) {
      return type as AnalysisAgentOutput['problemType']
    }
    // 根据关键词推断
    return 'calculation' // 默认
  }

  /**
   * 验证并规范化难度
   */
  private validateDifficulty(difficulty?: string): AnalysisAgentOutput['difficulty'] {
    const validDifficulties: AnalysisAgentOutput['difficulty'][] = ['basic', 'medium', 'hard']
    if (difficulty && validDifficulties.includes(difficulty as AnalysisAgentOutput['difficulty'])) {
      return difficulty as AnalysisAgentOutput['difficulty']
    }
    return 'medium' // 默认中等
  }

  /**
   * 降级分析结果（当LLM调用失败时）
   */
  private getFallbackAnalysis(problemText: string, error: unknown): AnalysisAgentOutput {
    console.warn('[AnalysisAgent] 使用降级分析')

    // 基于简单规则的基础分析
    const isCalculation = problemText.includes('求') || problemText.includes('计算')
    const isProof = problemText.includes('证明') || problemText.includes('推导') || problemText.includes('证明')
    const isChoice = problemText.includes('A.') || problemText.includes('A、') || problemText.includes('(A)')

    return {
      problemType: isChoice ? 'choice' : (isCalculation ? 'calculation' : (isProof ? 'proof' : 'short_answer')),
      knowledgePoints: ['待AI详细分析'],
      knownConditions: [{
        id: 'cond_1',
        variable: '题目文本',
        description: '原始题目',
        value: problemText.substring(0, 100) + (problemText.length > 100 ? '...' : '')
      }],
      solveTarget: '完成题目要求的解答',
      difficulty: 'medium',
      difficultyReason: `AI分析服务暂时不可用: ${error instanceof Error ? error.message : '未知错误'}`,
      keyEquations: [],
      suggestedApproach: '建议稍后重试或检查API配置',
      estimatedSteps: 3
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建分析Agent实例
 * @param llmClient LLM客户端实例
 */
export function createAnalysisAgent(llmClient: UnifiedLLMClient): AnalysisAgent {
  return new AnalysisAgent(llmClient)
}
