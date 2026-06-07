/**
 * 核心解析接口 - 多Agent协作版本
 * 实现完整的多Agent管道式协作：
 * 用户输入 → OCR → 分析 → 推理 → LaTeX → 质检 → 输出
 */
import { Router, type Request, type Response } from 'express'
import type {
  SolveRequest,
  SolveResult,
  TaskStatusResponse,
  AnalysisResult,
  SolutionResult,
  LatexCodeResult,
  QualityCheckResult,
  TaskStatus,
  LLMConfig
} from '../types/index.js'
import { UnifiedLLMClient } from '../services/llmClient.js'
import {
  OrchestratorAgent,
  createOrchestratorWithClient,
  type PipelineContext,
  type InputType
} from '../services/agents/orchestrator.js'

const router = Router()

// 内存存储：任务状态Map
const taskStore = new Map<string, SolveResult>()

// 内存存储：LLM配置（生产环境应使用数据库或加密存储）
let currentLLMConfig: LLMConfig | null = null

// 生成唯一任务ID
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检查LLM配置是否可用
 */
function isLLMConfigured(): boolean {
  return Boolean(currentLLMConfig?.apiKey)
}

/**
 * 将管道上下文转换为API响应格式
 */
function pipelineContextToSolveResult(context: PipelineContext): SolveResult {
  const now = new Date().toISOString()

  // 转换分析结果
  let analysis: AnalysisResult | null = null
  if (context.analysisResult) {
    const ar = context.analysisResult
    analysis = {
      problemType: ar.problemType,
      knowledgePoints: ar.knowledgePoints,
      knownConditions: ar.knownConditions,
      solveTarget: ar.solveTarget,
      difficulty: ar.difficulty,
      difficultyReason: ar.difficultyReason,
      keyEquations: ar.keyEquations,
      suggestedApproach: ar.suggestedApproach,
      estimatedSteps: ar.estimatedSteps,
      // 兼容旧字段
      subject: ar.knowledgePoints[0] || '未知',
      keyPoints: ar.knowledgePoints,
      approach: ar.suggestedApproach,
      formulas: ar.keyEquations
    }
  }

  // 转换解答结果
  let solution: SolutionResult | null = null
  if (context.reasoningResult) {
    const rr = context.reasoningResult
    solution = {
      reasoningProcess: rr.reasoningProcess,
      steps: rr.steps.map(s => ({
        stepNumber: s.stepNumber,
        title: s.title,
        thinking: s.thinking,
        content: s.action, // 兼容旧字段
        action: s.action,
        result: s.result,
        formula: s.formula,
        justification: s.justification
      })),
      finalAnswer: rr.finalAnswer,
      methodSummary: rr.methodSummary,
      alternativeSolution: rr.alternativeSolution,
      commonMistakes: rr.commonPitfalls,
      commonPitfalls: rr.commonPitfalls
    }
  }

  // 转换LaTeX结果
  let latexCode: LatexCodeResult | null = null
  if (context.latexResult) {
    const lr = context.latexResult
    latexCode = {
      code: lr.code,
      usedEnvironments: lr.usedEnvironments,
      packageRequirements: lr.packageRequirements,
      compilationNote: lr.compilationNote,
      // 兼容旧字段
      templateName: '多Agent生成',
      qualityScore: context.qualityResult?.scores.overall ?? 85
    }
  }

  // 转换质检结果
  let qualityCheck: QualityCheckResult | null = null
  if (context.qualityResult) {
    const qc = context.qualityResult
    qualityCheck = {
      passed: qc.passed,
      scores: qc.scores,
      feedback: qc.feedback,
      issues: qc.issues.map(i => ({
        category: i.category,
        severity: i.severity,
        location: i.location,
        description: i.description,
        fixSuggestion: i.fixSuggestion
      })),
      suggestion: qc.suggestion
    }
  }

  // 构建管道信息
  const pipelineInfo = {
    totalDuration: Date.now() - context.startTime,
    retryCount: context.retryCount,
    stagesCompleted: [
      context.ocrResult ? 'ocr' : null,
      context.analysisResult ? 'analysis' : null,
      context.reasoningResult ? 'reasoning' : null,
      context.latexResult ? 'latex' : null,
      context.qualityResult ? 'quality_check' : null
    ].filter(Boolean) as string[],
    errors: context.errors
  }

  // 确定最终状态
  let status: TaskStatus = 'completed'
  if (context.errors.length > 0 && !context.reasoningResult) {
    status = 'failed'
  } else if (!context.qualityResult?.passed && context.qualityResult) {
    status = 'completed' // 即使未通过也标记完成（已达到最大重试次数）
  }

  return {
    taskId: context.taskId,
    status,
    progress: 100,
    analysis,
    solution,
    latexCode,
    qualityCheck,
    pipelineInfo,
    createdAt: new Date(context.startTime).toISOString(),
    completedAt: now
  }
}

