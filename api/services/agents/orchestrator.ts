/**
 * Orchestrator Agent - 编排器Agent（核心协调器）
 * 负责协调整个多Agent管道的执行流程
 * 实现阶段管理、错误处理、重试机制
 */

import type { UnifiedLLMClient, LLMProviderConfig } from '../llmClient.js'
import { UnifiedLLMClient as ULLMClientImpl } from '../llmClient.js'
import { getOrchestratorSummaryPrompt } from '../../core/prompts.js'
import { createOcrAgent, type OcrAgentOutput } from './ocrAgent.js'
import { createAnalysisAgent, type AnalysisAgentOutput } from './analysisAgent.js'
import { createReasoningAgent, type ReasoningAgentOutput } from './reasoningAgent.js'
import { createLatexAgent, type LatexAgentOutput } from './latexAgent.js'
import { createQualityCheckAgent, type QualityCheckOutput } from './qualityCheckAgent.js'

// ==================== 类型定义 ====================

/** 输入类型 */
export type InputType = 'image' | 'text'

/** 管道上下文 - 在各Agent间传递的结构化消息 */
export interface PipelineContext {
  taskId: string
  originalInput: string           // 原始输入（图片base64或文本）
  inputType: InputType
  templateId?: string
  templateContent?: string        // LaTeX模板内容

  // 各阶段结果（Agent间传递的结构化消息）
  ocrResult?: OcrAgentOutput
  analysisResult?: AnalysisAgentOutput
  reasoningResult?: ReasoningAgentOutput
  latexResult?: LatexAgentOutput
  qualityResult?: QualityCheckOutput

  // 执行元数据
  startTime: number
  currentStage: string
  retryCount: number
  errors: Array<{ stage: string; error: string; timestamp: number }>
}

/** 编排器配置选项 */
export interface OrchestratorOptions {
  maxRetries?: number             // 最大重试次数（默认2）
  enableQualityCheck?: boolean    // 是否启用质检（默认true）
  timeout?: number                // 单次管道超时时间ms（默认600000=10分钟）
}

// ==================== Orchestrator Agent 类 ====================

/**
 * Orchestrator Agent
 * 多Agent协作系统的核心编排器
 * 管理完整的管道执行流程：
 *
 * 用户输入 → OCR → 分析 → 推理 → LaTeX → 质检 → 输出
 *                    ↑_______________________|
 *                    （质检不通过时打回重做）
 */
export class OrchestratorAgent {
  private llmClient: UnifiedLLMClient
  private options: Required<OrchestratorOptions>

  /** 最大重试次数 */
  private static readonly DEFAULT_MAX_RETRIES = 2

  /** 单次管道超时时间（10分钟） */
  private static readonly DEFAULT_TIMEOUT = 600_000

  constructor(llmClient: UnifiedLLMClient, options: OrchestratorOptions = {}) {
    this.llmClient = llmClient
    this.options = {
      maxRetries: options.maxRetries ?? OrchestratorAgent.DEFAULT_MAX_RETRIES,
      enableQualityCheck: options.enableQualityCheck ?? true,
      timeout: options.timeout ?? OrchestratorAgent.DEFAULT_TIMEOUT
    }
  }

