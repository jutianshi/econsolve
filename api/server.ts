/**
 * 独立服务器入口（用于 Docker / 传统服务器部署）
 * 与 Vercel Serverless 入口（api/index.ts）不同，此文件会启动 HTTP 监听
 */
import app from './app.js'

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║   🎓 EconSolve 服务已启动            ║
  ║                                      ║
  ║   地址: http://localhost:${PORT}       ║
  ║   模式: ${process.env.NODE_ENV || 'development'}              ║
  ║                                      ║
  ╚══════════════════════════════════════╝
  `)
})
