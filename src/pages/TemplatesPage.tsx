import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore } from '@/store/useTemplateStore';
import TemplateCard from '@/components/template/TemplateCard';
import { Plus, Search, Filter, Grid3X3, List } from 'lucide-react';
import { useState } from 'react';

export default function TemplatesPage() {
  const { templates, isLoading, fetchTemplates } = useTemplateStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // 筛选模板
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'general', label: '通用' },
    { value: 'calculation', label: '计算题' },
    { value: 'proof', label: '证明题' },
    { value: 'choice', label: '选择题' },
    { value: 'custom', label: '自定义' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary mb-2">模板管理中心</h1>
          <p className="text-gray-600">管理和创建题目解析模板，定制输出格式</p>
        </div>

        <button
          onClick={() => navigate('/templates/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          创建新模板
        </button>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* 视图切换 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={(id) => navigate(`/templates/${id}/edit`)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={(id) => navigate(`/templates/${id}/edit`)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-display font-semibold text-gray-600 mb-2">未找到模板</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterCategory !== 'all'
              ? '尝试调整搜索条件'
              : '点击上方按钮创建第一个模板'}
          </p>
        </div>
      )}

      {/* 统计信息 */}
      {!isLoading && templates.length > 0 && (
        <div className="mt-8 px-6 py-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>共 {filteredTemplates.length} 个模板</span>
            <span>{templates.filter((t) => t.isPreset).length} 个预设 · {templates.filter((t) => !t.isPreset).length} 个自定义</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 需要导入 FileText 图标
import { FileText } from 'lucide-react';
