export type IconKind = "champion" | "item" | "augment";

export interface ChampionStaticData {
  id: string;
  numericId: number;
  key: string;
  name: string;
  title?: string;
  iconPath: string;
  iconUrl: string;
  version: string;
  rawPayload: string;
}

export interface ItemStaticData {
  id: string;
  name: string;
  description?: string;
  iconPath: string;
  iconUrl: string;
  version: string;
  rawPayload: string;
}

export interface AugmentStaticData {
  id: string;
  name: string;
  description?: string;
  rarity?: string;
  iconPath: string;
  iconUrl?: string;
  version: string;
  rawPayload: string;
}

export interface StaticDataSyncResult {
  version: string;
  champions: number;
  items: number;
  augments: number;
  reused: boolean;
}
