import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.fallbackLabel ? ` — ${this.props.fallbackLabel}` : ""}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.fallbackLabel || "This section";
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Something went wrong
              </h3>
              <p className="text-xs text-muted-foreground">
                {label} encountered an unexpected error.
              </p>
            </div>
            {this.state.error && (
              <p className="text-[10px] text-muted-foreground/50 font-mono bg-muted/30 rounded-lg px-3 py-2 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
