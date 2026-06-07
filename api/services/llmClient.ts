/**
 * 统一LLM调用客户端
 * 支持OpenAI、Anthropic、DeepSeek三大平台
 * 提供统一的文本对话和多模态视觉能力
 */

// ==================== 类型定义 ====================

/** 支持的LLM平台 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek'

/** LLM平台配置 */
export interface LLMProviderConfig {
  provider: LLMProvider
  apiKey: string
  baseUrl?: string // 自定义API地址（支持代理）
  model: string // 具体模型名
}

/** 统一消息格式 - 文本部分 */
export interface TextContent {
  type: 'text'
  text: string
}

/** 统一消息格式 - 图片部分（OpenAI格式） */
export interface ImageUrlContent {
  type: 'image_url'
  image_url: {
    url: string // base64或URL
  }
}

/** Anthropic图片内容格式 */
export interface AnthropicImageContent {
  type: 'image'
  source: {
    type: 'base64'
    media_type: string
    data: string
  }
}

/** 聊天消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<TextContent | ImageUrlContent | AnthropicImageContent>
}

/** LLM调用选项 */
export interface LLMOptions {
  temperature?: number // 推理题用0.1-0.3，创意题用0.5-0.7
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high' // o3/o4专用
}

/** LLM响应 */
export interface LLMResponse {
  content: string
  reasoning?: string // 深度思考内容（如果模型返回）
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/** 流式响应生成器类型 */
export type StreamGenerator = AsyncGenerator<string>

// ==================== 常量定义 ====================

/** 默认超时时间（毫秒） */
const DEFAULT_TIMEOUT = 120_000 // 120秒

/** 各平台默认API地址 */
const DEFAULT_BASE_URLS: Record<LLMProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1'
}

// ==================== UnifiedLLMClient 类 ====================

/**
 * 统一LLM客户端
 * 封装了OpenAI、Anthropic、DeepSeek三大平台的API调用
 * 提供统一的接口和错误处理机制
 */
export class UnifiedLLMClient {
  private config: LLMProviderConfig

  constructor(config: LLMProviderConfig) {
    this.config = config
  }

  /**
   * 获取API基础地址
   */
  private getBaseUrl(): string {
    return this.config.baseUrl || DEFAULT_BASE_URLS[this.config.provider]
  }

