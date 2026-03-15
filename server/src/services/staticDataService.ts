import fs from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";
import { staticDataRepository } from "../repositories/staticDataRepository.js";
import type {
  AugmentStaticData,
  ChampionStaticData,
  ItemStaticData,
  StaticDataSyncResult,
} from "../types/static-data.js";
import { logger } from "../utils/logger.js";
import { iconCacheService } from "./iconCacheService.js";

const STATIC_DATA_SIGNATURE = "cdragon-cherry-v4";

interface DataDragonChampionResponse {
  version: string;
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      title: string;
      image?: { full?: string };
    }
  >;
}

interface DataDragonItemResponse {
  version: string;
  data: Record<
    string,
    {
      name: string;
      description?: string;
      image?: { full?: string };
    }
  >;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    return Object.values(value) as T[];
  }

  return [];
}

export class StaticDataService {
  async syncAll(): Promise<StaticDataSyncResult> {
    logger.info("static-data", "syncAll:start");
    const version = await this.getCurrentDataDragonVersion();
    const existingVersion = staticDataRepository.getMetadata("ddragon_version")?.value;
    const existingSignature = staticDataRepository.getMetadata("static_data_signature")?.value;
    logger.info("static-data", "syncAll:state", { version, existingVersion, existingSignature, signature: STATIC_DATA_SIGNATURE });

    if (existingVersion === version && existingSignature === STATIC_DATA_SIGNATURE) {
      logger.info("static-data", "syncAll:reuse-cache", { version });
      return {
        version,
        champions: staticDataRepository.listChampions().length,
        items: staticDataRepository.listItems().length,
        augments: staticDataRepository.listAugments().length,
        reused: true,
      };
    }

    const [champions, items, augments] = await Promise.all([
      this.fetchChampions(version),
      this.fetchItems(version),
      this.fetchAugments(version),
    ]);
    logger.info("static-data", "syncAll:fetched", { champions: champions.length, items: items.length, augments: augments.length });

    staticDataRepository.upsertChampions(champions);
    staticDataRepository.upsertItems(items);
    staticDataRepository.upsertAugments(augments);
    staticDataRepository.setMetadata("ddragon_version", version);
    staticDataRepository.setMetadata("static_data_signature", STATIC_DATA_SIGNATURE);

    fs.writeFileSync(
      path.join(paths.staticDataRoot, "sync-state.json"),
      JSON.stringify({ version, syncedAt: new Date().toISOString() }, null, 2),
    );

    return {
      version,
      champions: champions.length,
      items: items.length,
      augments: augments.length,
      reused: false,
    };
  }

  listChampions() {
    return staticDataRepository.listChampions();
  }

  listItems() {
    return staticDataRepository.listItems();
  }

  listAugments() {
    return staticDataRepository.listAugments();
  }

  private async getCurrentDataDragonVersion() {
    const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = (await response.json()) as string[];
    const version = versions[0];
    if (!version) {
      throw new Error("Unable to resolve Data Dragon version.");
    }

    return version;
  }

  private async fetchChampions(version: string): Promise<ChampionStaticData[]> {
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    );
    const payload = (await response.json()) as DataDragonChampionResponse;

    const champions = await Promise.all(
      Object.values(payload.data).map(async (champion) => {
        const numericId = Number(champion.key);
        const fallbackIconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image?.full ?? `${champion.id}.png`}`;
        const primaryIconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champion.key}.png`;
        const iconPath = await iconCacheService.getCachedIconPath(
          "champion",
          champion.id,
          JSON.stringify({ numericId, fallbackUrl: fallbackIconUrl }),
        );

        return {
          id: champion.id,
          numericId,
          key: champion.key,
          name: champion.name,
          title: champion.title,
          iconPath,
          iconUrl: primaryIconUrl,
          version,
          rawPayload: JSON.stringify(champion),
        } satisfies ChampionStaticData;
      }),
    );

    return champions;
  }

  private async fetchItems(version: string): Promise<ItemStaticData[]> {
    const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
    const payload = (await response.json()) as DataDragonItemResponse;

    const items = await Promise.all(
      Object.entries(payload.data).map(async ([id, item]) => {
        const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image?.full ?? `${id}.png`}`;
        const iconPath = await iconCacheService.getCachedIconPath("item", id, iconUrl);

        return {
          id,
          name: item.name,
          description: item.description,
          iconPath,
          iconUrl,
          version,
          rawPayload: JSON.stringify(item),
        } satisfies ItemStaticData;
      }),
    );

    return items;
  }

  private async fetchAugments(version: string): Promise<AugmentStaticData[]> {
    logger.info("static-data", "fetchAugments:start", { version });
    const response = await fetch(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json",
    );
    const payload = (await response.json()) as unknown;
    const rows = asArray<Record<string, unknown>>(payload);

    const unique = new Map<string, AugmentStaticData>();

    for (const row of rows) {
      const id = String(row.id ?? row.apiName ?? row.nameTRA ?? row.name ?? "").trim();
      if (!id || unique.has(id)) {
        continue;
      }

      const name = String(row.nameTRA ?? row.name ?? id).trim();
      const description = String(row.descTRA ?? row.desc ?? row.descriptionTRA ?? "").trim() || undefined;
      const rarity = row.rarity ? String(row.rarity) : undefined;
      const sourcePath = String(
        row.augmentSmallIconPath
          ?? row.augmentIconPath
          ?? row.iconPath
          ?? row.iconSmall
          ?? row.iconLarge
          ?? row.smallIconPath
          ?? "",
      ).trim();
      logger.debug("static-data", "fetchAugments:row", { id, name, rarity, sourcePath, row });
      const iconPath = await iconCacheService.getCachedIconPath("augment", id, sourcePath || undefined);
      const iconUrl = iconCacheService.getPreferredRemoteUrl("augment", id, sourcePath || undefined) || undefined;
      logger.info("static-data", "fetchAugments:icon-resolved", { id, sourcePath, iconPath, iconUrl });

      unique.set(id, {
        id,
        name,
        description,
        rarity,
        iconPath,
        iconUrl,
        version,
        rawPayload: JSON.stringify(row),
      });
    }

    const augments = [...unique.values()];
    logger.info("static-data", "fetchAugments:done", { total: augments.length, sample: augments[0] });
    return augments;
  }
}

export const staticDataService = new StaticDataService();