  /**
   * 执行完整的管道流程
   * @param context 管道上下文
   * @returns 完成后的管道上下文
   */
  async execute(context: PipelineContext): Promise<PipelineContext> {
    const pipelineStartTime = Date.now()
    console.log(`\n${'='.repeat(60)}`)
    console.log(`[Orchestrator] 🚀 开始执行管道 | TaskID: ${context.taskId}`)
    console.log(`${'='.repeat(60)}\n`)

    try {
      // 设置超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`管道执行超时 (${this.options.timeout / 1000}秒)`))
        }, this.options.timeout)
      })

      // 执行管道（带超时）
      const result = await Promise.race([
        this.executePipeline(context),
        timeoutPromise
      ])

      const totalElapsed = Date.now() - pipelineStartTime
      console.log(`\n${'='.repeat(60)}`)
      console.log(`[Orchestrator] ✅ 管道执行完成 | 总耗时: ${(totalElapsed / 1000).toFixed(1)}s`)
      console.log(`[Orchestrator] 重试次数: ${context.retryCount}`)
      console.log(`[Orchestrator] 质检结果: ${context.qualityResult?.passed ? '通过' : '未通过'}`)
      console.log(`${'='.repeat(60)}\n`)

      return result

    } catch (error) {
      const totalElapsed = Date.now() - pipelineStartTime
      console.error(`\n[Orchestrator] ❌ 管道执行失败 (${(totalElapsed / 1000).toFixed(1)}s):`, error)

      // 记录错误
      context.errors.push({
        stage: 'pipeline',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: Date.now()
      })

      return context
    }
  }

  /**
   * 内部管道执行逻辑
   */
  private async executePipeline(context: PipelineContext): Promise<PipelineContext> {
    // ==================== 阶段1：OCR识别 ====================
    if (context.inputType === 'image') {
      context.currentStage = 'ocr'
      console.log('[Orchestrator] ▶ 阶段1/5: OCR识别...')

      try {
        const ocrAgent = createOcrAgent(this.llmClient)
        context.ocrResult = await ocrAgent.execute(context.originalInput)

        if (!context.ocrResult.extractedText) {
          throw new Error('OCR未能提取到有效文本')
        }

        // 用OCR结果更新原始输入，供后续Agent使用
        context.originalInput = context.ocrResult.extractedText

        console.log(`[Orchestrator] ✅ OCR完成 | 置信度: ${context.ocrResult.confidence}`)

      } catch (error) {
        console.error('[Orchestrator] ❌ OCR失败:', error)
        context.errors.push({
          stage: 'ocr',
          error: error instanceof Error ? error.message : 'OCR处理失败',
          timestamp: Date.now()
        })
        throw new Error(`OCR识别失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    // ==================== 阶段2：深度分析 ====================
    context.currentStage = 'analysis'
    console.log('[Orchestrator] ▶ 阶段2/5: 深度分析...')

    try {
      const analysisAgent = createAnalysisAgent(this.llmClient)
      context.analysisResult = await analysisAgent.execute(context.originalInput)

      console.log(`[Orchestrator] ✅ 分析完成 | 题型: ${context.analysisResult.problemType}, 难度: ${context.analysisResult.difficulty}`)

    } catch (error) {
      console.error('[Orchestrator] ❌ 分析失败:', error)
      context.errors.push({
        stage: 'analysis',
        error: error instanceof Error ? error.message : '分析处理失败',
        timestamp: Date.now()
      })
      // 分析失败不阻断流程，使用降级结果继续
    }

    // ==================== 阶段3-5：推理+LaTeX+质检循环 ====================
    let retryCount = 0
    let maxRetries = this.options.maxRetries

    do {
      console.log(`\n[Orchestrator] 🔄 推理循环 #${retryCount + 1}/${maxRetries + 1}`)

      // ---- 阶段3：深度推理 ----
      context.currentStage = 'reasoning'
      console.log('[Orchestrator] ▶ 阶段3/5: 深度推理...')

      try {
        const reasoningAgent = createReasoningAgent(this.llmClient)
        context.reasoningResult = await reasoningAgent.execute(
          context.originalInput,
          context.analysisResult!, // 断言非空，因为即使降级也会有值
          context.reasoningResult?.qualityFeedback // 传入上次质检反馈用于改进
        )

        console.log(`[Orchestrator] ✅ 推理完成 | 步骤数: ${context.reasoningResult.steps.length}`)

      } catch (error) {
        console.error('[Orchestrator] ❌ 推理失败:', error)
        context.errors.push({
          stage: 'reasoning',
          error: error instanceof Error ? error.message : '推理处理失败',
          timestamp: Date.now()
        })
        break // 推理失败无法继续
      }

      // ---- 阶段4：LaTeX生成 ----
      context.currentStage = 'latex'
      console.log('[Orchestrator] ▶ 阶段4/5: LaTeX生成...')

      try {
        const latexAgent = createLatexAgent(this.llmClient)
        context.latexResult = await latexAgent.execute(
          context.originalInput,
          context.reasoningResult,
          context.templateContent || this.getDefaultTemplate()
        )

        console.log(`[Orchestrator] ✅ LaTeX完成 | 环境: ${context.latexResult.usedEnvironments.join(', ')}`)

      } catch (error) {
        console.error('[Orchestrator] ❌ LaTeX生成失败:', error)
        context.errors.push({
          stage: 'latex',
          error: error instanceof Error ? error.message : 'LaTeX生成失败',
          timestamp: Date.now()
        })
        // LaTeX失败不阻断流程
      }

      // ---- 阶段5：质量检查 ----
      if (this.options.enableQualityCheck && context.reasoningResult) {
        context.currentStage = 'quality_check'
        console.log('[Orchestrator] ▶ 阶段5/5: 质量检查...')

        try {
          const qualityCheckAgent = createQualityCheckAgent(this.llmClient)
          context.qualityResult = await qualityCheckAgent.execute(
            context.originalInput,
            context.reasoningResult
          )

          if (context.qualityResult.passed) {
            console.log(`[Orchestrator] ✅ 质检通过! 得分: ${context.qualityResult.scores.overall}/100`)
            break // 质检通过，退出循环
          } else {
            console.log(`[Orchestrator] ⚠️ 质检未通过 (${context.qualityResult.scores.overall}/100)`)

            if (retryCount < maxRetries) {
              // 将质检反馈传递给推理Agent用于改进
              context.reasoningResult.qualityFeedback = context.qualityResult.suggestion
              context.reasoningResult.needsRefinement = true
              retryCount++
              context.retryCount = retryCount
              console.log(`[Orchestrator] 🔁 打回推理Agent重做 (剩余${maxRetries - retryCount + 1}次)`)
              continue
            } else {
              console.log('[Orchestrator] ⚠️ 已达最大重试次数，使用当前结果')
              break
            }
          }

        } catch (error) {
          console.error('[Orchestrator] ❌ 质检失败:', error)
          context.errors.push({
            stage: 'quality_check',
            error: error instanceof Error ? error.message : '质检处理失败',
            timestamp: Date.now()
          })
          // 质检失败默认通过
          break
        }
      } else {
        break // 未启用质检或无推理结果
      }
    } while (retryCount <= maxRetries)

    return context
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplate(): string {
    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\geometry{left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm}

\\title{经济学考研题目解析}
\\author{AI助教}
\\date{\\today}

\\begin{document}

\\maketitle

% 正文内容将在这里生成

\\end{document}`
  }

  // ==================== 工厂方法 ====================

  /**
   * 创建管道上下文
   * @param taskId 任务ID
   * @param input 原始输入
   * @param inputType 输入类型
   * @param templateContent 模板内容（可选）
   * @returns 初始化的管道上下文
   */
  static createContext(
    taskId: string,
    input: string,
    inputType: InputType,
    templateId?: string,
    templateContent?: string
  ): PipelineContext {
    return {
      taskId,
      originalInput: input,
      inputType,
      templateId,
      templateContent,
      startTime: Date.now(),
      currentStage: 'initialized',
      retryCount: 0,
      errors: []
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建编排器实例
 * @param config LLM平台配置
 * @param options 编排器选项
 */
export function createOrchestrator(
  config: LLMProviderConfig,
  options?: OrchestratorOptions
): OrchestratorAgent {
  // 初始化LLM客户端并创建编排器实例
  const llmClient = new ULLMClientImpl(config)
  return new OrchestratorAgent(llmClient, options)
}

/**
 * 同步版本工厂函数（需要预先创建好的LLM客户端）
 * @param llmClient 已创建的LLM客户端
 * @param options 编排器选项
 */
export function createOrchestratorWithClient(
  llmClient: UnifiedLLMClient,
  options?: OrchestratorOptions
): OrchestratorAgent {
  return new OrchestratorAgent(llmClient, options)
}
