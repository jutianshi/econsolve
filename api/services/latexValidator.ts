/**
 * LaTeX校验服务
 * 用于检测LaTeX代码中的常见错误和质量问题
 */

import type { LatexValidateResponse, ValidationCheck } from '../types/index.js'

/**
 * 校验LaTeX代码质量
 * @param code 待校验的LaTeX代码
 * @returns 校验结果
 */
export function validateLatex(code: string): LatexValidateResponse {
  const checks: ValidationCheck[] = []
  const errors: string[] = []

  // 1. 括号平衡检查
  const bracketCheck = checkBracketBalance(code)
  checks.push(bracketCheck)
  if (!bracketCheck.passed) {
    errors.push(bracketCheck.message)
  }

  // 2. 花括号平衡检查
  const braceCheck = checkBraceBalance(code)
  checks.push(braceCheck)
  if (!braceCheck.passed) {
    errors.push(braceCheck.message)
  }

  // 3. 常见错误检测
  const commonErrorsCheck = checkCommonErrors(code)
  checks.push(commonErrorsCheck)
  commonErrorsCheck.errors?.forEach(err => errors.push(err))

  // 4. 数学环境检查
  const mathEnvCheck = checkMathEnvironments(code)
  checks.push(mathEnvCheck)
  if (!mathEnvCheck.passed) {
    errors.push(mathEnvCheck.message)
  }

  // 5. 必要宏包检查
  const packageCheck = checkRequiredPackages(code)
  checks.push(packageCheck)

  // 6. 文档结构检查
  const structureCheck = checkDocumentStructure(code)
  checks.push(structureCheck)
  if (!structureCheck.passed) {
    errors.push(structureCheck.message)
  }

  // 计算总分
  const passedCount = checks.filter(c => c.passed).length
  const score = Math.round((passedCount / checks.length) * 100)

  return {
    isValid: errors.length === 0,
    score,
    checks,
    errors
  }
}

/**
 * 检查圆括号和方括号是否平衡
 */
function checkBracketBalance(code: string): ValidationCheck {
  let roundCount = 0
  let squareCount = 0

  for (const char of code) {
    if (char === '(') roundCount++
    else if (char === ')') roundCount--
    else if (char === '[') squareCount++
    else if (char === ']') squareCount--
  }

  const isBalanced = roundCount === 0 && squareCount === 0

  return {
    name: '括号平衡检查',
    passed: isBalanced,
    message: isBalanced
      ? '圆括号和方括号配对正确'
      : `括号不平衡：圆括号${roundCount > 0 ? '多' + roundCount + '个左括号' : '多' + Math.abs(roundCount) + '个右括号'}，方括号${squareCount !== 0 ? (squareCount > 0 ? '多' + squareCount + '个左括号' : '多' + Math.abs(squareCount) + '个右括号') : '正常'}`
  }
}

/**
 * 检查花括号是否平衡
 */
function checkBraceBalance(code: string): ValidationCheck {
  let count = 0

  for (const char of code) {
    if (char === '{') count++
    else if (char === '}') count--
  }

  const isBalanced = count === 0

  return {
    name: '花括号平衡检查',
    passed: isBalanced,
    message: isBalanced
      ? '花括号配对正确'
      : `花括号不平衡：${count > 0 ? '缺少 ' + count + ' 个右花括号' : '多出 ' + Math.abs(count) + ' 个右花括号'}`
  }
}

/**
 * 检测常见LaTeX错误
 */
