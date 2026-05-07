import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { StaticDataEntry, StaticSyncResponse } from "@/lib/types";
import { debugLog } from "@/lib/debug-log";
import { initialAsyncState, useAsyncAction, type AsyncState } from "@/state/shared";

interface StaticDataContextValue {
  staticSync: AsyncState<StaticSyncResponse>;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  loadStaticLists: () => Promise<void>;
  syncStaticData: () => Promise<StaticSyncResponse | undefined>;
}

const StaticDataContext = createContext<StaticDataContextValue | undefined>(undefined);

export function StaticDataProvider({ children }: { children: ReactNode }) {
  const [staticSync, setStaticSync] = useState<AsyncState<StaticSyncResponse>>(initialAsyncState<StaticSyncResponse>());
  const [champions, setChampions] = useState<StaticDataEntry[]>([]);
  const [items, setItems] = useState<StaticDataEntry[]>([]);
  const [augments, setAugments] = useState<StaticDataEntry[]>([]);
  const { runAction } = useAsyncAction("static-data");

  async function loadStaticLists() {
    try {
      debugLog.info("static-data", "loadStaticLists:start");
      const [championsResponse, augmentsResponse, itemsResponse] = await Promise.all([
        api.getChampions(),
        api.getAugments(),
        api.getItems(),
      ]);

      setChampions(championsResponse.items);
      setAugments(augmentsResponse.items);
      setItems(itemsResponse.items);
      debugLog.info("static-data", "loadStaticLists:success", {
        champions: championsResponse.items.length,
        augments: augmentsResponse.items.length,
        items: itemsResponse.items.length,
      });
    } catch (error) {
      debugLog.error("static-data", "loadStaticLists:error", error);
    }
  }

  async function syncStaticData() {
    const data = await runAction(setStaticSync, api.syncStaticData, {
      actionName: "syncStaticData",
      successMessage: "Static data synced",
    });

    if (data) {
      await loadStaticLists();
    }

    return data;
  }

  useEffect(() => {
    void loadStaticLists();
  }, []);

  const value = useMemo(
    () => ({
      staticSync,
      champions,
      items,
      augments,
      loadStaticLists,
      syncStaticData,
    }),
    [augments, champions, items, staticSync],
  );

  return <StaticDataContext value={value}>{children}</StaticDataContext>;
}

export function useStaticData() {
  const context = useContext(StaticDataContext);

  if (!context) {
    throw new Error("useStaticData must be used inside StaticDataProvider");
  }

  return context;
}
