import fs from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";
import type { IconKind } from "../types/static-data.js";
import { logger } from "../utils/logger.js";

const inflightDownloads = new Map<string, Promise<string>>();
const failedDownloads = new Set<string>();

class HttpStatusError extends Error {
  status: number;

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeCommunityDragonPath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function buildCommunityDragonCandidates(originalPath: string) {
  const normalizedOriginal = normalizeCommunityDragonPath(originalPath);
  const normalizedLower = normalizedOriginal.toLowerCase();
  const candidates = [
    `https://raw.communitydragon.org/latest/game/assets/${normalizedLower}`,
    `https://raw.communitydragon.org/latest/game/assets/${normalizedOriginal}`,
    `https://raw.communitydragon.org/latest/game/${normalizedLower}`,
    `https://raw.communitydragon.org/latest/game/${normalizedOriginal}`,
  ];

  return [...new Set(candidates)];
}

function resolveAugmentIconUrls(sourcePath?: string) {
  logger.debug("icon-cache", "resolveAugmentIconUrls:start", { sourcePath });
  if (!sourcePath) {
    return [] as string[];
  }

  const normalized = normalizeCommunityDragonPath(sourcePath);
  const normalizedLower = normalized.toLowerCase();

  if (isAbsoluteUrl(sourcePath)) {
    const parsedUrl = new URL(sourcePath);
    const pathname = normalizeCommunityDragonPath(parsedUrl.pathname);

    const pluginAssetMatch = pathname.match(/lol-game-data\/assets\/(.+)$/i);
    if (pluginAssetMatch?.[1]) {
      const candidates = buildCommunityDragonCandidates(pluginAssetMatch[1]);
      logger.debug("icon-cache", "resolveAugmentIconUrls:absolute-plugin-asset", { sourcePath, candidates });
      return candidates;
    }

    const gameAssetsMatch = pathname.match(/game\/assets\/(.+)$/i);
    if (gameAssetsMatch?.[1]) {
      const candidates = buildCommunityDragonCandidates(gameAssetsMatch[1]);
      logger.debug("icon-cache", "resolveAugmentIconUrls:absolute-game-asset", { sourcePath, candidates });
      return candidates;
    }

    const gameMatch = pathname.match(/game\/(.+)$/i);
    if (gameMatch?.[1]) {
      const assetPath = gameMatch[1];
      return [
        `https://raw.communitydragon.org/latest/game/${assetPath.toLowerCase()}`,
        `https://raw.communitydragon.org/latest/game/${assetPath}`,
        sourcePath,
      ];
    }

    return [sourcePath];
  }

  if (/^lol-game-data\/assets\//i.test(normalized)) {
    const candidates = buildCommunityDragonCandidates(normalized.replace(/^lol-game-data\/assets\//i, ""));
    logger.debug("icon-cache", "resolveAugmentIconUrls:lol-game-data-assets", { sourcePath, candidates });
    return candidates;
  }

  if (/^assets\//i.test(normalized)) {
    const candidates = buildCommunityDragonCandidates(normalized.replace(/^assets\//i, ""));
    logger.debug("icon-cache", "resolveAugmentIconUrls:assets", { sourcePath, candidates });
    return candidates;
  }

  const candidates = [...new Set([
    `https://raw.communitydragon.org/latest/game/${normalizedLower}`,
    `https://raw.communitydragon.org/latest/game/${normalized}`,
  ])];
  logger.debug("icon-cache", "resolveAugmentIconUrls:default", { sourcePath, candidates });
  return candidates;
}

export class IconCacheService {
  getPreferredRemoteUrl(kind: IconKind, id: string, sourcePath?: string) {
    const url = this.resolveRemoteCandidates(kind, id, sourcePath)[0]?.url ?? "";
    logger.debug("icon-cache", "getPreferredRemoteUrl", { kind, id, sourcePath, url });
    return url;
  }

  async getCachedIconPath(kind: IconKind, id: string, sourcePath?: string) {
    const candidates = this.resolveRemoteCandidates(kind, id, sourcePath);
    const cacheDir = path.join(paths.iconCacheRoot, kind);
    fs.mkdirSync(cacheDir, { recursive: true });
    const extension = path.extname(candidates[0]?.url ?? ".png") || ".png";
    const localFileName = `${normalizePathSegment(id)}${extension}`;
    const localFilePath = path.join(cacheDir, localFileName);
    const publicPath = `/assets-cache/icons/${kind}/${localFileName}`;
    logger.info("icon-cache", "getCachedIconPath:start", { kind, id, sourcePath, candidates, localFilePath, publicPath });

    if (fs.existsSync(localFilePath)) {
      logger.info("icon-cache", "getCachedIconPath:cache-hit", { kind, id, publicPath });
      return publicPath;
    }

    const cacheKey = `${kind}:${id}`;
    const existing = inflightDownloads.get(cacheKey);
    if (existing) {
      logger.debug("icon-cache", "getCachedIconPath:inflight", { kind, id, cacheKey });
      return existing;
    }

    const task = this.downloadWithFallback(candidates, localFilePath, publicPath);
    inflightDownloads.set(cacheKey, task);

    try {
      return await task;
    } finally {
      inflightDownloads.delete(cacheKey);
    }
  }

  private async downloadWithFallback(
    candidates: Array<{ url: string }>,
    localFilePath: string,
    publicPath: string,
  ) {
    for (const candidate of candidates) {
      if (failedDownloads.has(candidate.url)) {
        logger.warn("icon-cache", "downloadWithFallback:skip-known-failed", candidate);
        continue;
      }

      logger.info("icon-cache", "downloadWithFallback:try", candidate);
      const success = await this.downloadWithRetry(candidate.url, localFilePath);
      if (success) {
        logger.info("icon-cache", "downloadWithFallback:success", { url: candidate.url, publicPath });
        return publicPath;
      }

      failedDownloads.add(candidate.url);
      logger.warn("icon-cache", "downloadWithFallback:failed", candidate);
    }

    logger.error("icon-cache", "downloadWithFallback:all-failed", { candidates, fallback: candidates[0]?.url ?? "" });
    return candidates[0]?.url ?? "";
  }

  private async downloadWithRetry(url: string, destination: string) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "MayhemTracker/0.1" },
        });
        if (!response.ok) {
          throw new HttpStatusError(response.status, url);
        }

        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(destination, Buffer.from(arrayBuffer));
        logger.info("icon-cache", "downloadWithRetry:write-success", { url, destination, size: arrayBuffer.byteLength, attempt });
        return true;
      } catch (error) {
        logger.warn("icon-cache", "downloadWithRetry:error", { url, destination, attempt, error });
        const nonRetriableStatus = error instanceof HttpStatusError && error.status >= 400 && error.status < 500 && error.status !== 429;
        if (nonRetriableStatus) {
          logger.warn("icon-cache", "downloadWithRetry:non-retriable", { url, status: error.status });
          return false;
        }

        if (attempt === 3) {
          return false;
        }

        await sleep(300 * 2 ** (attempt - 1));
      }
    }

