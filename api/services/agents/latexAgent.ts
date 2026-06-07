/**
 * LaTeX Agent - LaTeX代码生成Agent
 * 负责根据模板和解答内容生成符合规范的LaTeX代码
 */

import type { UnifiedLLMClient } from '../llmClient.js'
import { getLatexSystemPrompt } from '../../core/prompts.js'
import type { ReasoningAgentOutput } from './reasoningAgent.js'

// ==================== 类型定义 ====================

/** LaTeX Agent输出结构 */
export interface LatexAgentOutput {
  code: string                    // 可编译的LaTeX正文代码
  usedEnvironments: string[]       // 使用的环境列表
  packageRequirements: string[]    // 需要的宏包
  compilationNote: string          // 编译注意事项
}

// ==================== LaTeX Agent 类 ====================

/**
 * LaTeX Agent
 * 将解答内容转换为高质量的LaTeX代码
 * 确保代码可编译且符合学术规范
 */
export class LatexAgent {
  private llmClient: UnifiedLLMClient

  constructor(llmClient: UnifiedLLMClient) {
    this.llmClient = llmClient
  }

  /**
   * 生成LaTeX代码
   * @param problemText 原始题目
   * @param reasoningResult 推理阶段的完整结果
   * @param templateContent LaTeX模板内容
   * @returns 结构化的LaTeX输出
   */
  async execute(
    problemText: string,
    reasoningResult: ReasoningAgentOutput,
    templateContent: string
  ): Promise<LatexAgentOutput> {
    const startTime = Date.now()
    console.log('[LatexAgent] 开始生成LaTeX代码...')

    try {
      // 获取带模板的System Prompt
      const systemPrompt = getLatexSystemPrompt(templateContent)

      // 构建包含完整解答内容的用户消息
      let solutionSummary = ''

      // 添加解题步骤
      if (reasoningResult.steps.length > 0) {
        solutionSummary += '\n## 详细解答步骤\n\n'
        for (const step of reasoningResult.steps) {
          solutionSummary += `### 步骤${step.stepNumber}: ${step.title}\n\n`
          if (step.thinking) {
            solutionSummary += `**思考**: ${step.thinking}\n\n`
          }
          solutionSummary += `**操作**: ${step.action}\n\n`
          solutionSummary += `**结果**: ${step.result}\n\n`
          if (step.justification) {
            solutionSummary += `**依据**: ${step.justification}\n\n`
          }
          if (step.formula) {
            solutionSummary += `**公式**: ${step.formula}\n\n`
          }
          solutionSummary += '---\n\n'
        }
      }

      // 添加最终答案
      solutionSummary += `\n## 最终答案\n\n${reasoningResult.finalAnswer}\n\n`

      // 添加方法总结
      if (reasoningResult.methodSummary) {
        solutionSummary += `\n## 方法总结\n\n${reasoningResult.methodSummary}\n\n`
      }

      // 添加易错点
      if (reasoningResult.commonPitfalls.length > 0) {
        solutionSummary += `\n## 易错点提示\n\n`
        for (const pitfall of reasoningResult.commonPitfalls) {
          solutionSummary += `- ${pitfall}\n`
        }
        solutionSummary += '\n'
      }

      const userMessage = `请根据以下题目和解答内容，生成符合模板格式的LaTeX正文代码：

## 原始题目
${problemText}

## 解答内容
${solutionSummary}

请严格按照模板结构和排版规范，生成可直接嵌入模板正文的LaTeX代码。只返回JSON格式结果。`

      // 调用LLM
      const response = await this.llmClient.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.15,  // 极低温度保证LaTeX语法正确性
        maxTokens: 6144
      })

      // 解析响应
      const result = this.parseResponse(response.content)

      const elapsed = Date.now() - startTime
      console.log(`[LatexAgent] LaTeX生成完成 (${elapsed}ms)`)
      console.log(`[LatexAgent] 使用环境: ${result.usedEnvironments.join(', ')}`)

      return result

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[LatexAgent] LaTeX生成失败 (${elapsed}ms):`, error)

      // 返回降级的LaTeX代码
      return this.getFallbackLatex(problemText, reasoningResult, templateContent)
    }
  }

  /**
   * 解析LLM响应
   */
  private parseResponse(content: string): LatexAgentOutput {
    try {
      const cleaned = this.extractJson(content)
      const parsed = JSON.parse(cleaned) as Partial<LatexAgentOutput>

      return {
        code: parsed.code || '',
        usedEnvironments: Array.isArray(parsed.usedEnvironments) ? parsed.usedEnvironments : [],
        packageRequirements: Array.isArray(parsed.packageRequirements) ? parsed.packageRequirements : [],
        compilationNote: parsed.compilationNote || '建议使用XeLaTeX编译以支持中文'
      }

    } catch (error) {
      console.warn('[LatexAgent] JSON解析失败:', error)
      throw new Error('LaTeX代码解析失败')
    }
  }

  /**
   * 提取JSON内容
   */
  private extractJson(content: string): string {
    const jsonCodeBlockMatch = content.match(/```(?:json|latex)?\s*([\s\S]*?)```/)
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
   * 降级LaTeX代码（当LLM调用失败时）
   * 生成一个基础的LaTeX框架
   */
  private getFallbackLatex(
    problemText: string,
    reasoningResult: ReasoningAgentOutput,
    _templateContent: string
  ): LatexAgentOutput {
    console.warn('[LatexAgent] 使用降级LaTeX生成')

    // 构建基础LaTeX代码
    let latexCode = '\\section{题目}\n\n'
    latexCode += `${problemText}\n\n`

    latexCode += '\\section{详细解答}\n\n'

    // 添加步骤
    for (const step of reasoningResult.steps) {
      latexCode += `\\subsection{步骤${step.stepNumber}: ${step.title}}\n\n`
      if (step.action) {
        latexCode += `${step.action}\n\n`
      }
      if (step.result) {
        latexCode += `${step.result}\n\n`
      }
      if (step.formula) {
        latexCode += `\\begin{equation}\n${step.formula}\n\\end{equation}\n\n`
      }
    }

    latexCode += '\\section{最终答案}\n\n'
    latexCode += `\\begin{center}\n`
    latexCode += `\\fbox{${reasoningResult.finalAnswer}}\n`
    latexCode += `\\end{center}\n\n`

    if (reasoningResult.methodSummary) {
      latexCode += '\\section{方法总结}\n\n'
      latexCode += `${reasoningResult.methodSummary}\n\n`
    }

    return {
      code: latexCode,
      usedEnvironments: ['equation'],
      packageRequirements: ['amsmath', 'ctex'],
      compilationNote: '降级生成的LaTeX代码，建议人工审核后编译'
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建LaTeX Agent实例
 * @param llmClient LLM客户端实例
 */
export function createLatexAgent(llmClient: UnifiedLLMClient): LatexAgent {
  return new LatexAgent(llmClient)
}
