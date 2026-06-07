import { useEffect, useCallback, useRef } from 'react';

// ==================== 类型定义 ====================

interface ModifierKey {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

interface ShortcutConfig {
  /** 按键，如 'Enter', 'Escape', 'c', 'C' */
  key: string;
  /** 是否需要修饰键 */
  modifiers?: ModifierKey;
  /** 触发回调 */
  callback: () => void;
  /** 描述（用于调试） */
  description?: string;
  /** 是否启用（默认 true） */
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  /** 当前绑定的快捷键列表 */
  bindings: ShortcutConfig[];
  /** 手动触发某个快捷键 */
  trigger: (key: string) => void;
  /** 是否处于绑定状态 */
  isBound: boolean;
}

/**
 * 自定义键盘快捷键 Hook
 *
 * @example
 * ```tsx
 * const { bindings, trigger } = useKeyboardShortcuts([
 *   { key: 'Enter', modifiers: { ctrl: true }, callback: handleSubmit, description: '提交解析' },
 *   { key: 'c', modifiers: { ctrl: true, shift: true }, callback: handleCopy, description: '复制结果' },
 *   { key: 'Escape', callback: handleReset, description: '重置' },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[]
): UseKeyboardShortcutsReturn {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const findMatchingShortcut = useCallback(
    (event: KeyboardEvent): ShortcutConfig | null => {
      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        // 匹配按键（忽略大小写）
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

        // 匹配修饰键
        const mods = shortcut.modifiers ?? {};
        if (
          !!mods.ctrl !== event.ctrlKey ||
          !!mods.shift !== event.shiftKey ||
          !!mods.alt !== event.altKey ||
          !!mods.meta !== event.metaKey
        ) {
          continue;
        }

        return shortcut;
      }
      return null;
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的快捷键（除非是 Escape）
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && event.key !== 'Escape') return;

      const match = findMatchingShortcut(event);
      if (match) {
        event.preventDefault();
        match.callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findMatchingShortcut]);

  const trigger = useCallback(
    (key: string) => {
      const match = shortcutsRef.current.find(s =>
        s.key.toLowerCase() === key.toLowerCase()
      );
      if (match && match.enabled !== false) {
        match.callback();
      }
    },
    []
  );

  return {
    bindings: shortcuts,
    trigger,
    isBound: shortcuts.length > 0,
  };
}

/** 预设的常用快捷键配置 */
export const PRESET_SHORTCUTS = {
  submit: { key: 'Enter', modifiers: { ctrl: true }, description: '提交解析' },
  copy: { key: 'c', modifiers: { ctrl: true, shift: true }, description: '复制结果' },
  reset: { key: 'Escape', description: '重置' },
  save: { key: 's', modifiers: { ctrl: true }, description: '保存' },
  undo: { key: 'z', modifiers: { ctrl: true }, description: '撤销' },
  redo: { key: 'z', modifiers: { ctrl: true, shift: true }, description: '重做' },
} as const;

export default useKeyboardShortcuts;
