import { instagram } from "@/app/lib/platforms/instagram";
import { twitter } from "@/app/lib/platforms/twitter";
import type { Platform, PlatformAdapter } from "@/app/lib/platforms/types";

export const PlatformAdapters: Record<Platform, PlatformAdapter> = {
  instagram,
  twitter,
};
