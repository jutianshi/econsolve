/**
 * 历史记录管理路由
 * 存储和管理用户的题目解析历史
 */
import { Router, type Request, type Response } from 'express'
import type { HistoryItem, SolveResult } from '../types/index.js'

const router = Router()

// 内存存储：历史记录
const historyStore: HistoryItem[] = []

// 生成历史记录ID
function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** 模拟的历史数据 */
function initMockHistory(): void {
  const mockItems: HistoryItem[] = [
    {
      id: 'hist_001',
      problemText: '已知效用函数 U(x,y) = x^0.5 y^0.5，Px=2, Py=3, M=120，求最优消费束',
      problemType: 'calculation',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'hist_002',
      problemText: '证明在完全竞争市场中，长期均衡时厂商经济利润为零',
      problemType: 'proof',
      status: 'completed',
      createdAt: '2024-01-14T14:20:00Z'
    },
    {
      id: 'hist_003',
      problemText: '分析IS-LM模型中货币政策的有效性及其局限性',
      problemType: 'analysis',
      status: 'completed',
      createdAt: '2024-01-13T09:15:00Z'
    },
    {
      id: 'hist_004',
      problemText: '设Cobb-Douglas生产函数 Q=K^0.3 L^0.7，求成本最小化的要素投入比例',
      problemType: 'calculation',
      status: 'completed',
      createdAt: '2024-01-12T16:45:00Z'
    },
    {
      id: 'hist_005',
      problemText: '推导菲利普斯曲线的现代形式并解释其政策含义',
      problemType: 'analysis',
      status: 'failed',
      createdAt: '2024-01-11T11:00:00Z'
    }
  ]

  historyStore.push(...mockItems)
}

// 初始化模拟数据
initMockHistory()

/**
 * GET /api/history - 获取历史记录列表
 * 支持分页查询
 */
router.get('/', (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const type = req.query.type as string

  // 过滤（按题目类型）
  let filteredHistory = [...historyStore]
  if (type) {
    filteredHistory = filteredHistory.filter(item => item.problemType === type)
  }

  // 按时间倒序排列
  filteredHistory.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // 分页
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = filteredHistory.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      items: paginatedItems,
      total: filteredHistory.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredHistory.length / pageSize)
    }
  })
})

/**
 * GET /api/history/:id - 获取历史记录详情
 */
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const item = historyStore.find(h => h.id === id)

  if (!item) {
    res.status(404).json({
      success: false,
      error: '历史记录不存在'
    })
    return
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * DELETE /api/history/:id - 删除历史记录
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const index = historyStore.findIndex(h => h.id === id)

  if (index === -1) {
    res.status(404).json({
      success: false,
      error: '历史记录不存在'
    })
    return
  }

  historyStore.splice(index, 1)

  res.json({
    success: true,
    message: '历史记录已删除'
  })
})

export default router
