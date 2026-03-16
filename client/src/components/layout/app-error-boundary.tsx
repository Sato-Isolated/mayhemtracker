import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary", error, errorInfo);
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--destructive)_12%,transparent),transparent_30%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_14%,transparent),transparent_34%),linear-gradient(160deg,var(--page-start),var(--page-end))] px-6 py-12 text-foreground">
        <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-border/70 bg-[color-mix(in_oklch,var(--card)_86%,var(--background))] p-8 shadow-[0_32px_100px_-48px_color-mix(in_oklch,var(--foreground)_24%,transparent)] backdrop-blur-[18px]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/12 text-destructive shadow-[0_14px_28px_-18px_color-mix(in_oklch,var(--destructive)_40%,transparent)]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Application error</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">The interface hit an unrecoverable render error.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            The shell stayed in control instead of leaving a blank screen. Reload to retry with a clean client state.
          </p>
          {this.state.errorMessage ? (
            <div className="mt-6 rounded-[1rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground backdrop-blur-sm">
              {this.state.errorMessage}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4" />
              Reload application
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/")}>
              <Home className="h-4 w-4" />
              Return to dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }
}