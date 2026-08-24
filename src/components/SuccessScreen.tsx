import { CONFETTI_PIECES } from "../constants";

export function SuccessScreen({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center animate-fade-in relative z-10"
    >
      {/* Confetti */}
      <div className="relative w-full max-w-sm h-24 mb-2 overflow-hidden pointer-events-none">
        {CONFETTI_PIECES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              left: p.left,
              top: 0,
              animation: `confetti-fall 2.4s ${p.delay} ease-in forwards`,
            }}
          />
        ))}
      </div>

      {/* Heart */}
      <div
        className="text-5xl mb-8 animate-heart"
        style={{ filter: "drop-shadow(0 0 24px rgba(201,116,143,0.5))" }}
      >
        ♡
      </div>

      <h2
        className="text-4xl font-light mb-3 gradient-text"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        Wish delivered
      </h2>
      <p className="text-base leading-relaxed max-w-xs mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
        Your wish is on its way to{" "}
        <span style={{ color: "rgba(232,165,152,0.85)" }}>Samatha</span>. It will be waiting for her when she opens this page.
      </p>
      <button
        onClick={onBack}
        className="text-xs px-5 py-2.5 rounded-xl transition-all rainbow-border"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "none",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        Send another wish
      </button>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