    return false;
  }

  private resolveRemoteCandidates(kind: IconKind, id: string, sourcePath?: string) {
    const trimmedSource = sourcePath?.trim();

    if (kind === "champion") {
      let numericId: string | undefined;
      let fallbackUrl: string | undefined;

      if (trimmedSource) {
        try {
          const parsed = JSON.parse(trimmedSource) as { numericId?: number; fallbackUrl?: string };
          numericId = parsed.numericId ? String(parsed.numericId) : undefined;
          fallbackUrl = parsed.fallbackUrl;
        } catch {
          numericId = /^\d+$/.test(trimmedSource) ? trimmedSource : undefined;
        }
      }

      const candidates = [] as Array<{ url: string }>;
      if (numericId) {
        candidates.push({
          url: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${numericId}.png`,
        });
      }

      if (fallbackUrl) {
        candidates.push({ url: fallbackUrl });
      }

      return [
        ...candidates,
      ];
    }

    if (kind === "item") {
      const candidates = [] as Array<{ url: string }>;
      if (trimmedSource && isAbsoluteUrl(trimmedSource)) {
        candidates.push({ url: trimmedSource });
      }

      candidates.push({
        url: `https://www.leagueofgraphs.com/img/items/${id}.png`,
      });

      return [
        ...candidates,
      ];
    }

    const candidates = resolveAugmentIconUrls(trimmedSource).map((url) => ({ url }));

    candidates.push(
      {
        url: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/${id.toLowerCase()}.png`,
      },
      {
        url: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${id}`,
      },
    );

    return candidates;
  }
}

export const iconCacheService = new IconCacheService();
