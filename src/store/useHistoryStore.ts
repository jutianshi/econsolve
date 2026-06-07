import { create } from 'zustand';
import type { HistoryItem } from '@/types';

interface HistoryState {
  historyItems: HistoryItem[];
  isLoading: boolean;
  fetchHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

// 模拟历史记录数据
const mockHistoryItems: HistoryItem[] = [
  {
    id: '1',
    problemContent: '假设某完全竞争市场中，厂商的成本函数为 TC = Q³ - 6Q² + 20Q + 100，求该厂商的短期供给曲线。',
    problemType: 'calculation',
    modelUsed: 'gpt-4o',
    templateUsed: '通用经济学模板',
    status: 'completed',
    createdAt: '2025-06-07T14:30:00Z',
  },
  {
    id: '2',
    problemContent: '解释IS-LM模型中货币政策传导机制，并分析在流动性陷阱中为何货币政策失效。',
    problemType: 'essay',
    modelUsed: 'claude-3.7-sonnet',
    templateUsed: '通用经济学模板',
    status: 'completed',
    createdAt: '2025-06-07T13:15:00Z',
  },
  {
    id: '3',
    problemContent: '已知消费者效用函数为 U(X,Y) = X^0.5 * Y^0.5，收入I=100，价格Px=4，Py=6，求最优消费组合。',
    problemType: 'calculation',
    modelUsed: 'deepseek-r1',
    templateUsed: '计算题专用模板',
    status: 'completed',
    createdAt: '2025-06-06T16:45:00Z',
  },
  {
    id: '4',
    problemContent: '证明：在完全竞争市场长期均衡时，厂商的经济利润为零。',
    problemType: 'proof',
    modelUsed: 'o3-mini',
    templateUsed: '证明题模板',
    status: 'analyzing',
    createdAt: '2025-06-06T15:20:00Z',
  },
  {
    id: '5',
    problemContent: '关于GDP核算方法，以下说法正确的是：A) 支出法包括C+I+G+NX B) 收入法只计算工资收入 C) 生产法适用于所有行业 D) 以上都对',
    problemType: 'choice',
    modelUsed: 'gpt-4o',
    templateUsed: '选择题快速解析模板',
    status: 'completed',
    createdAt: '2025-06-05T10:00:00Z',
  },
];

export const useHistoryStore = create<HistoryState>((set) => ({
  historyItems: [],
  isLoading: false,

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      // 使用模拟数据
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ historyItems: mockHistoryItems, isLoading: false });
    } catch (error) {
      console.error('获取历史记录失败:', error);
      set({ isLoading: false });
    }
  },

  deleteHistoryItem: async (id: string) => {
    try {
      set((state) => ({
        historyItems: state.historyItems.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  },
}));
