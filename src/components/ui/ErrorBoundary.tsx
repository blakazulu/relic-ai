import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-parchment p-4">
          <div className="max-w-md w-full text-center">
            <div className="rounded-full bg-rust-red/10 p-4 w-fit mx-auto mb-4">
              <AlertTriangle className="h-12 w-12 text-rust-red" />
            </div>
            <h1 className="font-heading text-xl font-bold text-charcoal mb-2">
              {i18n.t('ui.errorBoundary.title')}
            </h1>
            <p className="text-stone-gray mb-6">
              {i18n.t('ui.errorBoundary.description')}
            </p>
            {this.state.error && (
              <details className="mb-6 text-left rtl:text-right rounded-lg bg-aged-paper border border-desert-sand p-3">
                <summary className="text-sm font-medium text-charcoal cursor-pointer">
                  {i18n.t('ui.errorBoundary.errorDetails')}
                </summary>
                <pre className="mt-2 text-xs text-rust-red overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-6 py-2.5 font-medium text-bone-white transition-colors hover:bg-clay"
            >
              <RefreshCw className="h-4 w-4" />
              {i18n.t('ui.errorBoundary.refresh')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
