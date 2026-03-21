import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityDay } from "@/lib/types";
import "./activity-heatmap.css";

const weekdayLabels = [
  { short: "Lun", row: 0 },
  { short: "Mer", row: 2 },
  { short: "Ven", row: 4 },
] as const;
const weekdayColumnWidth = 28;
const activityCellSize = 11;
const activityCellGap = 4;
const annualWindowDays = 365;

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
    const visibleRangeLabel = `${rangeStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} → ${rangeEnd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

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

  const layoutClassName = [
    "activity-heatmap-layout",
    variant === "embedded" ? "activity-heatmap-layout-embedded" : null,
  ].filter(Boolean).join(" ");

  const content = (
    <>
      <div className={layoutClassName}>
        <div className="activity-heatmap-meta grid gap-3 content-start p-[0.85rem] rounded-[1rem]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[0.64rem] font-bold tracking-[0.14em] uppercase text-muted-foreground">12 derniers mois</div>
              <div className="mt-[0.16rem] text-[1.02rem] font-semibold leading-[1.1] text-foreground max-sm:text-[0.95rem]">Activity rhythm</div>
              <div className="mt-[0.28rem] text-[0.84rem] text-muted-foreground max-sm:text-[0.78rem]">Vue annuelle continue, alignée par semaines comme une contribution graph.</div>
            </div>
          </div>
          {showStats ? (
            <div className="grid grid-cols-2 gap-[0.55rem]" data-testid="activity-summary">
              <div className="col-span-full text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-muted-foreground">12 derniers mois</div>
              <div className="activity-stat-card grid gap-[0.18rem] px-[0.72rem] py-[0.65rem] rounded-[0.9rem]">
                <span className="text-[0.64rem] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Matches</span>
                <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.totalMatches}</strong>
              </div>
              <div className="activity-stat-card grid gap-[0.18rem] px-[0.72rem] py-[0.65rem] rounded-[0.9rem]">
                <span className="text-[0.64rem] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Active days</span>
                <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.activeDays}</strong>
              </div>
              <div className="activity-stat-card grid gap-[0.18rem] px-[0.72rem] py-[0.65rem] rounded-[0.9rem]">
                <span className="text-[0.64rem] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Peak day</span>
                <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.hottestDay.label}</strong>
              </div>
              <div className="activity-stat-card grid gap-[0.18rem] px-[0.72rem] py-[0.65rem] rounded-[0.9rem]">
                <span className="text-[0.64rem] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Peak volume</span>
                <strong className="text-[0.96rem] font-semibold leading-[1.1] text-foreground">{calendar.hottestDay.matches}</strong>
              </div>
            </div>
          ) : null}

          {debugMode ? (
            <div className="flex flex-wrap gap-[0.45rem] text-[0.72rem] text-muted-foreground" data-testid="activity-debug-panel">
              <span>{calendar.weekCount} weeks</span>
              <span>{calendar.visibleDays.length} visible days</span>
              <span>{activityCellSize}px min cells</span>
              <span>{calendar.visibleRangeLabel}</span>
            </div>
          ) : null}
        </div>
        <div className="activity-heatmap-graph px-[0.8rem] py-[0.72rem] rounded-[1rem]">
          <div className="activity-calendar-shell" data-testid="activity-calendar-shell">
            <div
              className={`activity-calendar-track ${debugMode ? "activity-calendar-track-debug" : ""}`}
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
              <div className="activity-calendar-months" style={{ gridTemplateColumns: `var(--activity-weekday-column-width) ${calendar.weekColumnsTemplate}` }} data-testid="activity-month-labels">
                <div />
                {calendar.monthLabels.map((label) => (
                  <div
                    key={label.key}
                    className="activity-month-label"
                    style={{ gridColumnStart: label.startColumn }}
                  >
                    {label.label}
                  </div>
                ))}
              </div>

              <div className="activity-calendar-grid" style={{ gridTemplateColumns: `var(--activity-weekday-column-width) ${calendar.weekColumnsTemplate}` }} data-testid="activity-grid">
                <div className="activity-weekday-column">
                  {Array.from({ length: 7 }).map((_, rowIndex) => {
                    const label = weekdayLabels.find((entry) => entry.row === rowIndex);
                    return <div key={rowIndex} className="activity-weekday-label">{label?.short ?? ""}</div>;
                  })}
                </div>

                {calendar.weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="activity-week-column" data-debug-week={debugMode ? weekIndex : undefined}>
                    {week.map((day) => (
                      <div
                        key={day.key}
                        className="activity-cell"
                        data-intensity={day.intensity}
                        data-outside-range={day.inRange ? "false" : "true"}
                        data-active={day.matches > 0 ? "true" : "false"}
                        data-debug-day={debugMode ? day.label : undefined}
                        aria-label={`${day.label} · ${day.matches} match(es)`}
                        title={`${day.label} · ${day.matches} match(es)`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="activity-heatmap-panel activity-heatmap-panel-embedded rounded-[1.25rem]" data-testid="activity-heatmap-card">
        <div className="grid gap-4 p-4">{content}</div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="activity-heatmap-card">
      <CardHeader className="pb-0">
        <CardTitle className="sr-only">Activity rhythm</CardTitle>
        <CardDescription className="sr-only">Vue annuelle continue, alignée par semaines comme une contribution graph.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
