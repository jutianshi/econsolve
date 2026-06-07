import { create } from 'zustand';
import type { Template } from '@/types';

interface TemplateState {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  fetchTemplates: () => Promise<void>;
  selectTemplate: (id: string) => void;
}

// 模拟数据
const mockTemplates: Template[] = [
  {
    id: '1',
    name: '通用经济学模板',
    description: '适用于大多数经济学题目的通用解析模板，包含完整的分析框架和解答步骤。',
    category: 'general',
    isPreset: true,
    content: '## 题目分析\n\n### 题目类型\n{{problemType}}\n\n### 知识点\n{{knowledgePoints}}\n\n### 已知条件\n{{knownConditions}}\n\n### 求解目标\n{{solveTarget}}\n\n## 详细解答\n\n{{solution}}',
    variableCount: 4,
    usageCount: 156,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '计算题专用模板',
    description: '专门针对计算类经济学习题的模板，强调公式推导和数值计算过程。',
    category: 'calculation',
    isPreset: true,
    content: '## 计算步骤\n\n### 步骤1：明确已知条件\n{{conditions}}\n\n### 步骤2：列出相关公式\n{{formulas}}\n\n### 步骤3：代入计算\n{{calculation}}\n\n### 步骤4：得出结论\n{{conclusion}}',
    variableCount: 4,
    usageCount: 89,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: '证明题模板',
    description: '适用于需要逻辑证明的经济学问题，包含严谨的证明结构。',
    category: 'proof',
    isPreset: true,
    content: '## 证明过程\n\n### 命题陈述\n{{statement}}\n\n### 证明思路\n{{approach}}\n\n### 详细证明\n{{proof}}\n\n### 结论\n{{conclusion}}',
    variableCount: 4,
    usageCount: 45,
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: '4',
    name: '选择题快速解析模板',
    description: '针对选择题的快速解析模板，突出关键考点和解题技巧。',
    category: 'choice',
    isPreset: true,
    content: '## 选择题解析\n\n### 题目要点\n{{keyPoints}}\n\n### 选项分析\n{{optionAnalysis}}\n\n### 正确答案及理由\n{{answer}}',
    variableCount: 3,
    usageCount: 234,
    createdAt: '2025-02-15T00:00:00Z',
  },
  {
    id: '5',
    name: '微观经济学综合模板',
    description: '用户自定义模板 - 微观经济学综合应用场景',
    category: 'custom',
    isPreset: false,
    content: '## 微观经济学分析\n\n{{customContent}}',
    variableCount: 1,
    usageCount: 12,
    createdAt: '2025-03-01T00:00:00Z',
  },
];

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,

  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      // 使用模拟数据（实际项目中应该调用API）
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ templates: mockTemplates, isLoading: false });
    } catch (error) {
      console.error('获取模板列表失败:', error);
      set({ isLoading: false });
    }
  },

  selectTemplate: (id: string) => {
    const { templates } = useTemplateStore.getState();
    const template = templates.find((t) => t.id === id) || null;
    set({ selectedTemplate: template });
  },
}));
