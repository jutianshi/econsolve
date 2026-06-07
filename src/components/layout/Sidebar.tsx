import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Brain,
  FileText,
  Clock,
  Settings,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/solve', icon: Brain, label: '解析' },
  { path: '/templates', icon: FileText, label: '模板' },
  { path: '/history', icon: Clock, label: '历史' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-surface-dark text-white flex flex-col shadow-[4px_0_15px_-3px_rgba(0,0,0,0.15)]">
      {/* Logo - 渐变背景 */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 bg-gradient-to-r from-primary-dark to-primary/30">
        <GraduationCap className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-xl font-display font-bold text-accent">EconSolve</h1>
          <p className="text-xs text-gray-400">智能经济学解析助手</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary/50 text-accent shadow-lg shadow-primary/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {/* 左侧指示条 */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-200 ${
                  isActive
                    ? 'bg-accent opacity-100'
                    : 'bg-accent opacity-0 group-hover:opacity-100'
                }`}
              />
              <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - 增加版本号 */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          © 2025 EconSolve
        </p>
        <p className="text-xs text-gray-600 text-center mt-1">
          考研经济学 · 智能解析
        </p>
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-xs text-gray-600 text-center font-mono">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
