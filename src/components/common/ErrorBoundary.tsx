import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl text-center">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full text-rose-600 dark:text-rose-400 mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-main mb-2">Something went wrong</h3>
          <p className="text-sm text-slate-500 dark:text-muted max-w-xs mb-6">
            We encountered an error while rendering this component. This could be due to malformed data.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-main rounded-xl text-sm font-bold transition-all"
          >
            <RefreshCcw size={16} /> Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}
