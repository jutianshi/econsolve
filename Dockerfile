# ============================================
# EconSolve - 前端构建阶段
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 先复制依赖定义文件，利用Docker缓存
COPY package.json package-lock.json* ./
RUN npm ci

# 复制前端源码并构建
COPY . .
RUN npm run build

# ============================================
# EconSolve - 生产运行阶段
# ============================================
FROM node:20-alpine AS runner

# 安装 tesseract 依赖（OCR兜底方案需要）
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-chi_sim \
    tesseract-ocr-data-eng

WORKDIR /app

# 非root用户运行（安全最佳实践）
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# 复制后端代码和依赖定义
COPY --chown=appuser:appgroup api/ ./api/
COPY package.json package-lock.json* ./

# 安装生产依赖（不含devDependencies）
RUN npm ci --omit=dev && npm cache clean --force

# 从builder阶段复制前端构建产物
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist ./dist

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 3001

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 启动命令：同时提供静态文件(前端) + API服务(后端)
CMD ["node", "api/server.js"]