/**
 * 执行多Agent管道（异步）
 */
async function executePipeline(
  taskId: string,
  input: string,
  inputType: InputType,
  templateContent?: string
): Promise<void> {
  const task = taskStore.get(taskId)
  if (!task) return

  try {
    // 检查LLM配置
    if (!isLLMConfigured() || !currentLLMConfig) {
      throw new Error('请先在设置页配置大模型API密钥')
    }

    // 创建LLM客户端
    const llmClient = new UnifiedLLMClient(currentLLMConfig)

    // 创建编排器
    const orchestrator = createOrchestratorWithClient(llmClient, {
      maxRetries: 2,
      enableQualityCheck: true
    })

    // 创建管道上下文
    const context = OrchestratorAgent.createContext(
      taskId,
      input,
      inputType,
      undefined,
      templateContent
    )

    // 更新任务状态为处理中
    updateTaskStatus(taskId, 'pending', 5, '初始化管道...')

    // 执行管道
    const result = await orchestrator.execute(context)

    // 转换并更新任务结果
    const solveResult = pipelineContextToSolveResult(result)
    taskStore.set(taskId, solveResult)

    console.log(`[SolveRoute] 任务 ${taskId} 管道执行完成`)

  } catch (error) {
    console.error(`[SolveRoute] 任务 ${taskId} 执行失败:`, error)

    // 更新任务为失败状态
    const failedTask = taskStore.get(taskId)
    if (failedTask) {
      failedTask.status = 'failed'
      failedTask.progress = 0
      failedTask.pipelineInfo = failedTask.pipelineInfo || {
        totalDuration: 0,
        retryCount: 0,
        stagesCompleted: [],
        errors: [{
          stage: 'pipeline',
          error: error instanceof Error ? error.message : '未知错误'
        }]
      }
      failedTask.completedAt = new Date().toISOString()
    }
  }
}

/**
 * 演示模式管道 - 当未配置LLM API密钥时使用
 * 模拟多Agent管道执行过程，生成高质量的示例数据
 */
async function executeDemoPipeline(taskId: string, input: string): Promise<void> {
  const task = taskStore.get(taskId)
  if (!task) return

  // 模拟各阶段进度
  const stages = [
    { status: 'pending' as TaskStatus, progress: 5, message: '初始化管道...', delay: 300 },
    { status: 'ocr_processing' as TaskStatus, progress: 15, message: 'OCR Agent 正在识别题目内容...', delay: 800 },
    { status: 'analyzing' as TaskStatus, progress: 30, message: 'Analysis Agent 正在深度分析题目结构...', delay: 1200 },
    { status: 'solving' as TaskStatus, progress: 50, message: 'Reasoning Agent 正在进行深度推理...', delay: 1500 },
    { status: 'solving' as TaskStatus, progress: 65, message: 'Reasoning Agent 推导中（启用深度思考）...', delay: 1200 },
    { status: 'generating' as TaskStatus, progress: 80, message: 'LaTeX Agent 正在生成排版代码...', delay: 1000 },
    { status: 'quality_checking' as TaskStatus, progress: 90, message: 'QualityCheck Agent 正在进行三维质检...', delay: 800 },
  ]

  for (const stage of stages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay))
    updateTaskStatus(taskId, stage.status, stage.progress, stage.message)
  }

  // 最终完成：生成完整的模拟结果
  const demoResult = generateDemoResult(taskId, input)
  taskStore.set(taskId, demoResult)

  console.log(`[SolveRoute] 演示任务 ${taskId} 完成`)
}

