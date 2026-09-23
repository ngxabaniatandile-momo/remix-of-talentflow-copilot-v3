import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("TalentFlow view crashed", error, info?.componentStack);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <div className="max-w-md">
          <AlertTriangle className="mx-auto mb-3 size-9 text-alert-foreground" />
          <p className="text-base font-bold">
            {this.props.label ? `${this.props.label} hit a problem` : "This section hit a problem"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your other workspace data is safe. Reset this section to continue working.
          </p>
          <Button className="mt-5" onClick={() => this.setState({ error: null })}>
            <RefreshCw className="size-4" /> Reset section
          </Button>
        </div>
      </div>
    );
  }
}
