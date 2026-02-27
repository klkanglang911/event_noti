import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type PromptType = 'success' | 'error' | 'confirm';

interface PromptState {
  open: boolean;
  type: PromptType;
  message: string;
  autoCloseMs?: number;
}

interface PromptContextValue {
  success: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
}

interface Resolver {
  resolve: (value: boolean) => void;
}

const PromptContext = createContext<PromptContextValue | null>(null);

const AUTO_CLOSE_MS = 1500;

export function PromptProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [resolver, setResolver] = useState<Resolver | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);

  const closePrompt = (result: boolean) => {
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (resolver) {
      resolver.resolve(result);
      setResolver(null);
    }
    setPrompt(null);
  };

  const openPrompt = (type: PromptType, message: string, autoCloseMs?: number) =>
    new Promise<boolean>((resolve) => {
      if (autoCloseTimerRef.current !== null) {
        window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      setResolver((previousResolver) => {
        previousResolver?.resolve(false);
        return { resolve };
      });

      setPrompt({ open: true, type, message, autoCloseMs });

      if (autoCloseMs && type !== 'confirm') {
        autoCloseTimerRef.current = window.setTimeout(() => {
          setPrompt(null);
          setResolver((currentResolver) => {
            currentResolver?.resolve(true);
            return null;
          });
          autoCloseTimerRef.current = null;
        }, autoCloseMs);
      }
    });

  const value = useMemo<PromptContextValue>(
    () => ({
      async success(message: string) {
        await openPrompt('success', message, AUTO_CLOSE_MS);
      },
      async error(message: string) {
        await openPrompt('error', message);
      },
      async confirm(message: string) {
        return openPrompt('confirm', message);
      },
    }),
    []
  );

  return (
    <PromptContext.Provider value={value}>
      {children}
      <PromptHost prompt={prompt} onClose={closePrompt} />
    </PromptContext.Provider>
  );
}

export function usePrompt(): PromptContextValue {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt 必须在 PromptProvider 内使用');
  }
  return context;
}

function PromptHost({
  prompt,
  onClose,
}: {
  prompt: PromptState | null;
  onClose: (result: boolean) => void;
}) {
  if (!prompt?.open) {
    return null;
  }

  const isConfirm = prompt.type === 'confirm';
  const title = prompt.type === 'success' ? '操作成功' : prompt.type === 'error' ? '操作失败' : '请确认';
  const titleClass = prompt.type === 'success'
    ? 'text-green-700'
    : prompt.type === 'error'
      ? 'text-red-700'
      : 'text-gray-900';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className={`text-lg font-semibold ${titleClass}`}>{title}</h3>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{prompt.message}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {isConfirm ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onClose(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => onClose(true)}
              >
                确认
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onClose(true)}
            >
              确定
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
