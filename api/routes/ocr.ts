/**
 * OCR识别接口（增强版）
 * 优先使用多模态LLM进行图片文字识别（更准确，支持公式/手写体）
 * Tesseract.js 作为兜底方案（无需API密钥）
 */
import { Router, type Request, type Response } from 'express'
import type { OcrResponse } from '../types/index.js'
import { UnifiedLLMClient } from '../services/llmClient.js'

const router = Router()

// 内存存储：LLM配置（与solve.ts保持一致的模式）
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek'
  apiKey: string
  baseUrl?: string
  model: string
}
let currentLLMConfig: LLMConfig | null = null

/** 导出配置设置函数（供settings路由调用） */
export function setOcrLLMConfig(config: LLMConfig | null): void {
  currentLLMConfig = config
}

/** 导出配置获取函数 */
export function getOcrLLMConfig(): LLMConfig | null {
  return currentLLMConfig
}

/**
 * OCR识别提示词 - 专为经济学题目优化
 */
const OCR_PROMPT = `你是一个专业的OCR文字识别助手，专门用于识别经济学教材和考试题目中的文字。

请仔细观察这张图片，完成以下任务：
1. 准确识别图片中的所有文字内容（包括中文、英文、数字、数学符号、公式）
2. 保持原文的格式结构（段落、编号、公式位置等）
3. 对于数学公式，用LaTeX格式输出（如 $x_1^*$, $\\frac{\\partial U}{\\partial x_1}$）
4. 对于无法确定的内容，用 [?] 标记

输出要求：
- 只输出识别出的文本内容，不要添加任何解释或说明
- 保持原始题目的完整性和准确性
- 数学符号和公式必须用LaTeX格式表示`

/**
 * POST /api/ocr - OCR图片识别
 *
 * 优先级：
 * 1. 已配置LLM → 使用多模态LLM视觉识别（准确率高，支持公式/手写）
 * 2. 未配置LLM → 使用Tesseract.js本地识别（无需API密钥）
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now()

  try {
    // 解析图片数据
    let imageBase64: string | undefined

    if (req.is('json')) {
      const body = req.body as { image?: string }
      imageBase64 = body.image

      if (!imageBase64) {
        res.status(400).json({
          success: false,
          error: '缺少图片数据，请提供 image 字段（base64编码）',
        })
        return
      }
    } else if (req.is('multipart')) {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined
      if (files?.image && files.image.length > 0) {
        const file = files.image[0]
        imageBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      } else {
        res.status(400).json({
          success: false,
          error: '缺少图片文件，请使用 "image" 字段名上传',
        })
        return
      }
    } else {
      res.status(400).json({
        success: false,
        error: '不支持的Content-Type，请使用 application/json 或 multipart/form-data',
      })
      return
    }

    console.log(`[OCR] 收到图片请求，数据大小: ${imageBase64.length} 字符`)
    console.log(`[OCR] LLM配置状态: ${currentLLMConfig ? `${currentLLMConfig.provider}/${currentLLMConfig.model}` : '未配置（将使用Tesseract）'}`)

    let result: { text: string; confidence: number }

    // ===== 方案1：多模态LLM视觉识别（优先） =====
    if (currentLLMConfig?.apiKey) {
      try {
        result = await recognizeWithLLM(imageBase64)
        console.log(`[OCR] LLM视觉识别完成! 置信度: ${(result.confidence * 100).toFixed(0)}%`)
      } catch (llmError) {
        console.warn(`[OCR] LLM视觉识别失败，降级到Tesseract:`, llmError)
        result = await recognizeWithTesseract(imageBase64)
      }
    }
    // ===== 方案2：Tesseract.js本地识别（兜底） =====
    else {
      result = await recognizeWithTesseract(imageBase64)
    }

    const processingTime = Date.now() - startTime
    console.log(`[OCR] 识别总耗时: ${processingTime}ms`)
    console.log(`[OCR] 识别文本预览: ${result.text.substring(0, 150)}...`)

    const response: OcrResponse = {
      success: true,
      text: result.text,
      confidence: result.confidence,
      processingTime,
    }

    res.json(response)
  } catch (error) {
    console.error('[OCR] 识别错误:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR识别服务异常',
    })
  }
})

/**
 * 使用多模态LLM进行图片文字识别
 */
async function recognizeWithLLM(imageBase64: string): Promise<{ text: string; confidence: number }> {
  if (!currentLLMConfig) {
    throw new Error('LLM未配置')
  }

  const llmClient = new UnifiedLLMClient(currentLLMConfig)

  const response = await llmClient.vision(imageBase64, OCR_PROMPT, {
    temperature: 0.1, // 低温度确保识别准确
    maxTokens: 4096,
  })

  // 清理LLM输出的文本
  const cleanedText = cleanLlmOcrOutput(response.content)

  // LLM视觉识别的置信度基于输出质量评估
  const confidence = estimateConfidence(cleanedText, response.content)

  return { text: cleanedText, confidence }
}

