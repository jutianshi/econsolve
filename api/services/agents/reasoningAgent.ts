/**
 * Reasoning Agent - 推理Agent（核心Agent）
 * 负责深度思考和推理解答，生成详细的解题过程
 * 必须启用深度思考模式 + 三性约束（完备性/简洁性/完整性）
 */

import type { UnifiedLLMClient } from '../llmClient.js'
import { getReasoningSystemPrompt } from '../../core/prompts.js'
import type { AnalysisAgentOutput } from './analysisAgent.js'

// ==================== 类型定义 ====================

/** 解题步骤结构 */
export interface SolutionStep {
  stepNumber: number
  title: string
  thinking: string               // 该步的思考过程
  action: string                 // 执行的操作/推导
  result: string                 // 该步的结果/中间结论
  formula?: string               // 该步涉及的LaTeX公式
  justification: string          // 为什么这一步是合理的
}

/** 备选解法 */
export interface AlternativeSolution {
  name: string
  reason: string
  briefContent: string
}

/** 推理Agent输出结构 */
export interface ReasoningAgentOutput {
  reasoningProcess: string       // 完整思考链（markdown）
  steps: SolutionStep[]
  finalAnswer: string            // 最终答案
  methodSummary: string          // 方法总结
  alternativeSolution?: AlternativeSolution  // 备选解法
  commonPitfalls: string[]       // 易错点
  needsRefinement: boolean       // 是否需要改进
  qualityFeedback?: string       // 来自QualityCheck的反馈
}

// ==================== Reasoning Agent 类 ====================

/**
 * Reasoning Agent
 * 多Agent系统的核心推理引擎
 * 启用深度思考模式，遵循三性约束
 */
export class ReasoningAgent {
  private llmClient: UnifiedLLMClient

  constructor(llmClient: UnifiedLLMClient) {
    this.llmClient = llmClient
  }

  /**
   * 执行推理解答
   * @param problemText 题目文本
   * @param analysis 分析阶段的结果
   * @param feedback 可选的质量反馈（用于重做时改进）
   * @returns 结构化的解答结果
   */
  async execute(
    problemText: string,
    analysis: AnalysisAgentOutput,
    feedback?: string
  ): Promise<ReasoningAgentOutput> {
    const startTime = Date.now()
    const isRetry = Boolean(feedback)
    console.log(`[ReasoningAgent] 开始${isRetry ? '(重做)' : ''}深度推理...`)

    try {
      const systemPrompt = getReasoningSystemPrompt()

      // 构建包含上下文的用户消息
      let contextSection = ''

      // 添加分析结果上下文
      contextSection += `\n## 题目分析结果\n`
      contextSection += `- **题型**: ${analysis.problemType}\n`
      contextSection += `- **难度**: ${analysis.difficulty}\n`
      contextSection += `- **知识点**: ${analysis.knowledgePoints.join(' → ')}\n`
      contextSection += `- **求解目标**: ${analysis.solveTarget}\n`
      contextSection += `- **建议思路**: ${analysis.suggestedApproach}\n`

      if (analysis.knownConditions.length > 0) {
        contextSection += `\n### 已知条件\n`
        for (const cond of analysis.knownConditions) {
          contextSection += `- ${cond.variable}: ${cond.description}`
          if (cond.value) contextSection += ` = ${cond.value}${cond.unit || ''}`
          contextSection += '\n'
        }
      }

      if (analysis.keyEquations.length > 0) {
        contextSection += `\n### 可能涉及的方程\n`
        for (const eq of analysis.keyEquations) {
          contextSection += `- ${eq}\n`
        }
      }

      // 添加质量反馈（如果是重做）
      if (feedback) {
        contextSection += `\n## ⚠️ 上次质检反馈（必须针对以下问题改进）\n${feedback}\n`
        contextSection += `**请务必在本次解答中解决上述问题！**\n`
      }

      const userMessage = `请基于以下分析结果，对题目进行完整的深度推理解答：

## 原始题目
${problemText}

${contextSection}

请启用深度思考模式，严格遵循三性约束（完备性/简洁性/完整性），输出完整的JSON格式解答。`

      // 调用LLM - 最高级别的深度思考
      const response = await this.llmClient.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.2,  // 低温度保证推理严谨性
        maxTokens: 8192,   // 推理需要更多token
        reasoningEffort: 'high'  // 最高级别深度思考
      })