/**
 * 生成演示模式的模拟数据
 */
function generateDemoResult(taskId: string, problemText: string): SolveResult {
  const now = new Date().toISOString()

  // 分析结果
  const analysis = {
    problemType: 'calculation',
    subject: '微观经济学-消费者理论',
    keyPoints: ['效用最大化', '拉格朗日乘数法', '需求函数推导'],
    approach: '建立拉格朗日函数，求一阶条件，解出最优需求',
    formulas: ['\\mathcal{L} = U(x_1, x_2) + \\lambda(m - p_1 x_1 - p_2 x_2)'],
    knowledgePoints: ['微观经济学-消费者理论-效用最大化', '数学方法-约束优化-拉格朗日乘数法'],
    knownConditions: [
      '效用函数: $U(x_1,x_2) = x_1^{\\alpha} x_2^{1-\\alpha}$（柯布-道格拉斯形式）',
      '商品价格: $p_1$, $p_2$（外生给定）',
      '消费者收入: $m$（预算约束）'
    ],
    solveTarget: '求解马歇尔需求函数 $x_1^*(p_1,p_2,m)$ 和 $x_2^*(p_1,p_2,m)$',
    difficulty: 'medium',
    difficultyReason: '涉及多元微积分和约束优化，属于中级微观经济学题目',
    keyEquations: ['拉格朗日一阶条件', '预算约束'],
    suggestedApproach: '使用拉格朗日乘数法，对效用函数在预算约束下求极大值',
    estimatedSteps: 5,
    rawJson: JSON.stringify({
      problemType: 'calculation',
      subject: '微观经济学-消费者理论',
      keyPoints: ['效用最大化', '拉格朗日乘数法', '需求函数推导']
    })
  }

  // 解答结果
  const solution = {
    content: `## 解题思路\n\n本题要求在预算约束下最大化柯布-道格拉斯效用函数。采用**拉格朗日乘数法**是解决此类约束优化问题的标准方法。\n\n### 核心步骤\n1. 建立拉格朗日函数\n2. 求一阶必要条件(FOC)\n3. 联立方程组求解\n4. 验证二阶条件（凹性保证）\n5. 得到马歇尔需求函数`,
    reasoningProcess: `## 解题思路\n\n本题要求在预算约束下最大化柯布-道格拉斯效用函数。采用**拉格朗日乘数法**是解决此类约束优化问题的标准方法。\n\n### 核心步骤\n1. 建立拉格朗日函数\n2. 求一阶必要条件(FOC)\n3. 联立方程组求解\n4. 验证二阶条件（凹性保证）\n5. 得到马歇尔需求函数`,
    steps: [
      {
        stepNumber: 1,
        title: '建立拉格朗日函数',
        content: '消费者问题本质是在预算约束下最大化效用。引入拉格朗日乘数$\\lambda$将约束问题转化为无约束优化。\n\n构造拉格朗日函数：$$\\mathcal{L} = x_1^{\\alpha} x_2^{1-\\alpha} + \\lambda(m - p_1 x_1 - p_2 x_2)$$\n\n拉格朗日乘数法是处理等式约束优化的标准工具，将原问题转化为求解驻点条件。',
        formulas: ['\\mathcal{L} = x_1^\\alpha x_2^{1-\\alpha} + \\lambda(m - p_1 x_1 - p_2 x_2)']
      },
      {
        stepNumber: 2,
        title: '求一阶条件(FOC)',
        content: '对三个变量分别求偏导并令其为零，得到必要条件方程组。\n\n一阶条件是局部极值的必要条件，对于严格拟凹的效用函数同时也是充分条件。',
        formulas: [
          '\\frac{\\partial \\mathcal{L}}{\\partial x_1} = \\alpha x_1^{\\alpha-1} x_2^{1-\\alpha} - \\lambda p_1 = 0',
          '\\frac{\\partial \\mathcal{L}}{\\partial x_2} = (1-\\alpha) x_1^{\\alpha} x_2^{-\\alpha} - \\lambda p_2 = 0',
          '\\frac{\\partial \\mathcal{L}}{\\partial \\lambda} = m - p_1 x_1 - p_2 x_2 = 0'
        ]
      },
      {
        stepNumber: 3,
        title: '联立求解需求函数',
        content: '从前两式消去$\\lambda$，得到最优消费比例关系，再代入预算约束解出具体表达式。\n\n柯布-道格拉斯效用函数的特殊性质使得需求函数具有简洁的线性形式：收入份额固定。',
        formulas: ['x_2 = \\frac{(1-\\alpha)p_1}{\\alpha p_2} x_1', 'x_1^* = \\frac{\\alpha m}{p_1}, \\quad x_2^* = \\frac{(1-\\alpha)m}{p_2}']
      },
      {
        stepNumber: 4,
        title: '验证二阶条件',
        content: '检查效用函数的加边海塞矩阵负定性，或利用柯布-道格拉斯函数的严格拟凹性质。\n\n柯布-道格拉斯函数在正象限内严格拟凹，一阶条件的唯一解即为全局最优解。',
        formulas: []
      },
      {
        stepNumber: 5,
        title: '得出最终答案',
        content: '汇总以上推导，给出规范化的最终答案。\n\n马歇尔需求函数已完整求得，满足预算约束且使效用最大化，形式简洁具有经济含义。收入份额分别为$\\alpha$和$(1-\\alpha)$，与价格无关——这是C-D效用函数的重要特性。',
        formulas: ['\\boxed{x_1^*(p_1,p_2,m) = \\frac{\\alpha m}{p_1}, \\quad x_2^*(p_1,p_2,m) = \\frac{(1-\\alpha)m}{p_2}}']
      }
    ],
    finalAnswer: '马歇尔需求函数为：$x_1^* = \\frac{\\alpha m}{p_1}$，$x_2^* = \\frac{(1-\\alpha)m}{p_2}$。收入份额分别为α和(1-α)，与价格无关——这是C-D效用函数的重要特性。',
    methodSummary: '拉格朗日乘数法：通过引入乘数将有约束优化转化为无约束问题，利用一阶条件求解，再用二阶条件确认最优性。',
    alternativeSolutions: [
      {
        name: '间接效用函数法',
        reason: '可先求出间接效用函数再应用罗伊恒等式，适用于更复杂的多阶段优化问题',
        content: '先构造V(p₁,p₂,m)，再用Roy\'s Identity: x_i* = -∂V/∂p_i ÷ ∂V/∂m'
      }
    ],
    commonPitfalls: [
      '注意不要混淆马歇尔需求（Marshallian）与希克斯需求（Hicksian）',
      '拉格朗日乘数λ的经济含义是收入的边际效用',
      'C-D函数的收入弹性为1，即恩格尔曲线为过原点的直线'
    ]
  }

  // LaTeX代码
  const latexCode = {
    code: `% 题目分析
\\textbf{题目类型：} 计算题

\\textbf{知识点：} 微观经济学-消费者理论-效用最大化

\\textbf{已知条件：}
\\begin{itemize}
    \\item 效用函数：$U(x_1, x_2) = x_1^{\\alpha} x_2^{1-\\alpha}$
    \\item 商品价格：$p_1$, $p_2$
    \\item 收入水平：$m$
\\end{itemize}

\\textbf{求解目标：} 马歇尔需求函数 $x_1^*(p_1,p_2,m)$ 和 $x_2^*(p_1,p_2,m)$

% 解答过程
\\section*{解答}

\\subsection*{第一步：建立拉格朗日函数}

构造拉格朗日函数：
\\begin{equation}
    \\mathcal{L} = x_1^{\\alpha} x_2^{1-\\alpha} + \\lambda(m - p_1 x_1 - p_2 x_2)
\\end{equation}

\\subsection*{第二步：一阶必要条件}

对 $x_1$, $x_2$, $\\lambda$ 分别求偏导：
\\begin{align}
    \\frac{\\partial \\mathcal{L}}{\\partial x_1} &= \\alpha x_1^{\\alpha-1} x_2^{1-\\alpha} - \\lambda p_1 = 0 \\\\
    \\frac{\\partial \\mathcal{L}}{\\partial x_2} &= (1-\\alpha) x_1^{\\alpha} x_2^{-\\alpha} - \\lambda p_2 = 0 \\\\
    \\frac{\\partial \\mathcal{L}}{\\partial \\lambda} &= m - p_1 x_1 - p_2 x_2 = 0
\\end{align}

\\subsection*{第三步：求解需求函数}

由前两式消去 $\\lambda$：
\\begin{equation}
    \\frac{\\alpha x_2}{(1-\\alpha)x_1} = \\frac{p_1}{p_2}
    \\implies x_2 = \\frac{(1-\\alpha)p_1}{\\alpha p_2} x_1
\\end{equation}

代入预算约束 $p_1 x_1 + p_2 x_2 = m$：

\\begin{equation}
    \\boxed{
    \\begin{aligned}
        x_1^*(p_1, p_2, m) &= \\frac{\\alpha m}{p_1} \\\\[6pt]
        x_2^*(p_1, p_2, m) &= \\frac{(1-\\alpha)m}{p_2}
    \\end{aligned}
    }
\\end{equation}`,
    usedEnvironments: ['equation', 'align', 'itemize', 'section*', 'subsection*', 'boxed'],
    packageRequirements: ['amsmath', 'amssymb'],
    compilationNote: '本文档可嵌入任何标准LaTeX模板中编译',
    validationResult: {
      isValid: true,
      errors: [],
      warnings: ['建议在导言区添加 \\usepackage{amsmath} 和 \\usepackage{amssymb}']
    }
  }

  // 质检结果
  const qualityCheck = {
    passed: true,
    scores: { completeness: 92, conciseness: 88, integrity: 95, overall: 92 },
    feedback: '解答质量优秀。所有推导步骤完整，每步有justify，最终答案格式规范。建议：可补充图形辅助说明无差异曲线与预算线的切点关系。',
    issues: [],
    suggestion: '整体质量达到考研辅导标准，可直接用于教学参考。'
  }

  return {
    taskId,
    status: 'completed',
    progress: 100,
    analysis,
    solution,
    latexCode,
    qualityCheck,
    pipelineInfo: {
      totalDuration: 6800,
      retryCount: 0,
      stagesCompleted: ['ocr', 'analysis', 'reasoning', 'latex_generation', 'quality_check'],
      errors: []
    },
    modelUsed: 'demo-mode',
    templateUsed: '通用标准模板',
    totalProcessingTime: 6800,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    createdAt: now,
    completedAt: new Date().toISOString()
  }
}

