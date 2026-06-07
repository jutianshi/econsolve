/**
 * OCR Agent - 多模态视觉理解Agent
 * 负责从图片中提取题目文本，保留公式和结构
 */

import type { UnifiedLLMClient } from '../llmClient.js'
import { getOcrSystemPrompt } from '../../core/prompts.js'
import type { ChatMessage } from '../llmClient.js'

// ==================== 类型定义 ====================

/** OCR Agent输出结构 */
export interface OcrAgentOutput {
  extractedText: string       // 提取的题目原文
  confidence: number          // 置信度 (0-1)
  hasFormula: boolean         // 是否包含数学公式
  language: 'zh' | 'en' | 'mixed'
  preprocessingNotes: string  // 预处理说明
}

// ==================== OCR Agent 类 ====================

/**
 * OCR Agent
 * 使用多模态LLM的视觉能力从图片中提取题目内容
 */
export class OcrAgent {
  private llmClient: UnifiedLLMClient

  constructor(llmClient: UnifiedLLMClient) {
    this.llmClient = llmClient
  }

  /**
   * 执行OCR识别
   * @param imageBase64 base64编码的图片数据
   * @returns 结构化的OCR识别结果
   */
  async execute(imageBase64: string): Promise<OcrAgentOutput> {
    const startTime = Date.now()
    console.log('[OcrAgent] 开始执行OCR识别...')

    try {
      // 构建用户提示词
      const userPrompt = `请仔细识别这张经济学考研题目图片，提取其中的所有文字内容、数学公式和题目结构。
特别注意：
1. 完整提取所有文字（包括题干、选项、小问等）
2. 数学公式尽量转换为LaTeX格式
3. 标注题目类型（选择题/计算题/证明题等）
4. 如果有多个小问，请分别标注`

      // 调用多模态API
      const systemPrompt = getOcrSystemPrompt()
      const response = await this.llmClient.vision(
        imageBase64,
        userPrompt,
        { temperature: 0.1, maxTokens: 2048 }
      )

      // 解析JSON响应
      const result = this.parseResponse(response.content)

      const elapsed = Date.now() - startTime
      console.log(`[OcrAgent] OCR识别完成 (${elapsed}ms)，置信度: ${result.confidence}`)

      return result

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[OcrAgent] OCR识别失败 (${elapsed}ms):`, error)

      // 返回错误状态的结果
      return {
        extractedText: '',
        confidence: 0,
        hasFormula: false,
        language: 'zh',
        preprocessingNotes: `OCR识别失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 解析LLM返回的JSON响应
   * @param content 原始响应内容
   * @returns 结构化的OCR结果
   */
  private parseResponse(content: string): OcrAgentOutput {
    try {
      // 尝试直接解析JSON
      const cleaned = this.extractJson(content)
      const parsed = JSON.parse(cleaned) as OcrAgentOutput

      // 验证必要字段
      return {
        extractedText: parsed.extractedText || '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        hasFormula: Boolean(parsed.hasFormula),
        language: ['zh', 'en', 'mixed'].includes(parsed.language) ? parsed.language : 'zh',
        preprocessingNotes: parsed.preprocessingNotes || ''
      }

    } catch (error) {
      console.warn('[OcrAgent] JSON解析失败，使用原始文本:', error)

      // JSON解析失败时，将原始文本作为extractedText
      return {
        extractedText: content,
        confidence: 0.6, // 较低置信度
        hasFormula: this.containsFormula(content),
        language: this.detectLanguage(content),
        preprocessingNotes: 'JSON解析失败，使用原始文本输出'
      }
    }
  }

  /**
   * 从响应中提取JSON部分
   * 处理可能的markdown代码块包裹
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
   * 检测文本是否包含数学公式特征
   */
  private containsFormula(text: string): boolean {
    const formulaPatterns = [
      /\\frac\{/,
      /\\sum\{/,
      /\\int\{/,
      /[a-z]\^[0-9]/i,     // 上标
      /_[a-z0-9]/i,         // 下标
      /∫|∑|∏|∂|∇/,          // 数学符号
      /\$\$?[\s\S]*?\$\$?/  // LaTeX模式
    ]

    return formulaPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 检测语言类型
   */
  private detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
    const englishChars = text.match(/[a-zA-Z]/g) || []

    if (chineseChars.length > 0 && englishChars.length > 0) {
      return 'mixed'
    } else if (chineseChars.length > 0) {
      return 'zh'
    } else {
      return 'en'
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建OCR Agent实例
 * @param llmClient LLM客户端实例
 */
export function createOcrAgent(llmClient: UnifiedLLMClient): OcrAgent {
  return new OcrAgent(llmClient)
}
