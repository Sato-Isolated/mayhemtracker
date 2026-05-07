import type { MatchListItem, StaticDataEntry } from "@/lib/types";

function normalizeCommunityDragonIconUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^\/assets-cache\//i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const assetMatch = normalized.match(/\/lol-game-data\/assets\/(.+)$/i);
  if (assetMatch?.[1]) {
    return `https://raw.communitydragon.org/latest/game/assets/${assetMatch[1].toLowerCase()}`;
  }

  const gameMatch = normalized.match(/raw\.communitydragon\.org\/latest\/game\/(.+)$/i);
  if (gameMatch?.[1]) {
    return `https://raw.communitydragon.org/latest/game/${gameMatch[1].toLowerCase()}`;
  }

  return trimmed;
}

function getCommunityDragonIconCandidates(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return [] as string[];
  }

  if (/^\/assets-cache\//i.test(trimmed)) {
    return [trimmed];
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const assetMatch = normalized.match(/\/lol-game-data\/assets\/(.+)$/i);
  if (assetMatch?.[1]) {
    const originalAssetPath = assetMatch[1];
    const lowerAssetPath = originalAssetPath.toLowerCase();
    return [
      `https://raw.communitydragon.org/latest/game/assets/${originalAssetPath}`,
      `https://raw.communitydragon.org/latest/game/assets/${lowerAssetPath}`,
      trimmed,
    ];
  }

  const gameMatch = normalized.match(/raw\.communitydragon\.org\/latest\/game\/(.+)$/i);
  if (gameMatch?.[1]) {
    const gamePath = gameMatch[1];
    return [
      `https://raw.communitydragon.org/latest/game/${gamePath}`,
      `https://raw.communitydragon.org/latest/game/${gamePath.toLowerCase()}`,
      trimmed,
    ];
  }

  return [trimmed];
}

export function formatDate(value?: number) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-US");
}

export function formatDuration(value?: number) {
  if (!value) {
    return "-";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function getItemLabel(id: string, items: StaticDataEntry[]) {
  return items.find((item) => item.id === id)?.name ?? id;
}

export function getItemVisual(id: string, items: StaticDataEntry[]) {
  const item = items.find((entry) => entry.id === id);
  return {
    name: item?.name ?? id,
    icon: resolveStaticIconPath(item),
  };
}

export function getAugmentLabel(id: string, augments: StaticDataEntry[]) {
  return augments.find((augment) => augment.id === id)?.name ?? id;
}

export function getAugmentVisual(id: string, augments: StaticDataEntry[]) {
  const augment = augments.find((entry) => entry.id === id);
  const iconCandidates = Array.from(new Set([
    ...getCommunityDragonIconCandidates(augment?.icon_path ?? ""),
    ...getCommunityDragonIconCandidates(augment?.icon_url ?? ""),
  ])).filter(Boolean);

  return {
    name: augment?.name ?? id,
    rarity: augment?.rarity,
    icon: iconCandidates[0] ?? resolveStaticIconPath(augment),
    iconCandidates,
  };
}

export function resolveStaticIconPath(entry?: StaticDataEntry) {
  if (!entry) {
    return "";
  }

  return normalizeCommunityDragonIconUrl(entry.icon_path || entry.icon_url || "");
}

export function getChampionVisual(participant: MatchListItem["participants"][number], champions: StaticDataEntry[]) {
  if (!participant.championId) {
    return { name: participant.championName ?? "Unknown", icon: "" };
  }

  const champion = champions.find((entry) => entry.numeric_id === participant.championId);
  return {
    name: champion?.name ?? participant.championName ?? `Champion ${participant.championId}`,
    icon: champion?.icon_path ?? "",
  };
}