  /**
   * 文本对话
   * @param messages 对话消息列表
   * @param options 调用选项
   * @returns LLM响应
   */
  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const startTime = Date.now()

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(messages, options)
        case 'anthropic':
          return await this.callAnthropic(messages, options)
        case 'deepseek':
          return await this.callDeepSeek(messages, options)
        default:
          throw new Error(`不支持的LLM平台: ${this.config.provider}`)
      }
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[LLMClient] 调用失败 (${elapsed}ms):`, error)
      throw error
    }
  }

  /**
   * 多模态对话（图片+文本）- 用于OCR Agent
   * @param imageBase64 base64编码的图片
   * @param prompt 用户提示词
   * @param options 调用选项
   * @returns LLM响应
   */
  async vision(imageBase64: string, prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    const startTime = Date.now()

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAIVision(imageBase64, prompt, options)
        case 'anthropic':
          return await this.callAnthropicVision(imageBase64, prompt, options)
        case 'deepseek':
          return await this.callDeepSeekVision(imageBase64, prompt, options)
        default:
          throw new Error(`不支持的LLM平台: ${this.config.provider}`)
      }
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[LLMClient] Vision调用失败 (${elapsed}ms):`, error)
      throw error
    }
  }

  /**
   * 流式输出（用于实时展示）
   * @param messages 对话消息列表
   * @param options 调用选项
   * @returns 异步字符串生成器
   */
  async *chatStream(messages: ChatMessage[], options: LLMOptions = {}): StreamGenerator {
    switch (this.config.provider) {
      case 'openai':
        yield* this.streamOpenAI(messages, options)
        break
      case 'anthropic':
        yield* this.streamAnthropic(messages, options)
        break
      case 'deepseek':
        yield* this.streamDeepSeek(messages, options)
        break
      default:
        throw new Error(`不支持的LLM平台: ${this.config.provider}`)
    }
  }

  // ==================== OpenAI 实现 ====================

  /**
   * OpenAI文本对话实现
   */
  private async callOpenAI(messages: ChatMessage[], options: LLMOptions): Promise<LLMResponse> {
    const url = `${this.getBaseUrl()}/chat/completions`

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096
    }

    // o3系列支持reasoning_effort参数
    if (options.reasoningEffort && (this.config.model.includes('o3') || this.config.model.includes('o4'))) {
      body.reasoning_effort = options.reasoningEffort
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API错误 [${response.status}]: ${errorText}`)
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string
          reasoning_content?: string // 某些模型可能返回
        }
      }>
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
      model: string
    }

    const choice = data.choices[0]
    return {
      content: choice.message.content,
      reasoning: choice.message.reasoning_content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    }
  }

  /**
   * OpenAI多模态对话实现
   */
  private async callOpenAIVision(imageBase64: string, prompt: string, options: LLMOptions): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: imageBase64.startsWith('data:')
              ? imageBase64
              : `data:image/png;base64,${imageBase64}`
          }
        }
      ]
    }]

    return this.callOpenAI(messages, options)
  }

  /**
   * OpenAI流式输出实现
   */
  private async *streamOpenAI(messages: ChatMessage[], options: LLMOptions): StreamGenerator {
    const url = `${this.getBaseUrl()}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
        stream: true
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI流式API错误 [${response.status}]: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6))
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }

  // ==================== Anthropic 实现 ====================

  /**
   * Anthropic文本对话实现
   */
  private async callAnthropic(messages: ChatMessage[], options: LLMOptions): Promise<LLMResponse> {
    const url = `${this.getBaseUrl()}/messages`

    // 转换消息格式为Anthropic格式
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : m.content
    }))

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: options.maxTokens ?? 4096,
      system: systemMessage?.content || '',
      messages: chatMessages,
      temperature: options.temperature ?? 0.3
    }

    // 启用扩展思考模式
    if (options.reasoningEffort || this.config.model.includes('claude')) {
      body.thinking = {
        type: 'enabled',
        budget_tokens: 10000
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API错误 [${response.status}]: ${errorText}`)
    }

    const data = await response.json() as {
      content: Array<{
        type: string
        text?: string
        thinking?: string
      }>
      usage: {
        input_tokens: number
        output_tokens: number
      }
      model: string
    }

    // 提取思考和正文内容
    let reasoning: string | undefined
    let content = ''

    for (const block of data.content) {
      if (block.type === 'thinking') {
        reasoning = block.thinking
      } else if (block.type === 'text' && block.text) {
        content += block.text
      }
    }

    return {
      content,
      reasoning,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    }
  }

  /**
   * Anthropic多模态对话实现
   */
  private async callAnthropicVision(imageBase64: string, prompt: string, options: LLMOptions): Promise<LLMResponse> {
    // 处理base64图片数据
    let mediaType = 'image/png'
    let base64Data = imageBase64

    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(.+?);base64,(.+)$/)
      if (match) {
        mediaType = match[1]
        base64Data = match[2]
      }
    }

    const messages: ChatMessage[] = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        }
      ]
    }]

    return this.callAnthropic(messages, options)
  }

  /**
   * Anthropic流式输出实现
   */
  private async *streamAnthropic(messages: ChatMessage[], options: LLMOptions): StreamGenerator {
    const url = `${this.getBaseUrl()}/messages`

    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options.maxTokens ?? 4096,
        system: systemMessage?.content || '',
        messages: chatMessages,
        stream: true
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic流式API错误 [${response.status}]: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.text) {
              yield json.delta.text
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }

  // ==================== DeepSeek 实现 ====================

  /**
   * DeepSeek文本对话实现（兼容OpenAI格式）
   */
  private async callDeepSeek(messages: ChatMessage[], options: LLMOptions): Promise<LLMResponse> {
    const url = `${this.getBaseUrl()}/chat/completions`

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API错误 [${response.status}]: ${errorText}`)
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string
          reasoning_content?: string // R1系列返回思维链
        }
      }>
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
      model: string
    }

    const choice = data.choices[0]
    return {
      content: choice.message.content,
      reasoning: choice.message.reasoning_content, // R1的深度思考内容
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    }
  }

  /**
   * DeepSeek多模态对话实现
   */
  private async callDeepSeekVision(imageBase64: string, prompt: string, options: LLMOptions): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: imageBase64.startsWith('data:')
              ? imageBase64
              : `data:image/png;base64,${imageBase64}`
          }
        }
      ]
    }]

    return this.callDeepSeek(messages, options)
  }

  /**
   * DeepSeek流式输出实现（兼容OpenAI格式）
   */
  private async *streamDeepSeek(messages: ChatMessage[], options: LLMOptions): StreamGenerator {
    // DeepSeek兼容OpenAI的流式格式，复用OpenAI的实现逻辑
    const url = `${this.getBaseUrl()}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
        stream: true
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek流式API错误 [${response.status}]: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6))
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 测试连接是否正常
   */
  async testConnection(): Promise<{ success: boolean; model: string; latency: number }> {
    const startTime = Date.now()
    try {
      const response = await this.chat([
        { role: 'user', content: '请回复"连接成功"' }
      ], { maxTokens: 10 })
      const latency = Date.now() - startTime
      return {
        success: true,
        model: response.model,
        latency
      }
    } catch (error) {
      const latency = Date.now() - startTime
      console.error('[LLMClient] 连接测试失败:', error)
      return {
        success: false,
        model: this.config.model,
        latency
      }
    }
  }

  /**
   * 获取当前配置信息（脱敏）
   */
  getConfigInfo(): { provider: LLMProvider; model: string; baseUrl: string } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      baseUrl: this.getBaseUrl()
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建LLM客户端实例
 * @param config 平台配置
 * @returns 统一LLM客户端实例
 */
export function createLLMClient(config: LLMProviderConfig): UnifiedLLMClient {
  return new UnifiedLLMClient(config)
}
