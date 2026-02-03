export interface EventPalette {
  background: string;
  border: string;
  text: string;
}

const DEFAULT_PALETTE: EventPalette = {
  background: "#F3F4F6",
  border: "#9CA3AF",
  text: "#111827",
};

const EVENT_COLOR_MAP: Record<string, EventPalette> = {
  funeral: { background: "#FEE2E2", border: "#F87171", text: "#7F1D1D" },
  funeral_pickup: { background: "#FEF3C7", border: "#FBBF24", text: "#7C2D12" },
  funeral_bathing: {
    background: "#DBEAFE",
    border: "#3B82F6",
    text: "#1E3A8A",
  },
  funeral_tent: { background: "#E0F2FE", border: "#0EA5E9", text: "#0F172A" },
  funeral_delivery: {
    background: "#FCE7F3",
    border: "#EC4899",
    text: "#831843",
  },
  funeral_service: {
    background: "#DCFCE7",
    border: "#22C55E",
    text: "#064E3B",
  },
  funeral_burial: { background: "#FDE68A", border: "#F59E0B", text: "#78350F" },
  meeting: { background: "#E0E7FF", border: "#6366F1", text: "#1E3A8A" },
  shift: { background: "#F3E8FF", border: "#A855F7", text: "#581C87" },
  training: { background: "#DBF4FF", border: "#38BDF8", text: "#0E7490" },
  task: { background: "#FFE4E6", border: "#FB7185", text: "#9F1239" },
};

const getPaletteForKey = (key?: string | null): EventPalette | undefined => {
  if (!key) return undefined;
  return EVENT_COLOR_MAP[key.toLowerCase()];
};

export const getEventPalette = (event?: {
  type?: string;
  subType?: string;
  milestone?: string | null;
}): EventPalette => {
  if (!event) return DEFAULT_PALETTE;
  return (
    getPaletteForKey(event.subType || event.milestone) ||
    getPaletteForKey(event.type) ||
    DEFAULT_PALETTE
  );
};

export const paletteToFullCalendarColors = (palette: EventPalette) => ({
  backgroundColor: palette.background,
  borderColor: palette.border,
  textColor: palette.text,
});
