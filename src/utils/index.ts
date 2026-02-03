export function generateCemeteryCode(name: string, city?: string): string {
  if (!name) throw new Error("Cemetery name required");

  const STOP_WORDS = ["cemetery", "memorial", "park", "graveyard", "burial"];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const words = normalize(name).filter((w) => !STOP_WORDS.includes(w));

  // fallback if everything got stripped
  const baseWords = words.length ? words : normalize(name);

  const initials = baseWords
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const cityCode = city
    ? normalize(city)
        .slice(0, 1)
        .map((w) => w.slice(0, 3))
        .join("")
        .toUpperCase()
    : "";

  return cityCode ? `${initials}-${cityCode}` : initials;
}
