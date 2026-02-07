type CrestPatternConfig = {
    tileSize: number;              // e.g. 220
    count: number;                 // number of icons per tile
    scaleRange: [number, number];  // e.g. [0.22, 0.32]
    rotateRange: [number, number]; // e.g. [-25, 25]
    strokeWidth: number;           // e.g. 1.05
    iconOpacity: number;           // internal SVG group opacity e.g. 0.12
    tint: string;                  // '#000000' or '#ffac00'
    overlayOpacity: number;        // CSS overlay opacity e.g. 0.07
    seed: number;                  // deterministic "random"
};

const CREST_PATH =
    `M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5`;

// Deterministic PRNG (mulberry32)
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randBetween(r: () => number, min: number, max: number) {
    return min + (max - min) * r();
}

function svgToDataUrlSafe(svg: string) {
    const cleaned = svg.replace(/\s{2,}/g, " ").trim();
    return `data:image/svg+xml,${encodeURIComponent(cleaned)}`;
}

export function makeIconPattern(config: CrestPatternConfig) {
    const r = mulberry32(config.seed);
    const tile = config.tileSize;

    // Spread points but avoid obvious rows/cols by using jittered "cells"
    // We'll place icons in a loose grid, then jitter heavily.
    const gridCols = Math.ceil(Math.sqrt(config.count));
    const gridRows = Math.ceil(config.count / gridCols);
    const cellW = tile / gridCols;
    const cellH = tile / gridRows;

    const instances: string[] = [];

    for (let i = 0; i < config.count; i++) {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);

        // Jitter within the cell (heavy jitter = less grid feel)
        const x = randBetween(r, col * cellW + cellW * 0.10, (col + 1) * cellW - cellW * 0.10);
        const y = randBetween(r, row * cellH + cellH * 0.10, (row + 1) * cellH - cellH * 0.10);

        const scale = randBetween(r, config.scaleRange[0], config.scaleRange[1]);
        const rot = randBetween(r, config.rotateRange[0], config.rotateRange[1]);

        // Slightly vary opacity per instance so it feels more organic
        const instanceOpacity = randBetween(r, config.iconOpacity * 0.75, config.iconOpacity * 1.05);

        instances.push(`
      <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)})"
         opacity="${instanceOpacity.toFixed(3)}">
        <path d="${CREST_PATH}" />
      </g>
    `);
    }

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">
      <defs>
        <pattern id="sdk-crest" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">
          <g stroke="${config.tint}" stroke-width="${config.strokeWidth}" fill="none"
             stroke-linecap="round" stroke-linejoin="round">
            ${instances.join("\n")}
          </g>
        </pattern>
      </defs>
      <rect width="${tile}" height="${tile}" fill="url(#sdk-crest)"/>
    </svg>
  `;

    const url = svgToDataUrlSafe(svg);

    return {
        svg,
        url,
        css: {
            backgroundImage: `url("${url}")`,
            backgroundRepeat: "repeat",
            backgroundSize: `${tile}px ${tile}px`,
            opacity: config.overlayOpacity,
            mixBlendMode: "multiply" as const,
        },
    };
}