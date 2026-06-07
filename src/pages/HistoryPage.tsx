import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/store/useHistoryStore';
import HistoryItemComponent from '@/components/history/HistoryItem';
import { Filter, Trash2, RefreshCw, Download, Calendar, Clock } from 'lucide-react';
import type { ProblemType, TaskStatus } from '@/types';

export default function HistoryPage() {
  const { historyItems, isLoading, fetchHistory, deleteHistoryItem } = useHistoryStore();
  const [filterType, setFilterType] = useState<ProblemType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 筛选历史记录
  const filteredItems = historyItems.filter((item) => {
    const matchType = filterType === 'all' || item.problemType === filterType;
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchType && matchStatus;
  });

  const typeOptions: Array<{ value: ProblemType | 'all'; label: string }> = [
    { value: 'all', label: '全部题型' },
    { value: 'choice', label: '选择题' },
    { value: 'calculation', label: '计算题' },
    { value: 'proof', label: '证明题' },
    { value: 'short_answer', label: '简答题' },
    { value: 'essay', label: '论述题' },
  ];

  const statusOptions: Array<{ value: TaskStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部状态' },
    { value: 'completed', label: '已完成' },
    { value: 'analyzing', label: '分析中' },
    { value: 'solving', label: '解答中' },
    { value: 'failed', label: '失败' },
  ];

  // 统计数据
  const stats = {
    total: historyItems.length,
    completed: historyItems.filter((i) => i.status === 'completed').length,
    failed: historyItems.filter((i) => i.status === 'failed').length,
    processing: historyItems.filter(
      (i) => ['analyzing', 'solving', 'generating', 'validating'].includes(i.status)
    ).length,
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-primary mb-2">历史记录</h1>
        <p className="text-gray-600">查看和管理您的题目解析历史</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-gray-500">总记录数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-success/20 flex items-center justify-center">
            <span className="text-success text-sm">✓</span>
          </div>
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-xs text-gray-500">已完成</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm">⟳</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          <p className="text-xs text-gray-500">处理中</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-danger/20 flex items-center justify-center">
            <span className="text-danger text-sm">×</span>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.failed}</p>
          <p className="text-xs text-gray-500">失败</p>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProblemType | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchHistory}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="pl-8 pb-6 animate-pulse">
              <div className="absolute left-0 top-5 w-6 h-6 rounded-full border-2 border-gray-200 bg-gray-100" />
              <div className="bg-white rounded-xl border border-gray-200 p-4 h-32" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="relative pl-8">
          <div className="absolute left-3 top-6 w-0.5 h-[calc(100%-2rem)] bg-gray-200" />
          {filteredItems.map((item) => (
            <HistoryItemComponent
              key={item.id}
              item={item}
              onDelete={deleteHistoryItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-display font-semibold text-gray-600 mb-2">暂无记录</h3>
          <p className="text-gray-500 mb-6">
            {filterType !== 'all' || filterStatus !== 'all'
              ? '当前筛选条件下没有匹配的记录'
              : '开始解析后，记录将显示在这里'}
          </p>
        </div>
      )}

      {/* 底部操作 */}
      {historyItems.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            显示 {filteredItems.length} / {historyItems.length} 条记录
          </p>
          <button className="flex items-center gap-2 px-4 py-2 text-danger hover:bg-danger/10 rounded-lg transition-colors text-sm">
            <Trash2 className="w-4 h-4" />
            清空所有记录
          </button>
        </div>
      )}
    </div>
  );
}
