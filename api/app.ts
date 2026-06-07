/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import ocrRoutes from './routes/ocr.js'
import solveRoutes from './routes/solve.js'
import templateRoutes from './routes/templates.js'
import historyRoutes from './routes/history.js'
import settingsRoutes from './routes/settings.js'
import latexRoutes from './routes/latex.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()
const PORT = Number(process.env.PORT) || 3001

// ==================== 中间件 ====================
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ==================== 生产环境：提供前端静态文件 ====================
if (process.env.NODE_ENV === 'production') {
  // 前端构建产物在项目根目录的 dist/ 下（Docker 构建时生成）
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))

  // SPA fallback：所有非 API / 非静态文件的请求返回 index.html
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/solve', solveRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/latex', latexRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
