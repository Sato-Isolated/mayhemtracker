import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading data...", className }: LoadingStateProps) {
  return (
    <Surface variant="subtle" className={cn("flex min-h-52 items-center justify-center px-6 py-8", className)}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-2 rounded-full bg-primary shadow-[0_0_0_5px_color-mix(in_oklch,var(--primary)_14%,transparent)]" />
        {label}
      </div>
    </Surface>
  );
}
