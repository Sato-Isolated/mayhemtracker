import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ToggleGroupOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleGroupOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

function ToggleGroup<T extends string>({ options, value, onValueChange, className }: ToggleGroupProps<T>) {
  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          disabled={option.disabled}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export { ToggleGroup };
export type { ToggleGroupOption, ToggleGroupProps };
