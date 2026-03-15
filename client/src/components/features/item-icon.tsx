import { getItemVisual } from "@/lib/tracker-utils";
import type { StaticDataEntry } from "@/lib/types";

export function ItemIcon({
  itemId,
  items,
  size = 24,
  showName = false,
}: {
  itemId: string;
  items: StaticDataEntry[];
  size?: number;
  showName?: boolean;
}) {
  const visual = getItemVisual(itemId, items);

  if (!itemId || itemId === "0") {
    return <div className="rounded-md border border-border/70 bg-secondary/60" style={{ width: size, height: size }} />;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5" title={visual.name}>
      {visual.icon ? (
        <img src={visual.icon} alt={visual.name} width={size} height={size} className="rounded-md border border-border/70 bg-card/90 object-cover" />
      ) : (
        <div className="rounded-md border border-border/70 bg-secondary/60" style={{ width: size, height: size }} />
      )}
      {showName ? <span className="truncate text-xs text-foreground">{visual.name}</span> : null}
    </div>
  );
}