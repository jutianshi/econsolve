import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  FileText,
  Clock,
  Settings,
  Upload,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Zap,
  BookOpen,
  Layers,
  Target,
} from 'lucide-react';

// Count-up 动画 Hook
function useCountUp(target: number, duration: number = 2000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startOnMount) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo 缓动
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, startOnMount]);

  return count;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // 统计数据动画
  const knowledgePoints = useCountUp(50, 2000, mounted);
  const accuracy = useCountUp(95, 2500, mounted);

  useEffect(() => {
    // 延迟启动动画，确保组件已挂载
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 标题文字拆分用于逐词淡入
  const heroWords = ['智能经济学', '解析助手'];

  const quickActions = [
    {
      icon: Brain,
      title: '开始解析',
      description: '上传题目图片或输入文本，智能解析经济学问题',
      path: '/solve',
      color: 'from-primary to-primary-light',
      bgColor: 'bg-primary/5 hover:bg-primary/10',
    },
    {
      icon: FileText,
      title: '模板库',
      description: '浏览和管理解析模板，自定义输出格式',
      path: '/templates',
      color: 'from-accent to-accent-light',
      bgColor: 'bg-accent/5 hover:bg-accent/10',
    },
    {
      icon: Clock,
      title: '历史记录',
      description: '查看历史解析记录，追溯学习轨迹',
      path: '/history',
      color: 'from-success to-teal-400',
      bgColor: 'bg-success/5 hover:bg-success/10',
    },
    {
      icon: Settings,
      title: '系统设置',
      description: '配置默认模型、语言偏好等选项',
      path: '/settings',
      color: 'from-gray-600 to-gray-500',
      bgColor: 'bg-gray-100 hover:bg-gray-200',
    },
  ];

  const stats = [
    { icon: BookOpen, value: knowledgePoints, suffix: '+', label: '经济学知识点', color: 'text-primary' },
    { icon: Layers, value: 0, suffix: '', label: '微观 / 宏观 / 计量', color: 'text-accent', isSpecial: true },
    { icon: Target, value: accuracy, suffix: '%+', label: '解析准确率', color: 'text-success' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Hero 区域 */}
      <section className="text-center py-16 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
          <GraduationCap className="w-4 h-4" />
          考研经济学 · 智能解析助手
        </div>

        {/* 逐词淡入标题 */}
        <h1 className="text-5xl md:text-6xl font-display font-bold text-primary mb-6 leading-tight">
          {heroWords.map((word, index) => (
            <span
              key={index}
              className={`block mt-2 inline-block ${
                index === 1
                  ? 'bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent'
                  : ''
              }`}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease-out ${index * 0.2}s, transform 0.6s ease-out ${index * 0.2}s`,
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        <p
          className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
          }}
        >
          基于先进AI技术，为考研辅导学生提供专业的经济学题目解析服务。
          支持题目识别、智能分析、详细解答和LaTeX代码生成。
        </p>

        {/* 上传区域 */}
        <div
          className="max-w-2xl mx-auto"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.6s, transform 0.6s ease-out 0.6s',
          }}
        >
          <div
            onClick={() => navigate('/solve')}
            className="border-2 border-dashed border-primary/30 rounded-2xl p-12 cursor-pointer transition-all duration-300 hover:border-accent hover:bg-accent/5 group"
          >
            <Upload className="w-16 h-16 mx-auto text-primary/40 group-hover:text-accent transition-colors mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              拖拽或点击上传题目图片
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、WebP 格式 · 自动OCR识别
            </p>
          </div>
        </div>

        {/* CTA 按钮 */}
        <button
          onClick={() => navigate('/solve')}
          className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.8s, transform 0.6s ease-out 0.8s',
          }}
        >
          <Sparkles className="w-5 h-5" />
          立即开始解析
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* 动态统计数据展示 */}
      <section
        className="py-8 px-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary-light/5 rounded-2xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease-out 1s, transform 0.8s ease-out 1s',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
              {stat.isSpecial ? (
                <p className="text-3xl font-bold text-gray-800">{stat.label}</p>
              ) : (
                <>
                  <p className="text-4xl font-bold text-gray-800 mb-1 font-mono">
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 快捷入口卡片网格 */}
      <section>
        <h2 className="text-2xl font-display font-semibold text-primary text-center mb-8">
          快捷功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`group p-6 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 ${action.bgColor} hover:-translate-y-2 hover:shadow-xl`}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow`}
              >
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {action.description}
              </p>
              <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                进入
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 特性展示 */}
      <section className="py-12 px-6 bg-white rounded-2xl border border-gray-200">
        <h2 className="text-2xl font-display font-semibold text-primary text-center mb-10">
          核心能力
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group cursor-default transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-display font-semibold text-lg text-gray-800 mb-2">智能识别</h3>
            <p className="text-sm text-gray-600">
              OCR图像识别，自动提取题目内容，支持手写体和印刷体
            </p>
          </div>
          <div className="text-center group cursor-default transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-display font-semibold text-lg text-gray-800 mb-2">深度分析</h3>
            <p className="text-sm text-gray-600">
              多模型协同分析，精准识别知识点、解题思路和方法
            </p>
          </div>
          <div className="text-center group cursor-default transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-display font-semibold text-lg text-gray-800 mb-2">专业输出</h3>
            <p className="text-sm text-gray-600">
              LaTeX格式化输出，支持公式渲染，可直接用于论文写作
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 EconSolve. 考研经济学智能解析助手</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">关于我们</a>
            <a href="#" className="hover:text-primary transition-colors">使用帮助</a>
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <span className="font-mono text-xs">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
