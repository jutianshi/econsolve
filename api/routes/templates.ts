/**
 * 模板管理路由
 * 支持预设模板和用户自定义模板的CRUD操作
 */
import { Router, type Request, type Response } from 'express'
import type { Template } from '../types/index.js'

const router = Router()

// 内存存储：模板数据
const templates: Map<string, Template> = new Map()

// 初始化预设模板
function initPresetTemplates(): void {
  const presets: Template[] = [
    {
      id: 'preset-general',
      name: '通用标准模板',
      description: '适用于大多数经济学考研题型，包含完整的文档结构和基本数学环境',
      category: 'general',
      isPreset: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\geometry{left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm}

\\title{经济学考研题目解析}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{题目}
% 在此插入题目内容

\\section{题目分析}
% 在此插入分析内容

\\section{详细解答}
% 在此插入解答过程

\\section{答案总结}
% 在此插入最终答案

\\end{document}`
    },
    {
      id: 'preset-calculation',
      name: '计算题专用模板',
      description: '专为计算题设计，包含align多行公式环境和分步推导格式',
      category: 'calculation',
      isPreset: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{tcolorbox}
\\usepackage{xcolor}
\\geometry{left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm}

\\newtcolorbox{answerbox}{
  colback=blue!5!white,
  colframe=blue!75!black,
  title=最终答案,
  fonttitle=\\bfseries
}

\\title{计算题详解}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{原题}
% 题目内容

\\section{解题思路}
% 思路概述

\\section{逐步求解}

\\subsection{第一步}
% 步骤内容...

\\subsection{第二步}
% 步骤内容...

\\begin{answerbox}
在此填写最终计算结果
\\end{answerbox}

\\end{document}`
    },
    {
      id: 'preset-proof',
      name: '证明题专用模板',
      description: '专为证明题设计，包含proof环境和定理环境',
      category: 'proof',
      isPreset: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{amsthm}
\\usepackage{geometry}
\\geometry{left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm}

% 定理环境设置
\\theoremstyle{definition}
\\newtheorem{definition}{定义}[section]
\\newtheorem{theorem}{定理}[section]
\\newtheorem{lemma}{引理}[section]

\\title{证明题详解}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{待证命题}
% 陈述需要证明的命题

\\section{证明思路}
% 证明策略和方法

\\section{形式化证明}

\\begin{proof}
在此给出严谨的形式化证明过程...
\\end{proof}

\\section{证明要点总结}
% 总结关键步骤和技巧

\\end{document}`
    }
  ]

  presets.forEach(t => templates.set(t.id, t))
}

// 初始化预设模板
initPresetTemplates()

/**
 * GET /api/templates - 获取所有模板列表
 */
router.get('/', (_req: Request, res: Response): void => {
  const templateList = Array.from(templates.values())
  
  res.json({
    success: true,
    data: {
      templates: templateList,
      total: templateList.length
    }
  })
})

/**
 * POST /api/templates - 创建新模板
 */
router.post('/', (req: Request, res: Response): void => {
  const { name, description, content, category } = req.body

  // 参数验证
  if (!name || !content) {
    res.status(400).json({
      success: false,
      error: '模板名称和内容不能为空'
    })
    return
  }

  const now = new Date().toISOString()
  const newTemplate: Template = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: description || '',
    content,
    category: category || 'general',
    isPreset: false,
    createdAt: now,
    updatedAt: now
  }

  templates.set(newTemplate.id, newTemplate)

  res.status(201).json({
    success: true,
    data: newTemplate,
    message: '模板创建成功'
  })
})

/**
 * PUT /api/templates/:id - 更新模板
 */
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const template = templates.get(id)

  if (!template) {
    res.status(404).json({
      success: false,
      error: '模板不存在'
    })
    return
  }

  // 不允许修改预设模板
  if (template.isPreset) {
    res.status(403).json({
      success: false,
      error: '不允许修改预设模板'
    })
    return
  }

  const { name, description, content, category } = req.body

  // 更新允许修改的字段
  const updatedTemplate: Template = {
    ...template,
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(content && { content }),
    ...(category && { category }),
    updatedAt: new Date().toISOString()
  }

  templates.set(id, updatedTemplate)

  res.json({
    success: true,
    data: updatedTemplate,
    message: '模板更新成功'
  })
})

/**
 * DELETE /api/templates/:id - 删除模板
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const template = templates.get(id)

  if (!template) {
    res.status(404).json({
      success: false,
      error: '模板不存在'
    })
    return
  }

  // 不允许删除预设模板
  if (template.isPreset) {
    res.status(403).json({
      success: false,
      error: '不允许删除预设模板'
    })
    return
  }

  templates.delete(id)

  res.json({
    success: true,
    message: '模板删除成功'
  })
})

export default router