function checkCommonErrors(code: string): ValidationCheck & { errors?: string[] } {
  const detectedErrors: string[] = []

  // 检查 \frac 参数不完整
  const fracPattern = /\\frac\s*(?!\{)/g
  const fracMatches = code.match(fracPattern)
  if (fracMatches) {
    detectedErrors.push(`发现 ${fracMatches.length} 处 \\frac 后缺少花括号参数`)
  }

  // 检查 \sqrt 参数不完整
  const sqrtPattern = /\\sqrt\s*(?!\[|\{)/g
  const sqrtMatches = code.match(sqrtPattern)
  if (sqrtMatches) {
    detectedErrors.push(`发现 ${sqrtMatches.length} 处 \\sqrt 后缺少参数`)
  }

  // 检查未闭合的数学模式
  const dollarCount = (code.match(/\$/g) || []).length
  if (dollarCount % 2 !== 0) {
    detectedErrors.push('行内数学模式 $ 未成对出现')
  }

  // 检查 \begin 和 \end 是否匹配
  const beginMatches = [...code.matchAll(/\\begin\{(\w+)\}/g)]
  const endMatches = new Set([...code.matchAll(/\\end\{(\w+)\}/g)].map(m => m[1]))

  for (const match of beginMatches) {
    const envName = match[1]
    if (!endMatches.has(envName)) {
      detectedErrors.push(`环境 \\begin{${envName}} 缺少对应的 \\end{${envName}}`)
    }
  }

  // 检查命令拼写错误
  const commonTypos = [
    { wrong: /\\eqaution/g, correct: '\\equation' },
    { wrong: /\\algin/g, correct: '\\align' },
    { wrong: /\\frace/g, correct: '\\frac' },
    { wrong: /\\sqr/g, correct: '\\sqrt' },
    { wrong: /\\intertext/g, correct: '\\intertext' }
  ]

  for (const typo of commonTypos) {
    if (typo.wrong.test(code)) {
      detectedErrors.push(`可能的拼写错误：应为 "${typo.correct}"`)
    }
  }

  return {
    name: '常见错误检测',
    passed: detectedErrors.length === 0,
    message: detectedErrors.length === 0 ? '未检测到常见错误' : `发现 ${detectedErrors.length} 个潜在问题`,
    errors: detectedErrors
  }
}

/**
 * 检查数学环境使用是否正确
 */
function checkMathEnvironments(code: string): ValidationCheck {
  const mathEnvs = ['equation', 'align', 'gather', 'multline', 'cases', 'matrix']
  const issues: string[] = []

  for (const env of mathEnvs) {
    const beginCount = (code.match(new RegExp(`\\\\begin\\{${env}\\}`, 'g')) || []).length
    const endCount = (code.match(new RegExp(`\\\\end\\{${env}\\}`, 'g')) || []).length

    if (beginCount !== endCount) {
      issues.push(`${env} 环境的 begin/end 不匹配`)
    }
  }

  // 检查是否在数学环境中使用了文本模式命令
  const textInMathPattern = /\\textbf|\\textit|\\emph/g
  const hasTextCommands = textInMathPattern.test(code)

  return {
    name: '数学环境检查',
    passed: issues.length === 0,
    message: issues.length === 0 ? '数学环境使用正确' : `检测到问题：${issues.join('；')}`,
    ...(hasTextCommands ? { warning: '检测到可能在数学环境中使用了文本格式命令' } : {})
  }
}

/**
 * 检查必要的宏包是否已加载
 */
function checkRequiredPackages(code: string): ValidationCheck {
  const requiredPackages: { pattern: RegExp; name: string; optional: boolean }[] = [
    { pattern: /\\usepackage.*amsmath/, name: 'amsmath', optional: false },
    { pattern: /\\usepackage.*amssymb/, name: 'amssymb', optional: false },
    { pattern: /\\usepackage.*ctex/, name: 'ctex', optional: true }, // 中文支持
    { pattern: /\\usepackage.*geometry/, name: 'geometry', optional: true } // 页面设置
  ]

  const missingPackages: string[] = []
  const warnings: string[] = []

  for (const pkg of requiredPackages) {
    if (!pkg.pattern.test(code)) {
      if (pkg.optional) {
        warnings.push(`建议加载 ${pkg.name} 宏包以获得更好的效果`)
      } else {
        missingPackages.push(pkg.name)
      }
    }
  }

  return {
    name: '宏包检查',
    passed: missingPackages.length === 0,
    message: missingPackages.length === 0
      ? (warnings.length > 0 ? `必要宏包已加载。提示：${warnings.join('；')}` : '必要宏包已全部加载')
      : `缺少必要宏包：${missingPackages.join(', ')}`
  }
}

/**
 * 检查文档基本结构
 */
function checkDocumentStructure(code: string): ValidationCheck {
  const hasDocumentClass = /\\documentclass/.test(code)
  const hasBeginDocument = /\\begin\{document\}/.test(code)
  const hasEndDocument = /\\end\{document\}/.test(code)

  const isComplete = hasDocumentClass && hasBeginDocument && hasEndDocument

  return {
    name: '文档结构检查',
    passed: isComplete,
    message: isComplete
      ? '文档结构完整'
      : `文档结构不完整：${!hasDocumentClass ? '缺少 documentclass；' : ''}${!hasBeginDocument ? '缺少 \\begin{document}；' : ''}${!hasEndDocument ? '缺少 \\end{document}' : ''}`
  }
}