/**
 * 更新任务状态（用于实时进度展示）
 */
function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  progress: number,
  message?: string
): void {
  const task = taskStore.get(taskId)
  if (task) {
    task.status = status
    task.progress = Math.min(progress, 100)
  }
}

/**
 * POST /api/solve - 提交题目进行解析
 * 启动多Agent管道，返回taskId用于轮询
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { problemText, image, templateId, modelPreference, inputType }: SolveRequest = req.body

    // 参数验证：必须提供文本或图片之一
    if (!problemText && !image) {
      res.status(400).json({
        success: false,
        error: '请提供题目文本或图片'
      })
      return
    }

    // 自动检测输入类型
    let detectedInputType: InputType = 'text'
    let actualInput: string = ''

    if (image) {
      detectedInputType = 'image'
      actualInput = image
    } else if (problemText) {
      detectedInputType = 'text'
      actualInput = problemText
    }

    // 检查是否配置了LLM
    const hasLLM = isLLMConfigured()

    // 创建任务（无论是否配置了LLM都创建）
    const taskId = generateTaskId()
    const now = new Date().toISOString()

    const task: SolveResult = {
      taskId,
      status: 'pending',
      progress: 0,
      analysis: null,
      solution: null,
      latexCode: null,
      qualityCheck: null,
      pipelineInfo: null,
      createdAt: now
    }

    // 存储任务
    taskStore.set(taskId, task)

    if (!hasLLM) {
      // 演示模式：异步生成高质量模拟数据
      executeDemoPipeline(taskId, actualInput).catch(error => {
        console.error(`[SolveRoute] 演示管道执行异常:`, error)
      })

      // 返回任务ID（演示模式标记）
      res.status(202).json({
        success: true,
        data: {
          taskId,
          message: '演示模式：使用预设示例数据进行展示',
          pipeline: ['OCR', '分析', '推理', 'LaTeX', '质检'],
          demoMode: true
        }
      })
      return
    }

    // 正式模式：执行多Agent管道
    executePipeline(taskId, actualInput, detectedInputType).catch(error => {
      console.error(`[SolveRoute] 管道执行异常:`, error)
    })

    // 立即返回任务ID
    res.status(202).json({
      success: true,
      data: {
        taskId,
        message: '任务已创建，多Agent管道正在执行',
        pipeline: ['OCR', '分析', '推理', 'LaTeX', '质检']
      }
    })
  } catch (error) {
    console.error('创建解析任务失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

/**
 * GET /api/solve/:id/status - 轮询任务状态
 */
