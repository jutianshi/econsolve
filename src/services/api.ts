import type {
  AnalysisResult,
  SolveResult,
  Template,
  HistoryItem,
  ModelId,
  ProblemType,
  TaskStatus,
  LLMProvider,
  ModelOption,
} from '@/types';

const BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SubmitSolveData {
  problemContent: string;
  model: ModelId;
  templateId: string;
  detailLevel: 'concise' | 'standard' | 'detailed';
}

interface CreateTemplateData {
  name: string;
  description: string;
  category: Template['category'];
  content: string;
}

// OCR识别
export async function ocrRecognize(image: File): Promise<ApiResponse<{ text: string }>> {
  const formData = new FormData();
  formData.append('image', image);

  try {
    const response = await fetch(`${BASE_URL}/ocr`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OCR识别错误:', error);
    return { success: false, error: error instanceof Error ? error.message : 'OCR识别失败' };
  }
}

// 提交解析任务
export async function submitSolve(data: SubmitSolveData): Promise<ApiResponse<{ taskId: string }>> {
  try {
    const response = await fetch(`${BASE_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`提交解析失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('提交解析错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '提交解析失败' };
  }
}

// 获取任务状态
export async function getTaskStatus(taskId: string): Promise<ApiResponse<{
  status: TaskStatus;
  progress: number;
  currentStage: string;
}>> {
  try {
    const response = await fetch(`${BASE_URL}/solve/${taskId}/status`);

    if (!response.ok) {
      throw new Error(`获取任务状态失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取任务状态错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取任务状态失败' };
  }
}

// 获取任务结果
export async function getTaskResult(taskId: string): Promise<ApiResponse<SolveResult>> {
  try {
    const response = await fetch(`${BASE_URL}/solve/${taskId}/result`);

    if (!response.ok) {
      throw new Error(`获取任务结果失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取任务结果错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取任务结果失败' };
  }
}

// 获取模板列表
export async function getTemplates(): Promise<ApiResponse<Template[]>> {
  try {
    const response = await fetch(`${BASE_URL}/templates`);

    if (!response.ok) {
      throw new Error(`获取模板列表失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取模板列表错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取模板列表失败' };
  }
}

// 创建模板
export async function createTemplate(data: CreateTemplateData): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`创建模板失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('创建模板错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '创建模板失败' };
  }
}

// 更新模板
export async function updateTemplate(
  id: string,
  data: Partial<CreateTemplateData>
): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch(`${BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`更新模板失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('更新模板错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新模板失败' };
  }
}

// 删除模板
export async function deleteTemplate(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${BASE_URL}/templates/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`删除模板失败: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('删除模板错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '删除模板失败' };
  }
}

// 获取历史记录
export async function getHistory(filters?: {
  problemType?: ProblemType;
  status?: TaskStatus;
}): Promise<ApiResponse<HistoryItem[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.problemType) params.append('problemType', filters.problemType);
    if (filters?.status) params.append('status', filters.status);

    const url = filters
      ? `${BASE_URL}/history?${params.toString()}`
      : `${BASE_URL}/history`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取历史记录失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取历史记录错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取历史记录失败' };
  }
}

// 删除历史记录项
export async function deleteHistoryItem(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${BASE_URL}/history/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`删除历史记录失败: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('删除历史记录错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '删除历史记录失败' };
  }
}

// 验证LaTeX代码
export async function validateLatex(code: string): Promise<ApiResponse<{
  isValid: boolean;
  errors: Array<{ line: number; message: string; suggestion: string }>;
  warnings: string[];
}>> {
  try {
    const response = await fetch(`${BASE_URL}/latex/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`验证LaTeX失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('验证LaTeX错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '验证LaTeX失败' };
  }
}

// 测试LLM连接
export async function testLlmConnection(config: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
}): Promise<ApiResponse<{ success: boolean; modelInfo: string; latency: number }>> {
  try {
    const response = await fetch(`${BASE_URL}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`测试连接失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('测试LLM连接错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '测试连接失败' };
  }
}

// 获取可用模型列表（预设）
export function getAvailableModels(): ModelOption[] {
  return [
    {
      id: 'openai-gpt4o',
      name: 'OpenAI GPT-4o',
      provider: 'openai',
      models: ['gpt-4o', 'gpt-4o-mini'],
      capabilities: {
        vision: true,
        reasoning: false,
        maxContext: 128000,
        recommendedUse: '多模态识别与综合解析',
      },
    },
    {
      id: 'openai-o3',
      name: 'OpenAI o3 / o3-mini',
      provider: 'openai',
      models: ['o3', 'o3-mini'],
      capabilities: {
        vision: false,
        reasoning: true,
        maxContext: 200000,
        recommendedUse: '强推理、复杂逻辑推导',
      },
    },
    {
      id: 'anthropic-claude',
      name: 'Anthropic Claude 3.5/3.7 Sonnet',
      provider: 'anthropic',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-7-sonnet-20250219'],
      capabilities: {
        vision: true,
        reasoning: true,
        maxContext: 200000,
        recommendedUse: '长文本理解与Extended Thinking',
      },
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek-V3',
      provider: 'deepseek',
      models: ['deepseek-chat'],
      capabilities: {
        vision: false,
        reasoning: false,
        maxContext: 65536,
        recommendedUse: '快速响应、通用场景',
      },
    },
    {
      id: 'deepseek-r1',
      name: 'DeepSeek-R1',
      provider: 'deepseek',
      models: ['deepseek-reasoner'],
      capabilities: {
        vision: false,
        reasoning: true,
        maxContext: 65536,
        recommendedUse: '强推理、思维链输出',
      },
    },
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro',
      provider: 'deepseek',
      models: ['deepseek-v4-pro'],
      capabilities: {
        vision: true,
        reasoning: true,
        maxContext: 131072,
        recommendedUse: '最新旗舰，多模态+深度推理全能',
      },
    },
  ];
}
