/**
 * 设置管理路由（增强版）
 * 管理系统配置、用户偏好设置和LLM API密钥配置
 */
import { Router, type Request, type Response } from 'express'
import type { Settings, LLMConfig, TestConnectionResponse } from '../types/index.js'
import { UnifiedLLMClient } from '../services/llmClient.js'
import { setOcrLLMConfig } from './ocr.js'

const router = Router()

// 默认设置
const defaultSettings: Settings = {
  defaultModel: 'gpt-4o',
  defaultTemplateId: 'preset-general',
  ocrLanguage: 'zh-CN',
  autoSaveHistory: true,
  maxHistoryItems: 50,
  latexRenderer: 'katex',
  enableQualityCheck: true,
  maxRetries: 2
}

// 当前设置（内存存储）
let currentSettings: Settings = { ...defaultSettings }

// 当前LLM配置（内存存储，生产环境应使用安全存储方案）
let currentLLMConfig: LLMConfig | null = null

/**
 * GET /api/settings - 获取当前设置
 */
router.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      ...currentSettings,
      llmConfig: currentLLMConfig ? {
        ...currentLLMConfig,
        apiKey: currentLLMConfig.apiKey ? '***configured***' : '' // 脱敏
      } : null
    }
  })
})

/**
 * PUT /api/settings - 更新设置
 */
router.put('/', (req: Request, res: Response): void => {
  const updates: Partial<Settings> = req.body

  // 合并更新
  currentSettings = {
    ...currentSettings,
    ...updates,
    maxHistoryItems: updates.maxHistoryItems ?? currentSettings.maxHistoryItems
  }

  console.log('设置已更新:', {
    ...currentSettings,
    llmConfig: currentSettings.llmConfig ? '***' : undefined
  })

  res.json({
    success: true,
    data: currentSettings,
    message: '设置更新成功'
  })
})

/**
 * POST /api/settings/llm-config - 配置LLM API密钥
 */
router.post('/llm-config', (req: Request, res: Response): void => {
  try {
    const config: LLMConfig = req.body

    // 验证必要字段
    if (!config.provider || !config.apiKey || !config.model) {
      res.status(400).json({
        success: false,
        error: '请填写完整的LLM配置（平台、API密钥、模型名称）'
      })
      return
    }

    // 验证provider值
    const validProviders = ['openai', 'anthropic', 'deepseek']
    if (!validProviders.includes(config.provider)) {
      res.status(400).json({
        success: false,
        error: `不支持的平台，可选值: ${validProviders.join(', ')}`
      })
      return
    }

    // 存储配置
    currentLLMConfig = config

    // 同步到OCR路由
    setOcrLLMConfig(config)

    console.log('LLM配置已更新:', {
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl || '默认',
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : '空'
    })

    res.json({
      success: true,
      data: {
        configured: true,
        provider: config.provider,
        model: config.model,
        message: 'LLM配置保存成功'
      }
    })
  } catch (error) {
    console.error('保存LLM配置失败:', error)
    res.status(500).json({
      success: false,
      error: '保存配置失败'
    })
  }
})

/**
 * POST /api/settings/test-connection - 测试LLM连接
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, apiKey, baseUrl, model } = req.body

    // 验证参数
    if (!provider || !apiKey || !model) {
      res.status(400).json({
        success: false,
        error: '请提供完整的测试参数'
      })
      return
    }

    // 创建临时客户端进行测试
    const testClient = new UnifiedLLMClient({
      provider,
      apiKey,
      baseUrl,
      model
    })

    // 执行连接测试
    const testResult = await testClient.testConnection()

    const response: TestConnectionResponse = {
      success: testResult.success,
      model: testResult.model,
      latency: testResult.latency,
      error: testResult.success ? undefined : '连接失败，请检查API密钥和网络'
    }

    console.log('连接测试结果:', response)

    res.json({
      success: true,
      data: response,
      message: testResult.success
        ? `连接成功! 模型: ${testResult.model}, 延迟: ${testResult.latency}ms`
        : '连接失败，请检查配置'
    })
  } catch (error) {
    console.error('连接测试异常:', error)
    res.json({
      success: false,
      data: {
        success: false,
        model: '',
        latency: 0,
        error: error instanceof Error ? error.message : '测试过程出错'
      } as TestConnectionResponse,
      error: '连接测试失败'
    })
  }
})

/**
 * DELETE /api/settings/llm-config - 删除LLM配置
 */
router.delete('/llm-config', (_req: Request, res: Response): void => {
  currentLLMConfig = null

  console.log('LLM配置已删除')

  res.json({
    success: true,
    data: {
      configured: false,
      message: 'LLM配置已删除'
    }
  })
})

/**
 * GET /api/settings/llm-config/status - 获取LLM配置状态
 */
router.get('/llm-config/status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      configured: Boolean(currentLLMConfig?.apiKey),
      provider: currentLLMConfig?.provider || null,
      model: currentLLMConfig?.model || null,
      hasApiKey: Boolean(currentLLMConfig?.apiKey)
    }
  })
})

// 导出获取当前LLM配置的函数（供其他模块使用）
export function getCurrentLLMConfig(): LLMConfig | null {
  return currentLLMConfig
}

export default router
