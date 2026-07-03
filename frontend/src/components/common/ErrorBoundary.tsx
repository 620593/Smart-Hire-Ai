import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled React error boundary capture:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6 text-center">
          <section className="max-w-lg space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              The application encountered an unexpected error. Please refresh
              the page.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}