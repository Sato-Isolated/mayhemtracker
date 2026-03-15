import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
};

export function ActivityHeatmap({ items, variant = "card" }: ActivityHeatmapProps) {
  const debugMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugHeatmap") === "1";

  const calendar = useMemo(() => {
    const latestDate = items.length ? parseUtcDate(items.at(-1)?.key ?? new Date().toISOString().slice(0, 10)) : startOfUtcDay(new Date());
    const rangeStart = addUtcDays(latestDate, -(annualWindowDays - 1));
    const rangeEnd = startOfUtcDay(latestDate);
    const calendarStart = startOfUtcWeek(rangeStart);
    const calendarEnd = endOfUtcWeek(rangeEnd);
    const weekPitch = activityCellSize + activityCellGap;
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

    return {
      weeks,
      monthLabels,
      visibleDays,
      totalMatches,
      activeDays,
      hottestDay,
      visibleRangeLabel,
      calendarWidth: weekdayColumnWidth + Math.max(weeks.length * weekPitch - activityCellGap, 0),
      weekColumnsTemplate: `repeat(${weeks.length}, ${activityCellSize}px)`,
    };
  }, [items]);

  const content = (
    <>
      <div className="activity-heatmap-layout">
        <div className="activity-heatmap-meta">
          <div className="activity-heatmap-heading">
            <div>
              <div className="activity-heatmap-kicker">12 derniers mois</div>
              <div className="activity-heatmap-title">Activity rhythm</div>
              <div className="activity-heatmap-description">Vue annuelle continue, alignée par semaines comme une contribution graph.</div>
            </div>
          </div>
          <div className="activity-summary-row" data-testid="activity-summary">
            <div className="activity-summary-period">12 derniers mois</div>
            <div className="activity-stat-card">
              <span className="activity-stat-label">Matches</span>
              <strong className="activity-stat-value">{calendar.totalMatches}</strong>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-label">Active days</span>
              <strong className="activity-stat-value">{calendar.activeDays}</strong>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-label">Peak day</span>
              <strong className="activity-stat-value">{calendar.hottestDay.label}</strong>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-label">Peak volume</span>
              <strong className="activity-stat-value">{calendar.hottestDay.matches}</strong>
            </div>
          </div>

          {debugMode ? (
            <div className="activity-debug-panel" data-testid="activity-debug-panel">
              <span>{calendar.weeks.length} weeks</span>
              <span>{calendar.visibleDays.length} visible days</span>
              <span>{activityCellSize}px cells</span>
              <span>{calendar.visibleRangeLabel}</span>
            </div>
          ) : null}
        </div>
        <div className="activity-heatmap-graph">
          <div className="activity-calendar-shell" data-testid="activity-calendar-shell">
            <div
              className={`activity-calendar-track ${debugMode ? "activity-calendar-track-debug" : ""}`}
              style={{
                width: "100%",
                minWidth: `${calendar.calendarWidth}px`,
                ["--activity-cell-size" as string]: `${activityCellSize}px`,
                ["--activity-cell-gap" as string]: `${activityCellGap}px`,
              }}
            >
              <div className="activity-calendar-months" style={{ gridTemplateColumns: `${weekdayColumnWidth}px ${calendar.weekColumnsTemplate}` }} data-testid="activity-month-labels">
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

              <div className="activity-calendar-grid" style={{ gridTemplateColumns: `${weekdayColumnWidth}px ${calendar.weekColumnsTemplate}` }} data-testid="activity-grid">
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
      <div className="activity-heatmap-panel activity-heatmap-panel-embedded" data-testid="activity-heatmap-card">
        <div className="activity-heatmap-body">{content}</div>
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