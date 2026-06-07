/**
 * QualityCheck Agent - 质量检查Agent
 * 负责从三个维度评估解答质量：完备性/简洁性/完整性
 * 不通过则打回Reasoning重做（最多2轮）
 */

import type { UnifiedLLMClient } from '../llmClient.js'
import { getQualityCheckSystemPrompt } from '../../core/prompts.js'
import type { ReasoningAgentOutput } from './reasoningAgent.js'

// ==================== 类型定义 ====================

/** 质量问题项 */
export interface QualityIssue {
  category: 'completeness' | 'conciseness' | 'integrity' | 'accuracy' | 'format'
  severity: 'critical' | 'major' | 'minor'
  location: string             // 定位到哪个步骤或段落
  description: string
  fixSuggestion: string
}

/** 质检Agent输出结构 */
export interface QualityCheckOutput {
  passed: boolean
  scores: {
    completeness: number    // 完备性评分 0-100
    conciseness: number     // 简洁性评分 0-100
    integrity: number        // 完整性评分 0-100
    overall: number         // 综合评分 0-100
  }
  feedback: string             // 详细反馈（中文）
  issues: QualityIssue[]      // 具体问题列表
  suggestion: string           // 改进建议
}

// ==================== QualityCheck Agent 类 ====================

/**
 * QualityCheck Agent
 * 从三维标准对解答进行严格质量审查
 * 决定是否通过或打回重做
 */
export class QualityCheckAgent {
  private llmClient: UnifiedLLMClient

  /** 通过阈值 */
  private static readonly PASS_THRESHOLD = 80

  constructor(llmClient: UnifiedLLMClient) {
    this.llmClient = llmClient
  }

  /**
   * 执行质量检查
   * @param problemText 原始题目
   * @param reasoningResult 推理阶段的完整结果
   * @returns 质检报告
   */
  async execute(
    problemText: string,
    reasoningResult: ReasoningAgentOutput
  ): Promise<QualityCheckOutput> {
    const startTime = Date.now()
    console.log('[QualityCheckAgent] 开始质量检查...')

    try {
      const systemPrompt = getQualityCheckSystemPrompt()

      // 构建待审查的内容
      let reviewContent = `## 原始题目\n\n${problemText}\n\n`

      reviewContent += `## 解答概览\n\n`
      reviewContent += `- **最终答案**: ${reasoningResult.finalAnswer}\n`
      reviewContent += `- **方法总结**: ${reasoningResult.methodSummary}\n`
      reviewContent += `- **步骤数量**: ${reasoningResult.steps.length}\n\n`

      // 添加完整步骤
      if (reasoningResult.steps.length > 0) {
        reviewContent += `## 完整解答步骤\n\n`
        for (const step of reasoningResult.steps) {
          reviewContent += `### 步骤${step.stepNumber}: ${step.title}\n\n`
          reviewContent += `**思考**: ${step.thinking}\n\n`
          reviewContent += `**操作**: ${step.action}\n\n`
          reviewContent += `**结果**: ${step.result}\n\n`
          if (step.formula) {
            reviewContent += `**公式**: ${step.formula}\n\n`
          }
          reviewContent += `**依据**: ${step.justification}\n\n`
          reviewContent += '---\n\n'
        }
      }

      // 添加易错点
      if (reasoningResult.commonPitfalls.length > 0) {
        reviewContent += `## 易错点提示\n\n`
        for (const pitfall of reasoningResult.commonPitfalls) {
          reviewContent += `- ${pitfall}\n`
        }
        reviewContent += '\n'
      }

      const userMessage = `请对以下经济学题目解答进行全面的三维质量审查：

${reviewContent}

请按照评估体系逐项打分，给出详细的质检报告。如果综合评分低于80分，必须在suggestion字段给出具体的改进方向。`

      // 调用LLM
      const response = await this.llmClient.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.1,  // 极低温度保证评分客观性
        maxTokens: 4096
      })

