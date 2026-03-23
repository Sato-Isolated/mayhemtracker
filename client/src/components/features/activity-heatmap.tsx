import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityDay } from "@/lib/types";

const weekdayLabels = [
  { short: "Lun", row: 0 },
  { short: "Mer", row: 2 },
  { short: "Ven", row: 4 },
] as const;
const weekdayColumnWidth = 28;
const activityCellSize = 11;
const activityCellGap = 4;
const annualWindowDays = 365;
const intensityClassNames: Record<number, string> = {
  0: "bg-[var(--heatmap-cell-0)] border-[color-mix(in_oklch,var(--heatmap-cell-border)_46%,transparent)]",
  1: "bg-[var(--heatmap-cell-1)]",
  2: "bg-[var(--heatmap-cell-2)]",
  3: "bg-[var(--heatmap-cell-3)]",
  4: "bg-[var(--heatmap-cell-4)]",
  5: "bg-[var(--heatmap-cell-5)]",
  6: "bg-[var(--heatmap-cell-6)]",
  7: "bg-[var(--heatmap-cell-7)]",
};

function parseUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return startOfUtcDay(date);
}

function startOfUtcWeek(value: Date) {
  const date = startOfUtcDay(value);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addUtcDays(date, offset);
}

function endOfUtcWeek(value: Date) {
  return addUtcDays(startOfUtcWeek(value), 6);
}

type ActivityHeatmapProps = {
  items: ActivityDay[];
  variant?: "card" | "embedded";
  showStats?: boolean;
};

