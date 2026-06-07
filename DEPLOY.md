# EconSolve 部署指南

> 将你的 EconSolve 应用部署到公网服务器，让任何人通过网址访问使用。

---

## 目录

- [部署方案对比](#部署方案对比)
- [方案一：Docker 部署（推荐）](#方案一docker-部署推荐)
- [方案二：Railway / Render 一键部署](#方案二railway--render-一键部署)
- [方案三：Vercel Serverless 部署](#方案三vercel-serverless-部署)
- [方案四：云服务器手动部署](#方案四云服务器手动部署)
- [域名与 HTTPS 配置](#域名与-https-配置)
- [部署后验证清单](#部署后验证清单)

---

## 部署方案对比

| 方案 | 难度 | 费用 | 适用场景 | 特点 |
|------|------|------|----------|------|
| **Docker** | 中 | 取决于服务器 | 有自己的服务器/云主机 | 最灵活、可迁移 |
| **Railway/Render** | 低 | $5-20/月 | 快速上线、不想折腾服务器 | Git Push 自动部署 |
| **Vercel** | 最低 | 免费额度够用 | 前端为主、轻量API | 零配置、全球CDN |
| **云服务器(PM2)** | 中高 | ¥50-200/月 | 国内用户访问快 | 完全控制、需运维 |

**推荐路线：**
- 想最快体验 → **Vercel**（5分钟搞定）
- 长期稳定运行 → **Docker + 云服务器**
- 不想管服务器 → **Railway**

---

## 方案一：Docker 部署（推荐）

适用于：任何安装了 Docker 的 Linux 服务器（阿里云ECS、腾讯云CVM、本地机器等）

### 前提条件

```bash
# 服务器上已安装 Docker 和 Docker Compose
docker --version          # >= 20.10
docker compose version    # >= 2.0
```

### 步骤 1：上传代码到服务器

**方式 A — 通过 Git（推荐）：**

```bash
# 在你的电脑上，先将代码推送到 GitHub/Gitee
git init
git add .
git commit -m "初始版本"
git remote add origin https://github.com/你的用户名/econsolve.git
git push -u origin main

# 然后在服务器上克隆
ssh your-server-ip
git clone https://github.com/你的用户名/econsolve.git
cd econsolve
```

**方式 B — 直接上传文件：**

```bash
# 在本地打包项目（排除 node_modules）
cd d:\自动化题目解析
tar --exclude='node_modules' --exclude='.git' -czvf econsolve.tar.gz .

# 上传到服务器
scp econsolve.tar.gz user@your-server-ip:/home/user/
ssh your-server-ip
cd /home/user
tar -xzvf econsolve.tar.gz
mv econsolve econsolve-app
cd econsolve-app
```

### 步骤 2：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量，填入你的 API Key
nano .env
```

`.env` 文件内容：

```env
PORT=3001
NODE_ENV=production

# 至少填一个 LLM API Key（不填也能跑，但只能用演示模式）
OPENAI_API_KEY=sk-your-key-here
# 或 DEEPSEEK_API_KEY=sk-your-key-here
```

### 步骤 3：一键构建并启动

```bash
# 方式 A：使用 docker-compose（推荐）
docker compose up -d --build

# 方式 B：直接用 Docker
docker build -t econsolve .
docker run -d \
  --name econsolve \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  econsolve
```

### 步骤 4：验证运行

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f econsolve-app

# 测试健康检查
curl http://localhost:3001/api/health
# 应返回: {"success":true,"message":"ok"}
```

此时访问 `http://你的服务器IP:3001` 即可看到应用！

### 常用管理命令

```bash
# 查看日志
docker logs -f econsolve-app

# 重启应用
docker compose restart

# 更新部署（修改代码后）
git pull && docker compose up -d --build

# 停止服务
docker compose down

# 进入容器调试
docker exec -it econsolve-app sh
```

---

## 方案二：Railway / Render 一键部署

适用于：不想管理服务器，Git Push 即自动部署

### Railway 部署（推荐）

1. **注册账号** → https://railway.app （支持 GitHub 登录）

2. **新建项目** → 点击 "Deploy from GitHub repo"

3. **选择你的仓库**

4. **Railway 会自动检测到 Node.js 项目**，点击 "Deploy Now"

5. **设置环境变量**：
   - 在 Railway Dashboard → Variables 中添加：
   ```
   NODE_ENV = production
   OPENAI_API_KEY = sk-xxx (可选)
   ```

6. **设置端口**：在 Settings 中确认 Port 为 `3001`

7. **点击 Deploy**，等待 2-3 分钟

8. **完成！** Railway 会分配一个 `https://xxx.up.railway.app` 的公网地址

### Render 部署

1. 注册 → https://render.com

2. New → Web Service → 连接 GitHub 仓库

3. 配置：
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free（免费）或 Standard ($7/月起）

4. Environment Variables 中添加 API Keys

5. 点击 "Create Web Service"，自动部署

6. 分配 `https://xxx.onrender.com` 地址

---

## 方案三：Vercel Serverless 部署

适用于：想用免费额度、前端为主的应用

> 你的项目已有 `@vercel/node` 入口（`api/index.ts`），天然适配 Vercel。

### 步骤

1. **安装 Vercel CLI**（或使用网页版）

```bash
npm i -g vercel
```

2. **在项目根目录创建 `vercel.json``：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

3. **部署**：

```bash
# 在项目根目录执行
vercel

# 按提示操作：
# - 选择项目
# - 确认设置
# - 完成！获得一个 *.vercel.app 的地址
```

4. **设置环境变量**：

```bash
# 在 Vercel Dashboard → Settings → Environment Variables 中添加
vercel env add OPENAI_API_KEY production
vercel env add NODE_ENV production
```

5. **重新部署使环境变量生效**：

```bash
vercel --prod
```

**注意**：Vercel 免费版有 Serverless Function 执行时间限制（10秒），LLM 调用可能超时。建议用于演示模式或轻量场景。

---

## 方案四：云服务器手动部署

适用于：国内服务器、需要完全控制

### 以阿里云 ECS / 腾讯云 CVM 为例

#### 1. 购买服务器

| 配置 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB |
| 硬盘 | 40 GB SSD | 40 GB SSD |
| 系统 | Ubuntu 22.04 / CentOS 8 | 同左 |
| 带宽 | 1 Mbps | 3 Mbps |
| 价格 | 约 ¥50/月 | 约 ¥100/月 |

#### 2. 服务器初始化

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 更新系统
apt update && apt upgrade -y    # Ubuntu
# 或 yum update -y               # CentOS

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PM2（进程管理器，自动重启）
npm install -g pm2

# 安装 Nginx（反向代理）
apt install -y nginx

# 安装 Tesseract（OCR 依赖）
apt install -y tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng
```

#### 3. 上传并构建项目

```bash
# 创建应用目录
mkdir -p /var/www/econsolve
cd /var/www/econsolve

# 上传代码（从本地上传）
# 在你本地电脑执行：
scp -r d:\自动化题目解析/* root@服务器IP:/var/www/econsolve/

# 或者在服务器上 git clone
git clone https://github.com/你的用户名/econsolve.git .
```

```bash
# 安装依赖 & 构建
npm install --omit=dev
npm run build

# 配置环境变量
cp .env.example .env
nano .env   # 填入 API Key
```

#### 4. 用 PM2 启动服务

```bash
# 启动应用
pm2 start api/server.js --name econsolve

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 list           # 查看所有应用
pm2 logs econsolve # 查看日志
pm2 restart econsolve  # 重启
pm2 stop econsolve     # 停止
```

#### 5. 配置 Nginx 反向代理

```bash
# 编辑 Nginx 配置
nano /etc/nginx/sites-available/econsolve
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|ico|svg)$ {
        proxy_pass http://127.0.0.1:3001;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/econsolve /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

#### 6. 开放防火墙端口

```bash
# 如果用的是 ufw
ufw allow 80/tcp
ufw allow 443/tcp

# 如果是阿里云/腾讯云，还需在控制台的「安全组」中放行 80 和 443 端口
```

现在访问 `http://你的服务器IP` 即可看到应用！

---

## 域名与 HTTPS 配置

### 申请域名

- 国内：阿里云 / 腾讯云购买域名（.com 约 ¥55/年，.cn 约 ¥28/年）
- 国外：Cloudflare（免费 .cf 域名）、Namecheap

### DNS 解析

在域名服务商添加一条 A 记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 你的服务器IP |
| A | www | 你的服务器IP |

### 免费 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 自动申请证书并配置 Nginx（替换为你的域名）
certbot --nginx -d 你的域名.com -d www.你的域名.com

# 自动续期（Certbot 已自动设置 cron）
certbot renew --dry-run   # 测试续期是否正常
```

完成后即可通过 `https://你的域名.com` 安全访问！

### 使用 Cloudflare（可选，免费 CDN + HTTPS）

1. 注册 Cloudflare → 添加域名
2. 将域名的 NS 服务器改为 Cloudflare 提供的
3. 在 Cloudflare DNS 中添加 A 记录指向服务器 IP
4. 开启 SSL/TLS → "Flexible" 或 "Full" 模式
5. 开启 Cloudflare 的「Always Use HTTPS」

好处：**免费 CDN 加速 + DDoS 防护 + 自动 HTTPS**

---

## 部署后验证清单

部署完成后，逐项检查：

- [ ] 访问首页能正常加载（无白屏、无报错）
- [ ] 输入题目文本 → 点击「开始解析」→ 能看到进度条和结果
- [ ] 上传图片 → OCR 识别成功（如果配了 LLM Key）
- [ ] 切换 Tab（分析/解答/LaTeX）都能正常显示内容
- [ ] 「复制解答」「下载 .tex」按钮可用
- [ ] 移动端打开页面布局正常（响应式）
- [ ] 设置页面可以保存 LLM 配置
- [ ] 域名访问正常（如配置了域名）
- [ ] HTTPS 绿锁显示正常（如配置了 SSL）
- [ ] `curl http://你的地址/api/health` 返回 `{"success":true}`

---

## 架构图

```
                    用户浏览器
                       │
                       ▼
              ┌─────────────────┐
              │   DNS / 域名    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Nginx (可选)    │ ← 反向代理 + SSL 终结
              │  :80 / :443     │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  EconSolve App   │ ← Express + React 静态文件
              │  :3001           │
              ├─────────────────┤
              │  ┌───────┐       │
              │  │ 前端   │ dist │ ← Vite 构建产物
              │  └───────┘       │
              │  ┌───────┐       │
              │  │ API    │       │ ← /api/* 路由
              │  │ Routes │       │
              │  └───┬───┘       │
              │      │            │
              │  ┌───▼───┐       │
              │  │ LLM   │       │ ← OpenAI/Claude/DeepSeek
              │  │ Vision │       │ ← 多模态 OCR
              │  └───────┘       │
              └─────────────────┘
```

---

## 常见问题

### Q: 部署后页面空白？

**A:** 检查以下几点：
1. `npm run build` 是否成功生成了 `dist/` 目录
2. 浏览器 F12 → Console 是否有报错
3. API 路径是否正确（生产环境下前端请求 `/api/*` 应该打到同端口）

### Q: LLM API 调用超时？

**A:**
- Vercel 免费版限制 10 秒，LLM 调用可能不够用 → 换 Railway/自建服务器
- 自建服务器检查 Nginx 的 `proxy_read_timeout` 是否足够大（建议 120s+）

### Q: 如何更新已部署的应用？

**A:**
```bash
# Docker 方式
git pull && docker compose up -d --build

# PM2 方式
git pull && npm install --omit=dev && npm run build && pm2 restart econsolve
```

### Q: 不想暴露 3001 端口，只想用 80/443？

**A:** 用 Nginx 做反代即可（见方案四第5步），只开放 80 和 443 端口。

### Q: 数据会丢失吗？

**A:** 当前版本数据存储在内存中，重启即清空。这是设计如此——每道题独立解析，不需要持久化。未来可接入 Redis/MySQL。
