import { Button } from "@/components/ui/button";

interface ThemeOption {
  value: string;
  label: string;
  tone: string;
  description: string;
  swatches: readonly [string, string, string];
}

interface ThemeOptionCardProps {
  option: ThemeOption;
  isActive: boolean;
  onSelect: () => void;
}

function ThemeOptionCard({ option, isActive, onSelect }: ThemeOptionCardProps) {
  return (
    <Button
      variant="outline"
      className={`h-auto justify-start px-0 py-0 text-left transition-all ${
        isActive
          ? "bg-[var(--selected-bg)] border-[var(--selected-border)] ring-2 ring-[color-mix(in_oklch,var(--primary)_18%,transparent)]"
          : "hover:bg-[var(--hover-overlay)] hover:border-[color-mix(in_oklch,var(--primary)_28%,var(--border))]"
      }`}
      data-testid={`theme-option-${option.value}`}
      onClick={onSelect}
    >
      <div className="w-full p-4">
        <div className="min-h-[2.75rem] flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{option.label}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{option.tone}</div>
          </div>
          <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            isActive
              ? "bg-[color-mix(in_oklch,var(--primary)_18%,var(--card))] text-[color-mix(in_oklch,var(--primary)_85%,var(--foreground))] border-[var(--selected-border)]"
              : "border-border/70 text-muted-foreground"
          }`}>
            {isActive ? "Active" : "Available"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[1.1fr_0.95fr] gap-[0.7rem] items-end">
          <div className="h-[4.25rem] border border-border/70" style={{ backgroundColor: option.swatches[0] }} />
          <div className="h-[3.1rem] border border-border/70" style={{ backgroundColor: option.swatches[1] }} />
          <div className="col-span-full h-[0.7rem] border border-border/70" style={{ backgroundColor: option.swatches[2] }} />
        </div>
        <div className="mt-4 text-xs leading-5 text-muted-foreground">{option.description}</div>
      </div>
    </Button>
  );
}

export { ThemeOptionCard };
export type { ThemeOption };