      // 解析响应
      const result = this.parseResponse(response.content)

      const elapsed = Date.now() - startTime
      const status = result.passed ? '✅ 通过' : '❌ 不通过'
      console.log(`[QualityCheckAgent] 质检完成 (${elapsed}ms): ${status}`)
      console.log(`[QualityCheckAgent] 综合得分: ${result.scores.overall}/100`)

      if (!result.passed) {
        console.log(`[QualityCheckAgent] 主要问题:`)
        for (const issue of result.issues.slice(0, 3)) {
          console.log(`  - [${issue.severity.toUpperCase()}] ${issue.description}`)
        }
      }

      return result

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[QualityCheckAgent] 质检失败 (${elapsed}ms):`, error)

      // 出错时返回不通过的默认结果
      return {
        passed: false,
        scores: {
          completeness: 0,
          conciseness: 0,
          integrity: 0,
          overall: 0
        },
        feedback: `质检服务异常: ${error instanceof Error ? error.message : '未知错误'}`,
        issues: [{
          category: 'accuracy',
          severity: 'critical',
          location: '系统',
          description: '质量检查服务不可用',
          fixSuggestion: '请检查系统配置后重试'
        }],
        suggestion: '质检服务异常，建议人工审核或重试'
      }
    }
  }

  /**
   * 解析LLM响应
   */
  private parseResponse(content: string): QualityCheckOutput {
    try {
      const cleaned = this.extractJson(content)
      const parsed = JSON.parse(cleaned) as Partial<QualityCheckOutput>

      // 解析分数
      const scores: Record<string, number> = (parsed.scores || {}) as Record<string, number>
      const completeness = typeof scores.completeness === 'number' ? scores.completeness : 70
      const conciseness = typeof scores.conciseness === 'number' ? scores.conciseness : 70
      const integrity = typeof scores.integrity === 'number' ? scores.integrity : 70
      const overall = typeof scores.overall === 'number'
        ? scores.overall
        : Math.round(completeness * 0.4 + conciseness * 0.3 + integrity * 0.3)

      // 判断是否通过
      const passed = overall >= QualityCheckAgent.PASS_THRESHOLD

      // 解析问题列表
      const issues: QualityIssue[] = Array.isArray(parsed.issues)
        ? parsed.issues.map(issue => ({
            category: this.validateCategory(issue.category),
            severity: this.validateSeverity(issue.severity),
            location: issue.location || '未指定位置',
            description: issue.description || '问题描述缺失',
            fixSuggestion: issue.fixSuggestion || '无修复建议'
          }))
        : []

      return {
        passed,
        scores: {
          completeness,
          conciseness,
          integrity,
          overall
        },
        feedback: parsed.feedback || '（无详细反馈）',
        issues,
        suggestion: parsed.suggestion || (passed ? '质量合格' : '需要改进')
      }

    } catch (error) {
      console.warn('[QualityCheckAgent] JSON解析失败:', error)
      throw new Error('质检结果解析失败')
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
   * 验证问题类别
   */
  private validateCategory(category?: string): QualityIssue['category'] {
    const validCategories: QualityIssue['category'][] = [
      'completeness', 'conciseness', 'integrity', 'accuracy', 'format'
    ]
    if (category && validCategories.includes(category as QualityIssue['category'])) {
      return category as QualityIssue['category']
    }
    return 'completeness' // 默认
  }

  /**
   * 验证严重级别
   */
  private validateSeverity(severity?: string): QualityIssue['severity'] {
    const validSeverities: QualityIssue['severity'][] = ['critical', 'major', 'minor']
    if (severity && validSeverities.includes(severity as QualityIssue['severity'])) {
      return severity as QualityIssue['severity']
    }
    return 'major' // 默认
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建质检Agent实例
 * @param llmClient LLM客户端实例
 */
export function createQualityCheckAgent(llmClient: UnifiedLLMClient): QualityCheckAgent {
  return new QualityCheckAgent(llmClient)
}
