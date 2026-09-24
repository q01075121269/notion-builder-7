import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('notion_template_cache');
      localStorage.removeItem('notion_template_vault_draft');
    } catch (err) {
      console.warn('[ErrorBoundary] Cache reset error:', err);
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {this.props.fallbackTitle || '화면을 불러오는 중 일시적인 오류가 발생했습니다'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
              {this.state.error?.message || '저장소 데이터 형식의 불일치로 렌더링에 실패했습니다.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>화면 다시 시도</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
