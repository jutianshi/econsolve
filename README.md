# EconSolve - 智能经济学解析助手

> 面向考研辅导的经济学题目智能解析 Web 应用，基于多 Agent 协作架构，支持 OCR 识别、深度推理、LaTeX 代码生成。

---

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
  - [首页](#1-首页)
  - [解析工作台（核心）](#2-解析工作台核心)
  - [模板管理](#3-模板管理)
  - [历史记录](#4-历史记录)
  - [系统设置](#5-系统设置)
- [多 Agent 架构](#multi-agent-架构)
- [LLM 配置说明](#llm-配置说明)
- [快捷键列表](#快捷键列表)
- [导出功能](#导出功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **OCR 智能识别** | 支持图片上传/拖拽/粘贴，优先使用多模态 LLM 视觉识别，Tesseract.js 兜底 |
| **多 Agent 管道** | 5 个专业 Agent 串联：OCR → 分析 → 推理 → LaTeX → 质检 |
| **三平台 LLM 支持** | OpenAI / Anthropic / DeepSeek，支持自定义 Base URL |
| **LaTeX 代码生成** | 符合学术规范的 LaTeX 输出，含语法高亮和预览 |
| **KaTeX 公式渲染** | 实时渲染数学公式，支持行内和块级公式 |
| **模板系统** | 预设 + 自定义输出模板，适配不同场景 |
| **导出功能** | 支持 .tex 文件下载、Markdown 导出、打印/全屏查看 |
| **演示模式** | 未配置 API 密钥时自动进入演示模式，体验完整流程 |

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 克隆项目
cd d:\自动化题目解析

# 2. 安装依赖
npm install

# 3. 启动开发环境（前后端同时运行）
npm run dev
```

启动后：
- 前端地址：http://localhost:5174（或 Vite 分配的端口）
- 后端地址：http://localhost:3001

### 单独启动

```bash
# 仅前端
npm run client:dev

# 仅后端
npm run server:dev
```

---

## 使用指南

### 1. 首页

访问应用后首先看到首页，包含：

- **品牌区域**：应用名称和简介，带逐词淡入动画
- **快速上传区**：点击或拖拽题目图片，直接跳转到解析页
- **统计数据**：展示支持的考点数量、覆盖范围、准确率等
- **快捷入口卡片**：一键跳转到 解析 / 模板 / 历史 / 设置
- **核心能力介绍**：智能识别 → 深度分析 → 专业输出

### 2. 解析工作台（核心）

这是应用的核心操作页面，分为三栏布局：

#### 左栏 — 题目输入

**两种输入模式：**

| 模式 | 操作方式 | 说明 |
|------|----------|------|
| **文本输入** | 直接在文本框中输入或粘贴题目内容 | 支持 Ctrl+V 粘贴，实时显示字符数 |
| **图片上传** | 点击选择文件、拖拽图片到区域、或 Ctrl+V 粘贴截图 | 自动触发 OCR 识别 |

**OCR 识别流程：**
1. 上传图片后自动开始识别
2. 进度条实时显示识别进度
3. 识别完成后显示置信度和预览文本
4. 文本自动填入上方输入框，可编辑修正

#### 中栏 — 解析配置

- **模型选择**：从已配置的 LLM 中选择（需先在设置中配置）
- **模板选择**：选择输出格式模板（通用标准 / 计算题 / 证明题等）
- **详细程度**：简洁 / 标准（推荐） / 详细
- **进度指示器**：实时显示 5 个 Agent 的执行状态和耗时
- **操作按钮**：「开始解析」→ 处理中... → 「重新开始」

#### 右栏 — 解析结果

完成后以 **Tab 标签页** 形式展示三个视图：

##### Tab 1: 题目分析

| 展示项 | 说明 |
|--------|------|
| 题目类型 | 计算题 / 证明题 / 选择题 等（彩色 Badge） |
| 难度等级 | 基础(绿) / 中等(黄) / 困难(红) |
| 知识点 | Pill 标签，点击可复制 |
| 已知条件 | 卡片式列表，每条独立展示，公式自动渲染 |
| 求解目标 | 渐变背景高亮强调 |
| 原始 JSON | 可折叠查看结构化数据（语法着色） |

##### Tab 2: 详细解答

- **主内容区**：完整 Markdown 渲染的解答文本
- **分步解析**：每个步骤独立卡片，含序号徽章、标题、详细说明、公式
  - 公式区域悬停显示「复制」按钮
  - 步骤间虚线连接
- **其他解法**：可展开的备选方案（如间接效用函数法）
- **常见易错点**：警告色卡片展示易错提醒

##### Tab 3: LaTeX 代码

- **源码视图**：
  - 完整语法高亮（命令/环境/数学符号不同颜色）
  - 一键复制（点击后显示"已复制!"反馈）
- **预览视图**：
  - KaTeX 实时渲染预览
  - 「新窗口预览」按钮（打开完整 HTML 页面）
- **验证结果**：
  - 通过/失败状态卡片
  - 错误详情（行号 + 描述 + 建议）
  - 警告信息列表

#### 底部工具栏

| 按钮 | 功能 |
|------|------|
| **复制解答** | 将完整解答文本复制到剪贴板 |
| **下载 .tex** | 下载 LaTeX 源码文件 |
| **导出 Markdown** | 导出为 .md 格式文件 |
| **全屏查看** | 调用打印预览/全屏模式 |
| **重新生成** | 使用相同题目重新执行解析 |

### 3. 模板管理

- 浏览预设模板库（通用 / 计算 / 证明 / 选择）
- 查看模板详情和使用次数
- 创建和编辑自定义模板
- 设置默认模板

### 4. 历史记录

- 按时间倒序排列所有解析任务
- 显示题目摘要、类型、使用的模型和模板
- 点击可查看完整结果
- 支持删除历史记录

### 5. 系统设置

#### API 密钥管理

1. 点击「添加配置」
2. 选择平台（OpenAI / Anthropic / DeepSeek）
3. 选择具体模型
4. 输入 API Key（可选填写自定义 Base URL 用于代理）
5. 点击确认添加
6. 点击 ⚡ 图标测试连接
7. 点击 ⊙ 图标设为默认

**支持的平台和模型：**

| 平台 | 推荐模型 | 特性 |
|------|----------|------|
| OpenAI | GPT-4o, o3-mini | 多模态 + 强推理 |
| Anthropic | Claude 3.7 Sonnet | Extended Thinking |
| DeepSeek | R1, V4-Pro | 推理能力强 + 性价比高 |

#### 高级选项

| 选项 | 说明 |
|------|------|
| **推理强度** | 低（快速）/ 中（推荐）/ 高（深度思考） |
| **最大重试** | 1-3 轮（质检不通过时重做） |
| **输出详细程度** | 简洁 / 标准 / 详细 |
| **输出语言** | 中文（简体） / English |

---

## Multi-Agent 架构

```
┌─────────────┐
│ Orchestrator │ ← 编排器，协调整个流程
│  (编排器)    │
└──────┬───────┘
       │
       ▼
┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐
│ OCR_Agent│ → │ Analysis  │ → │ Reasoning│ → │  LaTeX   │ → │QualityCheck│
│ (识别)    │   │_Agent    │   |_Agent    │   |_Agent    │   |_Agent     │
│          │   │ (分析)    │   │ (推理)    │   │ (生成)    │   │ (质检)    │
└──────────┘   └───────────┘   └──────────┘   └──────────┘   └───────────┘
```

**每道题独立走完整个管道（单题单请求），所有推理类 Agent 先"深度思考"再输出。**

**质量检验不通过时自动打回重做（最多 2 轮）。**

---

## LLM 配置说明

### 多模态 OCR 识别

当配置了 LLM API 密钥后，OCR 功能会**优先使用多模态 LLM 视觉能力**进行图片文字识别：

- **优势**：准确率高、支持手写体、自动将数学公式转为 LaTeX 格式
- **兜底**：LLM 不可用时自动降级为 Tesseract.js 本地识别

### 自定义 Base URL

如果需要通过代理访问 API（如国内网络环境），可在添加配置时填写自定义 Base URL：

```
# OpenAI 代理示例
https://api.openai-proxy.com/v1

# DeepSeek 官方
https://api.deepseek.com
```

---

## 快捷键列表

| 快捷键 | 功能 | 生效位置 |
|--------|------|----------|
| `Ctrl + Enter` | 提交解析 | 解析页面 |
| `Ctrl + Shift + C` | 复制解答结果 | 解析页面 |
| `Escape` | 重置当前任务 | 解析页面 |
| `Ctrl + S` | 保存/导出 | 全局 |

> 快捷键功能由 `useKeyboardShortcut` Hook 提供，可在输入框外正常使用。

---

## 导出功能

### 下载 LaTeX 文件

点击工具栏「下载 .tex」按钮，获取可直接编译的 LaTeX 源码。

```latex
% 导言区建议添加
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{geometry}
\geometry{a4paper, margin=1in}
```

### 导出 Markdown

点击「导出 Markdown」获取 `.md` 格式文件，兼容 Typora、Obsidian 等编辑器。

### 打印 / 全屏查看

点击「全屏查看」调用浏览器打印预览，可选择：
- 保存为 PDF
- 直接打印

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript + Vite 6 |
| **UI 样式** | Tailwind CSS 3 + 自定义设计系统 |
| **状态管理** | Zustand 5 |
| **路由** | React Router v7 |
| **图标** | Lucide React |
| **后端框架** | Express 4.x + TypeScript + tsx |
| **LLM 客户端** | 统一封装层（OpenAI / Claude / DeepSeek） |
| **OCR 方案** | 多模态 LLM Vision（主）+ Tesseract.js（兜底） |
| **公式渲染** | KaTeX (CDN) |
| **构建工具** | Vite + PostCSS + Autoprefixer |

### 设计规范

- **主题色**：深靛蓝 `#1e3a5f`
- **强调色**：琥珀金 `#d4a574`
- **成功色**：青绿 `#4ecdc4`
- **危险色**：珊瑚红 `#ff6b6b`
- **标题字体**：Georgia（衬线体，学术气质）
- **正文字体**：Noto Sans SC / Source Han Sans CN
- **代码字体**：JetBrains Mono / Fira Code

---

## 项目结构

```
d:\自动化题目解析/
├── api/                          # 后端代码
│   ├── routes/
│   │   ├── solve.ts              # 解析主路由（含演示管道）
│   │   ├── ocr.ts                # OCR 路由（LLM+Tesseract双引擎）
│   │   └── settings.ts           # 设置路由
│   ├── services/
│   │   ├── llmClient.ts          # 统一 LLM 客户端（580行）
│   │   └── agents/
│   │       ├── orchestrator.ts   # 编排器
│   │       ├── ocrAgent.ts       # OCR Agent
│   │       ├── analysisAgent.ts  # 分析 Agent
│   │       ├── reasoningAgent.ts # 推理 Agent
│   │       ├── latexAgent.ts     # LaTeX Agent
│   │       └── qualityCheckAgent.ts # 质检 Agent
│   ├── core/
│   │   └── prompts.ts            # 6套 Prompt 模板
│   ├── types/                    # 后端类型定义
│   └── app.ts                    # Express 入口
├── src/
│   ├── components/
│   │   ├── layout/               # 布局组件
│   │   │   ├── MainLayout.tsx    # 主布局（侧边栏+顶栏+内容区）
│   │   │   ├── Sidebar.tsx       # 侧边导航（带指示条动画）
│   │   │   └── Header.tsx        # 顶栏（面包屑+用户头像）
│   │   ├── solve/                # 解析相关组件
│   │   │   ├── ResultPanel.tsx   # 结果面板（Tab切换+工具栏）
│   │   │   ├── SolutionView.tsx  # 详细解答（增强Markdown渲染）
│   │   │   ├── LatexCodeView.tsx # LaTeX代码（语法高亮+预览）
│   │   │   ├── AnalysisView.tsx  # 题目分析（彩色Badge+卡片）
│   │   │   ├── ProgressIndicator.tsx # Agent管道可视化
│   │   │   ├── ModelSelector.tsx # 模型选择器
│   │   │   └── TemplateSelector.tsx # 模板选择器
│   │   ├── upload/
│   │   │   └── ImageUploader.tsx # 图片上传+OCR
│   │   └── ui/
│   │       └── Toast.tsx         # 全局Toast通知
│   ├── pages/
│   │   ├── HomePage.tsx          # 首页（统计动画+特性展示）
│   │   ├── SolvePage.tsx         # 解析工作台（三栏布局）
│   │   ├── TemplatesPage.tsx     # 模板管理
│   │   ├── TemplateEditorPage.tsx # 模板编辑器
│   │   ├── HistoryPage.tsx       # 历史记录
│   │   └── SettingsPage.tsx      # 设置中心（LLM配置）
│   ├── store/
│   │   ├── useSolveStore.ts      # 解析状态管理
│   │   ├── useSettingsStore.ts   # 设置状态管理
│   │   ├── useTemplateStore.ts   # 模板状态管理
│   │   └── useHistoryStore.ts     # 历史状态管理
│   ├── services/
│   │   └── api.ts                # API 服务层
│   ├── hooks/
│   │   └── useKeyboardShortcut.ts # 键盘快捷键Hook
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── App.tsx                   # 路由配置
│   ├── main.tsx                  # 应用入口
│   └── index.css                 # 全局样式（730行，含暗色模式）
├── index.html                    # HTML入口（含KaTeX CDN）
├── tailwind.config.js            # Tailwind配置（扩展阴影/动画/圆角）
├── vite.config.ts                # Vite配置（代理/API转发）
├── package.json                  # 项目依赖
└── tsconfig.json                 # TypeScript配置
```

---

## 常见问题

### Q: 上传图片后报 500 错误？

**A:** OCR 路由已升级为双引擎架构：
1. 优先使用多模态 LLM 视觉识别（需配置 API 密钥）
2. 自动降级为 Tesseract.js 本地识别

请确保后端服务正在运行（`npm run server:dev`），且至少有一种 OCR 引擎可用。

### Q: 点击「开始解析」提示"获取任务失败"？

**A:** 这是正常行为——系统会在未配置 LLM 密钥时自动进入**演示模式**，展示完整的模拟数据。如需真实解析，请先在「设置」页面配置 API 密钥。

### Q: 如何使用自己的 LLM API？

1. 打开「设置」页面
2. 点击「添加配置」
3. 选择平台并填写 API Key
4. 选择模型
5. （可选）填写自定义 Base URL
6. 点击「确认添加」，再点击 ⚡ 测试连接
7. 点击 ⊙ 设为默认配置

### Q: 支持哪些模型？

| 平台 | 支持模型 |
|------|----------|
| OpenAI | gpt-4o, o3-mini, o3, 及其他 GPT 系列 |
| Anthropic | claude-3.7-sonnet, claude-3.5-sonnet, claude-opus |
| DeepSeek | deepseek-r1, deepseek-v4-pro, deepseek-chat |

### Q: 解析结果不准确怎么办？

1. 尝试将「推理强度」调为「高」（深度思考模式）
2. 将「详细程度」调为「详细」
3. 检查题目描述是否完整清晰
4. 尝试更换不同的 LLM 模型
5. 点击「重新生成」再次解析

### Q: 生成的 LaTeX 代码如何使用？

1. 点击「下载 .tex」获取源码
2. 在导言区添加 `\usepackage{amsmath}` 和 `\usepackage{amssymb}`
3. 使用 XeLaTeX 或 pdfLaTeX 编译
4. 可嵌入任何标准 LaTeX 模板中使用

### Q: 数据存储在哪里？

当前版本使用**内存存储**（重启后数据丢失）。生产环境建议接入数据库。

---

## 版本信息

- **版本**: v1.0.0
- **更新日期**: 2025-06
- **适用场景**: 考研经济学辅导、习题解析、学术写作辅助

---

*EconSolve - 让经济学题目解析更智能、更专业*
