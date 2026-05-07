import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";

const items = [
  { key: "2026-03-22", label: "22/03", matches: 2, intensity: 2 },
  { key: "2026-03-23", label: "23/03", matches: 4, intensity: 4 },
];

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("ActivityHeatmap", () => {
  it("renders the card variant with summary stats and activity cells", () => {
    render(<ActivityHeatmap items={items} />);

    expect(screen.getByTestId("activity-heatmap-card")).toBeInTheDocument();
    expect(screen.getByTestId("activity-summary")).toHaveTextContent("Matches");
    expect(screen.getByTestId("activity-calendar-shell")).toBeInTheDocument();
    expect(screen.getByTitle("23/03 - 4 match(es)")).toHaveAttribute("data-intensity", "4");
  });

  it("renders the embedded variant and debug panel when requested", () => {
    window.history.pushState({}, "", "/?debugHeatmap=1");

    render(<ActivityHeatmap items={items} variant="embedded" showStats={false} />);

    expect(screen.getByTestId("activity-heatmap-card")).toBeInTheDocument();
    expect(screen.queryByTestId("activity-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("activity-debug-panel")).toHaveTextContent("weeks");
    expect(screen.getByTestId("activity-grid")).toBeInTheDocument();
  });
});
