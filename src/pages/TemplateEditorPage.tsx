import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Play, HelpCircle, ArrowLeft, Code, Eye } from 'lucide-react';

interface TemplateData {
  name: string;
  description: string;
  category: 'general' | 'calculation' | 'proof' | 'choice' | 'custom';
  content: string;
}

const defaultTemplate: TemplateData = {
  name: '',
  description: '',
  category: 'general',
  content: `## 题目分析

### 题目类型
{{problemType}}

### 知识点
{{knowledgePoints}}

### 已知条件
{{knownConditions}}

### 求解目标
{{solveTarget}}

## 详细解答

{{solution}}`,
};

const variables = [
  { name: '{{problemType}}', desc: '题目类型' },
  { name: '{{knowledgePoints}}', desc: '知识点列表' },
  { name: '{{knownConditions}}', desc: '已知条件' },
  { name: '{{solveTarget}}', desc: '求解目标' },
  { name: '{{solution}}', desc: '解答内容' },
  { name: '{{conditions}}', desc: '计算条件' },
  { name: '{{formulas}}', desc: '相关公式' },
  { name: '{{calculation}}', desc: '计算过程' },
  { name: '{{conclusion}}', desc: '结论' },
];

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [template, setTemplate] = useState<TemplateData>(defaultTemplate);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      // 加载现有模板数据（模拟）
      console.log('Loading template:', id);
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => ({
      ...prev,
      content:
        prev.content.slice(0, prev.content.length) + variable,
    }));
    // 实际应该插入到光标位置，这里简化处理
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">
              {isNew ? '创建新模板' : '编辑模板'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isNew ? '设计自定义的解析输出格式' : '修改模板内容和配置'}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showPreview
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !template.name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : saved ? (
              <>
                ✓ 已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存模板
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧 - 基本信息 */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-display font-semibold text-primary mb-4">基本信息</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) =>
                    setTemplate({ ...template, name: e.target.value })
                  }
                  placeholder="例如：微观经济学综合模板"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  描述说明
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) =>
                    setTemplate({ ...template, description: e.target.value })
                  }
                  placeholder="简要描述这个模板的用途和适用场景..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  分类
                </label>
                <select
                  value={template.category}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      category: e.target.value as TemplateData['category'],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="general">通用</option>
                  <option value="calculation">计算题</option>
                  <option value="proof">证明题</option>
                  <option value="choice">选择题</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
            </div>
          </div>

          {/* 变量帮助 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="font-display font-semibold text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                可用变量
              </h3>
              <ChevronIcon open={showVariables} />
            </button>

            {showVariables && (
              <div className="mt-4 space-y-2 animate-fade-in">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-accent/10 rounded-lg transition-colors group"
                  >
                    <code className="text-sm font-mono text-primary">{v.name}</code>
                    <span className="text-xs text-gray-500 group-hover:text-primary">{v.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 编辑器 / 预览 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {showPreview ? '预览模式' : '编辑模式'}
              </span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-primary hover:underline"
            >
              {showPreview ? '返回编辑' : '查看预览'}
            </button>
          </div>

          {showPreview ? (
            <div className="p-6 min-h-[500px] prose prose-sm max-w-none paper-texture m-0" dangerouslySetInnerHTML={{
              __html: formatMarkdown(template.content),
            }} />
          ) : (
            <textarea
              value={template.content}
              onChange={(e) =>
                setTemplate({ ...template, content: e.target.value })
              }
              placeholder="在此编写模板内容..."
              className="w-full min-h-[500px] p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function formatMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-display font-semibold text-primary mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-display font-bold text-primary mt-6 mb-3">$1</h2>')
    .replace(/\{\{(.*?)\}\}/g, '<code class="px-2 py-0.5 bg-accent/20 text-accent-dark rounded text-sm">{{$1}}</code>')
    .replace(/\n/g, '<br />');
}
