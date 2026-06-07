import { useSettingsStore } from '@/store/useSettingsStore';
import {
  Key, Plug, Zap, Settings, CheckCircle, XCircle,
  Eye, EyeOff, Radio, Trash2, Plus, Globe, Sliders,
  Sparkles, Brain, Cpu,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { LLMProvider, LLMProviderConfig } from '@/types';
import { getAvailableModels } from '@/services/api';

const providerMeta: Record<LLMProvider, { name: string; icon: React.ElementType; color: string; desc: string }> = {
  openai: { name: 'OpenAI', icon: Sparkles, color: 'bg-emerald-100 text-emerald-600', desc: 'GPT-4o（多模态+推理）、o3 / o3-mini（强推理）' },
  anthropic: { name: 'Anthropic', icon: Brain, color: 'bg-orange-100 text-orange-600', desc: 'Claude 3.5 Sonnet、Claude 3.7 Sonnet（Extended Thinking）' },
  deepseek: { name: 'DeepSeek', icon: Cpu, color: 'bg-blue-100 text-blue-600', desc: 'DeepSeek-V3（快）、R1（推理）、V4-Pro（旗舰全能）' },
};

export default function SettingsPage() {
  const {
    settings, updateSettings, addLlmConfig, removeLlmConfig,
    updateLlmConfig, setActiveConfig, testConnection,
  } = useSettingsStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '', provider: 'openai' as LLMProvider, model: '', apiKey: '', baseUrl: '',
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; time: string }>>({});

  const allModels = useMemo(() => getAvailableModels(), []);

  const modelsForProvider = (provider: LLMProvider) =>
    allModels.filter((m) => m.provider === provider);

  const handleTest = async (config: LLMProviderConfig) => {
    setTestingId(config.id);
    const ok = await testConnection(config);
    setTestingId(null);
    setTestResults((prev) => ({
      ...prev,
      [config.id]: { ok, time: new Date().toLocaleTimeString('zh-CN') },
    }));
  };

  const handleAdd = () => {
    if (!newConfig.apiKey || !newConfig.model) return;
    addLlmConfig({
      name: newConfig.name || `${providerMeta[newConfig.provider].name} - ${newConfig.model}`,
      provider: newConfig.provider,
      apiKey: newConfig.apiKey,
      model: newConfig.model,
      baseUrl: newConfig.baseUrl || undefined,
    });
    setNewConfig({ name: '', provider: 'openai', model: '', apiKey: '', baseUrl: '' });
    setShowAddForm(false);
  };

  const activeConfig = settings.llmConfigs.find((c) => c.id === settings.activeConfigId);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-primary mb-2">大模型配置中心</h1>
        <p className="text-gray-600">管理您的API密钥和模型偏好，支持多平台多Key配置</p>
      </div>

      {/* ===== API 密钥管理区 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-gray-800">API 密钥管理</h3>
              <p className="text-sm text-gray-500">已配置 {settings.llmConfigs.length} 个模型</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加配置
          </button>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <div className="mb-5 p-4 bg-surface rounded-lg border border-gray-200 space-y-3">
            {/* 平台选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">选择平台</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(providerMeta) as LLMProvider[]).map((p) => {
                  const meta = providerMeta[p];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setNewConfig({ ...newConfig, provider: p, model: '' });
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                        newConfig.provider === p ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${newConfig.provider === p ? 'text-primary' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${newConfig.provider === p ? 'text-primary' : 'text-gray-600'}`}>
                        {meta.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 模型选择 + 名称 + API Key + Base URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配置名称</label>
                <input
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="可选，留空自动生成"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择模型</label>
                <select
                  value={newConfig.model}
                  onChange={(e) => setNewConfig({ ...newConfig, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">请选择模型</option>
                  {modelsForProvider(newConfig.provider).map((opt) =>
                    opt.models.map((m) => (
                      <option key={m} value={m}>
                        {m} · {opt.capabilities.recommendedUse}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showKey['new'] ? 'text' : 'password'}
                  value={newConfig.apiKey}
                  onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                  placeholder="输入 API Key"
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => ({ ...prev, new: !prev.new }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自定义 Base URL（可选）</label>
              <input
                value={newConfig.baseUrl}
                onChange={(e) => setNewConfig({ ...newConfig, baseUrl: e.target.value })}
                placeholder="如使用代理，填写自定义地址"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setShowAddForm(false); setNewConfig({ name: '', provider: 'openai', model: '', apiKey: '', baseUrl: '' }); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!newConfig.apiKey || !newConfig.model}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        )}

        {/* 已有配置列表 */}
        {settings.llmConfigs.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-400">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无配置，点击上方按钮添加</p>
          </div>
        )}

        <div className="space-y-3">
          {settings.llmConfigs.map((config) => {
            const meta = providerMeta[config.provider];
            const Icon = meta.icon;
            const testRes = testResults[config.id];
            const isActive = config.id === settings.activeConfigId;

            return (
              <div
                key={config.id}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 平台图标 */}
                  <div className={`w-9 h-9 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 text-sm">{config.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary text-white rounded-full">默认</span>
                      )}
                      {/* 连接状态 */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        testRes?.ok ? 'bg-success' : testRes?.ok === false ? 'bg-danger' : 'bg-gray-300'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {meta.name} · {config.model}
                      {config.baseUrl && ` · 自定义地址`}
                    </p>
                    {testRes?.time && (
                      <p className="text-[10px] text-gray-400 mt-0.5">最后测试: {testRes.time}</p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleTest(config)}
                      disabled={testingId === config.id}
                      className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded"
                      title="测试连接"
                    >
                      {testingId === config.id
                        ? <Plug className="w-4 h-4 animate-spin" />
                        : testRes?.ok
                          ? <CheckCircle className="w-4 h-4 text-success" />
                          : testRes?.ok === false
                            ? <XCircle className="w-4 h-4 text-danger" />
                            : <Plug className="w-4 h-4" />
                      }
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => setActiveConfig(config.id)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded"
                        title="设为默认"
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeLlmConfig(config.id)}
                      className="p-1.5 text-gray-400 hover:text-danger transition-colors rounded"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 默认模型选择区 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-dark" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-800">当前生效配置</h3>
            <p className="text-sm text-gray-500">解析任务将使用的模型</p>
          </div>
        </div>

        {activeConfig ? (() => {
          const meta = providerMeta[activeConfig.provider];
          const Icon = meta.icon;
          return (
            <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-gray-200">
              <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{activeConfig.name}</p>
                <p className="text-sm text-gray-500">{meta.name} · {activeConfig.model}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-success ml-auto" />
            </div>
          );
        })() : (
          <p className="text-sm text-gray-400 py-4 text-center">暂未选择默认配置</p>
        )}
      </div>

      {/* ===== 高级选项区 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-800">高级选项</h3>
            <p className="text-sm text-gray-500">调整推理行为和输出风格</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* 推理强度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">推理强度</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'low', label: '低', desc: '快速响应' },
                { value: 'medium', label: '中（推荐）', desc: '平衡速度与质量' },
                { value: 'high', label: '高', desc: '深度思考，耗时较长' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ reasoningEffort: opt.value })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    settings.reasoningEffort === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 最大重试次数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大重试次数：{settings.maxRetryCount} 轮
            </label>
            <input
              type="range"
              min={1}
              max={3}
              value={settings.maxRetryCount}
              onChange={(e) => updateSettings({ maxRetryCount: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
              <span>1 轮</span><span>2 轮</span><span>3 轮</span>
            </div>
          </div>

          {/* 输出详细程度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">输出详细程度</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'concise', label: '简洁', desc: '核心答案' },
                { value: 'standard', label: '标准（推荐）', desc: '完整步骤' },
                { value: 'detailed', label: '详细', desc: '含拓展内容' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ detailLevel: opt.value })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    settings.detailLevel === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 输出语言 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">输出语言</label>
            <div className="flex gap-3">
              {[
                { value: 'zh-CN', label: '中文（简体）' },
                { value: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => updateSettings({ outputLanguage: lang.value as 'zh-CN' | 'en' })}
                  className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                    settings.outputLanguage === lang.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
