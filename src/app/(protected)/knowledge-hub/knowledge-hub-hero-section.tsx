"use client";

import { useMemo } from "react";
import { makeIconPattern } from "./knowledge-hub-pattern";

const KnowledgeHubHeroSection = ({ children }: { children?: React.ReactNode }) => {
  const tileSize = 220; // you already have this

  const pattern = useMemo(() => {
    return makeIconPattern({
      tileSize,
      count: 7,                    // density (increase/decrease)
      scaleRange: [0.25, 0.65],     // smaller icons
      rotateRange: [-28, 28],       // organic rotation
      strokeWidth: 1.0,
      iconOpacity: 0.25,            // within SVG
      tint: "#000000be",              // black texture
      overlayOpacity: 0.8,         // overlay strength
      seed: 20260202,               // change for a new "random"
    });
  }, [tileSize]);

  return (
    <div
      className="relative overflow-hidden rounded-none shadow-md mb-8"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 40%, rgba(255, 170, 0, 0.3) 0%, transparent 55%),
          radial-gradient(circle at 80% 60%, rgba(255,200,90,0.3) 0%, transparent 60%),
          linear-gradient(135deg, #ffffff 0%, #fff7e6 55%, #ffffff 100%)
        `,
      }}
    >
      {/* Pattern overlay */}
      <div className="pointer-events-none absolute inset-0 pattern-animate" style={pattern.css} />

      {/* Soft wash in the bright center so pattern doesn't shout */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 55%)",
        }}
      />

      <div className="relative py-12 px-4 sm:px-6 lg:py-16 lg:px-8">{children}</div>
    </div>
  );
};

export default KnowledgeHubHeroSection;
