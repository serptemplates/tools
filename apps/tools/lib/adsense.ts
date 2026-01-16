export type ToolAdSlotConfig = {
  left?: string;
  right?: string;
  inline?: string;
};

export const DEFAULT_ADSENSE_CLIENT = "ca-pub-2343633734899216";

export const DEFAULT_AD_SLOTS: ToolAdSlotConfig = {
  left: "7263001551",
  right: "7263001551",
  inline: "3136872527",
};

export const DEFAULT_ADSENSE_RESPONSIVE = true;

export const TOOL_AD_SLOTS: Record<string, ToolAdSlotConfig> = {};