      // 解析响应
      const result = this.parseResponse(response.content)

      const elapsed = Date.now() - startTime
      console.log(`[ReasoningAgent] 推理完成 (${elapsed}ms), 步骤数: ${result.steps.length}`)
      console.log(`[ReasoningAgent] 最终答案: ${result.finalAnswer.substring(0, 50)}...`)

      return result

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[ReasoningAgent] 推理失败 (${elapsed}ms):`, error)

      // 返回降级结果
      return this.getFallbackResult(problemText, analysis, error)
    }
  }

  /**
   * 解析LLM响应
   */
  private parseResponse(content: string): ReasoningAgentOutput {
    try {
      const cleaned = this.extractJson(content)
      const parsed = JSON.parse(cleaned) as Partial<ReasoningAgentOutput>

      // 解析步骤数组
      const steps: SolutionStep[] = Array.isArray(parsed.steps)
        ? parsed.steps.map((step, index) => ({
            stepNumber: typeof step.stepNumber === 'number' ? step.stepNumber : index + 1,
            title: step.title || `步骤${index + 1}`,
            thinking: step.thinking || '',
            action: step.action || '',
            result: step.result || '',
            formula: step.formula,
            justification: step.justification || ''
          }))
        : []

      return {
        reasoningProcess: parsed.reasoningProcess || '',
        steps,
        finalAnswer: parsed.finalAnswer || '（未能生成答案）',
        methodSummary: parsed.methodSummary || '',
        alternativeSolution: parsed.alternativeSolution,
        commonPitfalls: Array.isArray(parsed.commonPitfalls) ? parsed.commonPitfalls : [],
        needsRefinement: false,
        qualityFeedback: undefined
      }

    } catch (error) {
      console.warn('[ReasoningAgent] JSON解析失败:', error)
      throw new Error('推理结果解析失败')
    }
  }

  /**
   * 提取JSON内容
   */
  private extractJson(content: string): string {
    // 尝试提取 ```json ... ``` 代码块
    const jsonCodeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonCodeBlockMatch) {
      return jsonCodeBlockMatch[1].trim()
    }

    // 尝试找到最外层的 { ... }
    const braceMatch = content.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      return braceMatch[0]
    }

    return content.trim()
  }

  /**
   * 降级结果（当LLM调用失败时）
   */
  private getFallbackResult(
    problemText: string,
    analysis: AnalysisAgentOutput,
    error: unknown
  ): ReasoningAgentOutput {
    console.warn('[ReasoningAgent] 使用降级推理结果')

    return {
      reasoningProcess: `# 思考过程\n\n由于AI推理服务暂时不可用，无法提供深度思考链。\n错误信息: ${error instanceof Error ? error.message : '未知错误'}`,
      steps: [
        {
          stepNumber: 1,
          title: '等待AI服务恢复',
          thinking: '检测到AI服务不可用',
          action: '提示用户检查配置',
          result: '请稍后重试',
          justification: '系统维护中'
        }
      ],
      finalAnswer: '（AI推理服务暂时不可用，请检查API配置后重试）',
      methodSummary: '系统当前处于降级模式',
      commonPitfalls: [
        'API密钥可能未配置或已过期',
        '网络连接可能存在问题',
        '模型服务可能暂时不可用'
      ],
      needsRefinement: true,
      qualityFeedback: '需要重新运行以获得完整解答'
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建推理Agent实例
 * @param llmClient LLM客户端实例
 */
export function createReasoningAgent(llmClient: UnifiedLLMClient): ReasoningAgent {
  return new ReasoningAgent(llmClient)
}