export function ActivityHeatmap({ items, variant = "card", showStats = true }: ActivityHeatmapProps) {
  const debugMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugHeatmap") === "1";
  const resolvedWeekdayColumnWidth = variant === "embedded" ? 22 : weekdayColumnWidth;
  const resolvedActivityCellGap = variant === "embedded" ? 3 : activityCellGap;
  const activityCellMaxSize = variant === "embedded" ? "18px" : "15px";

  const calendar = useMemo(() => {
    const latestDate = items.length ? parseUtcDate(items.at(-1)?.key ?? new Date().toISOString().slice(0, 10)) : startOfUtcDay(new Date());
    const rangeStart = addUtcDays(latestDate, -(annualWindowDays - 1));
    const rangeEnd = startOfUtcDay(latestDate);
    const calendarStart = startOfUtcWeek(rangeStart);
    const calendarEnd = endOfUtcWeek(rangeEnd);
    const itemMap = new Map(items.map((item) => [item.key, item]));
    const days = [] as Array<{
      key: string;
      label: string;
      matches: number;
      intensity: number;
      inRange: boolean;
      date: Date;
    }>;

    for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor = addUtcDays(cursor, 1)) {
      const key = cursor.toISOString().slice(0, 10);
      const item = itemMap.get(key);
      const inRange = cursor >= rangeStart && cursor <= rangeEnd;
      days.push({
        key,
        label: item?.label ?? cursor.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        matches: item?.matches ?? 0,
        intensity: item?.intensity ?? 0,
        inRange,
        date: new Date(cursor),
      });
    }

    const weeks = [] as Array<typeof days>;
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    const monthLabels = weeks.reduce((accumulator, week, weekIndex) => {
      const firstInRangeDay = week.find((day) => day.inRange);
      if (!firstInRangeDay) {
        return accumulator;
      }

      const key = `${firstInRangeDay.date.getUTCFullYear()}-${firstInRangeDay.date.getUTCMonth()}`;
      const previous = accumulator.at(-1);
      if (previous?.key === key) {
        return accumulator;
      }

      accumulator.push({
        key,
        label: firstInRangeDay.date.toLocaleDateString("fr-FR", { month: "short" }),
        startColumn: weekIndex + 2,
      });
      return accumulator;
    }, [] as Array<{ key: string; label: string; startColumn: number }>);

    const visibleDays = days.filter((day) => day.inRange);
    const totalMatches = visibleDays.reduce((sum, day) => sum + day.matches, 0);
    const activeDays = visibleDays.filter((day) => day.matches > 0).length;
    const hottestDay = visibleDays.reduce((best, day) => (day.matches > best.matches ? day : best), visibleDays[0] ?? {
      key: "",
      label: "-",
      matches: 0,
      intensity: 0,
      inRange: false,
      date: rangeStart,
    });
    const visibleRangeLabel = `${rangeStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} au ${rangeEnd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

    const weekCount = weeks.length;

    return {
      weeks,
      weekCount,
      monthLabels,
      visibleDays,
      totalMatches,
      activeDays,
      hottestDay,
      visibleRangeLabel,
      calendarMinWidth: resolvedWeekdayColumnWidth + weekCount * (activityCellSize + resolvedActivityCellGap),
      weekColumnsTemplate: `repeat(${weekCount}, var(--activity-cell-size))`,
    };
  }, [items, resolvedActivityCellGap, resolvedWeekdayColumnWidth]);

  const content = (
    <div
      className={cn(
        "grid items-start gap-4 max-[960px]:grid-cols-1",
        variant === "embedded" ? "grid-cols-1" : "[grid-template-columns:minmax(208px,0.82fr)_minmax(0,1.48fr)]",
      )}
    >
      <div
        className={cn(
          "min-w-0 rounded-[1rem]",
          variant === "embedded"
            ? "flex flex-wrap items-end justify-between gap-5"
            : "grid content-start gap-3 border border-[color-mix(in_oklch,var(--border)_58%,transparent)] bg-[color-mix(in_oklch,var(--card)_92%,var(--surface-2))] p-[0.85rem]",
        )}
      >
        <div className={cn(variant === "embedded" && "max-w-[24rem]")}>
          <div className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">12 derniers mois</div>
          <div className="mt-[0.16rem] text-[1.02rem] font-semibold leading-[1.1] text-foreground max-sm:text-[0.95rem]">Rythme d'activite</div>
          <div className="mt-[0.28rem] text-[0.84rem] text-muted-foreground max-sm:text-[0.78rem]">Vue annuelle continue, alignee par semaines comme un graphe de contribution.</div>
        </div>

        {showStats ? (
          <div className="grid grid-cols-2 gap-[0.55rem] max-sm:w-full" data-testid="activity-summary">
            <div className="col-span-full text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">12 derniers mois</div>
            <div className="grid gap-[0.18rem] rounded-[0.9rem] border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_86%,var(--surface-2))] px-[0.72rem] py-[0.65rem]">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Matchs</span>
              <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.totalMatches}</strong>
            </div>
            <div className="grid gap-[0.18rem] rounded-[0.9rem] border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_86%,var(--surface-2))] px-[0.72rem] py-[0.65rem]">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Jours actifs</span>
              <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.activeDays}</strong>
            </div>
            <div className="grid gap-[0.18rem] rounded-[0.9rem] border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_86%,var(--surface-2))] px-[0.72rem] py-[0.65rem]">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Jour pic</span>
              <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.hottestDay.label}</strong>
            </div>
            <div className="grid gap-[0.18rem] rounded-[0.9rem] border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_86%,var(--surface-2))] px-[0.72rem] py-[0.65rem]">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Volume max</span>
              <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.hottestDay.matches}</strong>
            </div>
          </div>
        ) : null}

        {debugMode ? (
          <div className="flex flex-wrap gap-[0.45rem] text-[0.72rem] text-muted-foreground" data-testid="activity-debug-panel">
            <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--primary)_26%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))] px-[0.55rem] py-[0.22rem]">{calendar.weekCount} semaines</span>
            <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--primary)_26%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))] px-[0.55rem] py-[0.22rem]">{calendar.visibleDays.length} jours visibles</span>
            <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--primary)_26%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))] px-[0.55rem] py-[0.22rem]">{activityCellSize}px cellules min</span>
            <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--primary)_26%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))] px-[0.55rem] py-[0.22rem]">{calendar.visibleRangeLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 rounded-[1rem] border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_78%,transparent)] px-[0.8rem] py-[0.72rem] max-sm:px-[0.8rem] max-sm:py-[0.8rem]">
        <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-[0.35rem] [container-type:inline-size] [scrollbar-width:thin]" data-testid="activity-calendar-shell">
          <div
            className={cn(
              "relative w-full min-w-full [--activity-cell-gap:4px] [--activity-cell-max-size:15px] [--activity-cell-min-size:11px] [--activity-cell-size:clamp(var(--activity-cell-min-size),calc((100cqi-var(--activity-weekday-column-width)-(var(--activity-week-count)*var(--activity-cell-gap)))/var(--activity-week-count)),var(--activity-cell-max-size))]",
              "max-sm:[--activity-cell-gap:3px] max-sm:[--activity-cell-max-size:11px] max-sm:[--activity-cell-min-size:9px]",
              debugMode && "outline outline-1 outline-offset-[6px] outline-dashed outline-[color-mix(in_oklch,var(--primary)_30%,var(--border))]",
            )}
            style={{
              width: "100%",
              minWidth: `${calendar.calendarMinWidth}px`,
              ["--activity-week-count" as string]: String(calendar.weekCount),
              ["--activity-weekday-column-width" as string]: `${resolvedWeekdayColumnWidth}px`,
              ["--activity-cell-min-size" as string]: `${activityCellSize}px`,
              ["--activity-cell-max-size" as string]: activityCellMaxSize,
              ["--activity-cell-gap" as string]: `${resolvedActivityCellGap}px`,
            }}
          >
            <div
              className="mb-[0.55rem] grid h-[1.1rem] min-w-full items-end justify-center gap-[var(--activity-cell-gap)]"
              style={{ gridTemplateColumns: `var(--activity-weekday-column-width) ${calendar.weekColumnsTemplate}` }}
              data-testid="activity-month-labels"
            >
              <div />
              {calendar.monthLabels.map((label) => (
                <div
                  key={label.key}
                  className="whitespace-nowrap text-left text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground max-sm:text-[0.62rem]"
                  style={{ gridColumnStart: label.startColumn }}
                >
                  {label.label}
                </div>
              ))}
            </div>

            <div
              className="grid items-start justify-center gap-[var(--activity-cell-gap)]"
              style={{ gridTemplateColumns: `var(--activity-weekday-column-width) ${calendar.weekColumnsTemplate}` }}
              data-testid="activity-grid"
            >
              <div className="grid w-[var(--activity-weekday-column-width)] [grid-template-rows:repeat(7,var(--activity-cell-size))] gap-[var(--activity-cell-gap)]">
                {Array.from({ length: 7 }).map((_, rowIndex) => {
                  const label = weekdayLabels.find((entry) => entry.row === rowIndex);
                  return (
                    <div key={rowIndex} className="flex min-h-[var(--activity-cell-size)] w-full items-center justify-start text-[0.58rem] uppercase tracking-[0.06em] text-muted-foreground max-sm:text-[0.52rem]">
                      {label?.short ?? ""}
                    </div>
                  );
                })}
              </div>

              {calendar.weeks.map((week, weekIndex) => (
                <div
                  key={`week-${weekIndex}`}
                  className={cn(
                    "grid rounded-[0.35rem] [grid-template-rows:repeat(7,var(--activity-cell-size))] gap-[var(--activity-cell-gap)]",
                    debugMode &&
                      "bg-[linear-gradient(180deg,color-mix(in_oklch,var(--border)_18%,transparent),color-mix(in_oklch,var(--border)_18%,transparent))] bg-[length:100%_100%] bg-no-repeat",
                  )}
                  data-debug-week={debugMode ? weekIndex : undefined}
                >
                  {week.map((day) => (
                    <div
                      key={day.key}
                      className={cn(
                        "h-[var(--activity-cell-size)] w-[var(--activity-cell-size)] rounded-[0.18rem] border border-[var(--heatmap-cell-border)] transition-[transform,border-color,filter] duration-120 motion-reduce:transition-none",
                        debugMode && "shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_6%,transparent)]",
                        day.inRange ? "hover:-translate-y-px hover:border-[var(--heatmap-cell-hover-border)] hover:saturate-[1.08]" : "opacity-[0.22]",
                        intensityClassNames[day.intensity] ?? intensityClassNames[0],
                      )}
                      data-intensity={day.intensity}
                      data-outside-range={day.inRange ? "false" : "true"}
                      data-active={day.matches > 0 ? "true" : "false"}
                      data-debug-day={debugMode ? day.label : undefined}
                      aria-label={`${day.label} - ${day.matches} match(es)`}
                      title={`${day.label} - ${day.matches} match(es)`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return (
      <div
        className="rounded-[1.25rem] border border-[var(--border-ui)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_14%,transparent),transparent_42%),color-mix(in_oklch,var(--card)_84%,var(--surface-2))] shadow-[inset_0_1px_0_color-mix(in_oklch,white_38%,transparent)]"
        data-testid="activity-heatmap-card"
      >
        <div className="grid gap-4 p-4">{content}</div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="activity-heatmap-card">
      <CardHeader className="pb-0">
        <CardTitle className="sr-only">Rythme d'activite</CardTitle>
        <CardDescription className="sr-only">Vue annuelle continue, alignee par semaines comme un graphe de contribution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
