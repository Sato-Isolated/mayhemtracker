import { useEffect, useState } from "react";
import { debugLog } from "@/lib/debug-log";
import { getAugmentVisual } from "@/lib/tracker-utils";
import type { StaticDataEntry } from "@/lib/types";

const rarityBorderClass: Record<string, string> = {
  kSilver: "ring-2 ring-slate-200/90",
  kGold: "ring-2 ring-amber-200/90",
  kPrismatic: "ring-2 ring-fuchsia-200/90",
};

const rarityFallbackBorder = "ring-2 ring-slate-200/75";

export function AugmentIcon({
  augmentId,
  augments,
  size = 24,
  showName = false,
}: {
  augmentId: string;
  augments: StaticDataEntry[];
  size?: number;
  showName?: boolean;
}) {
  const visual = getAugmentVisual(augmentId, augments);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    debugLog.info("augment-icon", "resolve", {
      augmentId,
      name: visual.name,
      icon: visual.icon,
      iconCandidates: visual.iconCandidates,
    });
    setCandidateIndex(0);
  }, [augmentId, visual.icon]);

  if (!augmentId) {
    return null;
  }

  const currentIcon = visual.iconCandidates[candidateIndex] ?? visual.icon;
  const frameClass = rarityBorderClass[visual.rarity ?? ""] ?? rarityFallbackBorder;
  debugLog.debug("augment-icon", "render", {
    augmentId,
    candidateIndex,
    currentIcon,
    totalCandidates: visual.iconCandidates.length,
    rarity: visual.rarity,
  });

  return (
    <div className="flex min-w-0 items-center gap-1.5" title={visual.name}>
      {currentIcon ? (
        <div className={`flex items-center justify-center rounded-md bg-black p-1 ${frameClass}`} style={{ width: size + 8, height: size + 8 }}>
          <img
            src={currentIcon}
            alt={visual.name}
            width={size}
            height={size}
            className="rounded-[0.32rem] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            onError={() => {
              debugLog.warn("augment-icon", "img:error", {
                augmentId,
                failedIcon: currentIcon,
                candidateIndex,
                iconCandidates: visual.iconCandidates,
              });
              if (candidateIndex < visual.iconCandidates.length - 1) {
                setCandidateIndex((index) => index + 1);
              } else {
                setCandidateIndex(visual.iconCandidates.length);
              }
            }}
            onLoad={() => {
              debugLog.info("augment-icon", "img:load", {
                augmentId,
                loadedIcon: currentIcon,
                candidateIndex,
              });
            }}
          />
        </div>
      ) : (
        <div className={`rounded-md bg-black ${frameClass}`} style={{ width: size + 8, height: size + 8 }} />
      )}
      {showName ? <span className="truncate text-xs text-foreground">{visual.name}</span> : null}
    </div>
  );
}