router.get('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const task = taskStore.get(id)

  if (!task) {
    res.status(404).json({
      success: false,
      error: '任务不存在'
    })
    return
  }

  const statusMessages: Record<TaskStatus, string> = {
    pending: '任务初始化中...',
    ocr_processing: '正在进行OCR识别...',
    analyzing: '正在深度分析题目结构和考点...',
    solving: '正在深度思考和推理解答...',
    generating: '正在生成LaTeX排版代码...',
    quality_checking: '正在进行质量检查...',
    completed: '任务已完成！',
    failed: '任务执行失败'
  }

  const response: TaskStatusResponse = {
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    message: statusMessages[task.status],
    currentStage: task.pipelineInfo?.stagesCompleted.slice(-1)[0]
  }

  res.json({
    success: true,
    data: response
  })
})

/**
 * GET /api/solve/:id/result - 获取完整结果
 */
router.get('/:id/result', (req: Request, res: Response): void => {
  const { id } = req.params
  const task = taskStore.get(id)

  if (!task) {
    res.status(404).json({
      success: false,
      error: '任务不存在'
    })
    return
  }

  if (task.status !== 'completed' && task.status !== 'failed') {
    res.status(200).json({
      success: true,
      data: task,
      message: `任务仍在处理中，当前状态：${task.status} (${task.progress}%)`
    })
    return
  }

  res.json({
    success: true,
    data: task
  })
})

/**
 * GET /api/solve/config - 获取当前LLM配置状态
 */
router.get('/config/status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      configured: isLLMConfigured(),
      provider: currentLLMConfig?.provider || null,
      model: currentLLMConfig?.model || null
    }
  })
})

export default router