/**
 * 使用Tesseract.js进行本地OCR识别
 */
async function recognizeWithTesseract(imageBase64: string): Promise<{ text: string; confidence: number }> {
  // 动态导入 Tesseract（避免启动时加载大量资源）
  const Tesseract = (await import('tesseract.js')).default

  const result = await Tesseract.recognize(imageBase64, 'chi_sim+eng', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') {
        console.log(`[Tesseract] 识别进度: ${Math.round(m.progress * 100)}%`)
      }
    },
  })

  let rawText = result.data.text || ''
  const cleanedText = preprocessTesseractText(rawText)
  const confidence = Math.min(result.data.confidence / 100, 0.99)

  return { text: cleanedText, confidence }
}

/**
 * 清理LLM OCR输出
 * 去除可能的markdown包装、前后缀说明文字等
 */
function cleanLlmOcrOutput(rawText: string): string {
  let text = rawText.trim()

  // 去除可能的markdown代码块标记
  text = text.replace(/^```(?:text|plain)?\s*\n?/i, '')
  text = text.replace(/\n?```\s*$/i, '')

  // 去除常见的前缀说明
  const prefixes = [
    '以下是识别结果',
    '识别结果如下',
    '识别内容',
    '图片中的文字如下',
    '这是图片中的文字',
    'OCR Result',
    '识别到的文本',
    '文本内容',
  ]
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      text = text.substring(prefix.length).replace(/^[：:]\s*/, '')
      break
    }
  }

  // 去除常见的后缀说明
  const suffixes = [
    '以上是识别结果',
    '以上为图片中的全部文字',
    '(完)',
  ]
  for (const suffix of suffixes) {
    if (text.endsWith(suffix)) {
      text = text.substring(0, text.length - suffix.length)
      break
    }
  }

  return text.trim()
}

/**
 * 估算LLM OCR的置信度
 * 基于输出质量启发式评估
 */
function estimateConfidence(cleanedText: string, _rawText: string): number {
  // 基础置信度
  let confidence = 0.92

  // 文本太短可能识别不完整
  if (cleanedText.length < 10) {
    confidence -= 0.2
  }
  // 包含LaTeX公式通常是好事（说明模型正确识别了数学内容）
  if (/\\[a-z]+|\{.*\}/.test(cleanedText)) {
    confidence = Math.min(confidence + 0.03, 0.98)
  }
  // 包含中文和英文混合（典型经济学题目特征）
  if (/[\u4e00-\u9fff]/.test(cleanedText) && /[a-zA-Z]/.test(cleanedText)) {
    confidence = Math.min(confidence + 0.02, 0.98)
  }
  // 包含数字和变量（经济学公式特征）
  if (/\d+.*[a-zA-Z]|[a-zA-Z].*\d+/.test(cleanedText)) {
    confidence = Math.min(confidence + 0.01, 0.99)
  }
  // 有太多不确定标记
  const questionMarks = (cleanedText.match(/\[\?\]/g) || []).length
  if (questionMarks > 3) {
    confidence -= 0.05 * questionMarks
  }

  return Math.max(Math.min(confidence, 0.99), 0.5)
}

/**
 * Tesseract文本预处理
 * 清理Tesseract输出中的噪声，提取规范化的题干
 */
function preprocessTesseractText(rawText: string): string {
  let text = rawText

  // 1. 去除首尾空白
  text = text.trim()

  // 2. 将连续多个空行合并为一个换行
  text = text.replace(/\n{3,}/g, '\n\n')

  // 3. 修复常见的OCR错误模式
  text = text.replace(/([\u4e00-\u9fff])\s+(?=[a-zA-Z0-9])/g, '$1 ')
  text = text.replace(/([a-zA-Z0-9])\s+(?=[\u4e00-\u9fff])/g, '$1 ')

  // 4. 修复数学符号常见误识
  text = text.replace(/(?<![a-zA-Z])X(?![a-zA-Z])/g, '\u00d7')
  text = text.replace(/(?<=\d)x(?=\d)/g, '\u00d7')
  text = text.replace(/(?<![\d(])0(?=\d{2})/g, 'O')

  // 5. 清理孤立行
  text = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 || true)
    .join('\n')

  // 6. 最终清理
  text = text.replace(/[^\S\n]+/g, ' ')
  text = text.trim()

  return text
}

export default router
