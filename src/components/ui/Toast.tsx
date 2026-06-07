import { useState, useCallback, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ==================== 类型定义 ====================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// ==================== 配置 ====================

const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; text: string; progress: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    progress: 'bg-green-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    progress: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    progress: 'bg-yellow-500',
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    progress: 'bg-blue-500',
  },
};

const DEFAULT_DURATION = 3000;

let toastIdCounter = 0;

// ==================== Context ====================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// ==================== 单个 Toast 组件 ====================

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration ?? DEFAULT_DURATION;

  const handleRemove = () => onRemove(toast.id);

  // 自动消失
  setTimeout(() => handleRemove(), duration);

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${config.bg} ${config.border} min-w-[280px] max-w-[420px] animate-slide-in`}
      role="alert"
    >
      {/* 进度条 */}
      <div className="absolute bottom-0 left-0 h-1 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${config.progress} rounded-bl-lg`}
          style={{ width: '100%', animation: `toast-shrink ${duration}ms linear forwards` }}
        />
      </div>

      {/* 图标 */}
      <span className={config.text}>{config.icon}</span>

      {/* 消息 */}
      <p className={`flex-1 text-sm font-medium ${config.text}`}>{toast.message}</p>

      {/* 关闭按钮 */}
      <button
        onClick={handleRemove}
        className="p-0.5 rounded hover:bg-black/5 transition-colors"
        aria-label="关闭通知"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

// ==================== Toast 容器组件 ====================

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>,
    document.body
  );
}

// ==================== Provider 组件 ====================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const success = useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast('error', msg, dur), [addToast]);
  const warning = useCallback((msg: string, dur?: number) => addToast('warning', msg, dur), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  );
}

export default ToastProvider;
