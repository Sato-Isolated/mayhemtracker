import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { useAsyncAction, type AsyncState } from "@/state/shared";

describe("useAsyncAction", () => {
  it("preserves existing data while a refresh is in flight", async () => {
    let resolveAction: ((value: string) => void) | undefined;

    const { result } = renderHook(() => {
      const [state, setState] = useState<AsyncState<string>>({
        loading: false,
        data: "cached-value",
      });
      const { runAction } = useAsyncAction("test");

      return {
        state,
        start: () =>
          runAction(
            setState,
            () =>
              new Promise<string>((resolve) => {
                resolveAction = resolve;
              }),
            { actionName: "refresh" },
          ),
      };
    });

    void result.current.start();

    await waitFor(() => expect(result.current.state.loading).toBe(true));
    expect(result.current.state.data).toBe("cached-value");

    resolveAction?.("fresh-value");

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.data).toBe("fresh-value");
    });
  });
});
