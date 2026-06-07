/**
 * LaTeX校验路由
 * 提供LaTeX代码质量检测功能
 */
import { Router, type Request, type Response } from 'express'
import { validateLatex } from '../services/latexValidator.js'
import type { LatexValidateRequest, LatexValidateResponse } from '../types/index.js'

const router = Router()

/**
 * POST /api/latex/validate - 校验LaTeX代码
 */
router.post('/validate', (req: Request, res: Response): void => {
  const { code }: LatexValidateRequest = req.body

  // 参数验证
  if (!code || code.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'LaTeX代码不能为空'
    })
    return
  }

  // 执行校验
  const validationResult: LatexValidateResponse = validateLatex(code)

  // 返回校验结果和建议
  res.json({
    success: true,
    data: validationResult,
    ...(validationResult.isValid 
      ? { message: '✅ LaTeX代码质量良好，可以直接编译' }
      : { message: `⚠️ 发现 ${validationResult.errors.length} 个问题需要修复` }
    )
  })
})

export default router
