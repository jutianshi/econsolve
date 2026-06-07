import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ChevronRight, User, Keyboard } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  const pageConfig: Record<string, { name: string; parent?: string }> = {
    '/': { name: '首页' },
    '/solve': { name: '解析工作台', parent: '首页' },
    '/templates': { name: '模板管理', parent: '首页' },
    '/templates/': { name: '模板编辑', parent: '模板管理' },
    '/history': { name: '历史记录', parent: '首页' },
    '/settings': { name: '系统设置', parent: '首页' },
  };

  const currentConfig = Object.entries(pageConfig).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || { name: '页面' };

  // 构建面包屑
  const breadcrumbs = [];
  if (currentConfig.parent) {
    breadcrumbs.push({ label: currentConfig.parent, path: '/' });
  }
  breadcrumbs.push({ label: currentConfig.name, path: location.pathname });

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* 面包屑导航 */}
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-display font-semibold text-primary">
                  {crumb.label}
                </span>
              ) : (
                <span className="text-gray-500 hover:text-primary cursor-pointer transition-colors">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* 快捷键提示 badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium">
          <Keyboard className="w-3.5 h-3.5" />
          <span>⌘K</span>
          <span className="text-gray-400">快捷搜索</span>
        </div>

        {/* 用户头像 - 渐变圆形 + tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <User className="w-4.5 h-4.5 text-white" />
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg animate-fade-in z-50">
              用户设置
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
