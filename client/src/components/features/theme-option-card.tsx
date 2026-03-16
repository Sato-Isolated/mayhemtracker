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
      variant={isActive ? "default" : "outline"}
      className={`rounded-[1rem] h-auto justify-start px-0 py-0 text-left ${isActive ? "shadow-[0_20px_45px_-32px_color-mix(in_oklch,var(--primary)_38%,transparent)]" : ""}`}
      data-testid={`theme-option-${option.value}`}
      onClick={onSelect}
    >
      <div className="w-full p-4">
        <div className="min-h-[2.75rem] flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{option.label}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{option.tone}</div>
          </div>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${isActive ? "bg-primary/15 text-primary border-primary/30" : "border-border/70 text-muted-foreground"}`}>
            {isActive ? "Active" : "Available"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[1.1fr_0.95fr] gap-[0.7rem] items-end">
          <div className="h-[4.25rem] rounded-[0.9rem] shadow-[inset_0_0_0_1px_color-mix(in_oklch,black_10%,transparent)]" style={{ backgroundColor: option.swatches[0] }} />
          <div className="h-[3.1rem] rounded-[0.9rem] shadow-[inset_0_0_0_1px_color-mix(in_oklch,black_10%,transparent)]" style={{ backgroundColor: option.swatches[1] }} />
          <div className="col-span-full h-[0.7rem] rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklch,black_10%,transparent)]" style={{ backgroundColor: option.swatches[2] }} />
        </div>
        <div className="mt-4 text-xs leading-5 text-muted-foreground">{option.description}</div>
      </div>
    </Button>
  );
}

export { ThemeOptionCard };
export type { ThemeOption };
