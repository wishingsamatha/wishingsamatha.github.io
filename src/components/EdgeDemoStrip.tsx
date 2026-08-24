import type { EdgeState } from "../types";

export function EdgeDemoStrip({ onShow }: { onShow: (e: EdgeState) => void }) {
  const states: { label: string; state: NonNullable<EdgeState> }[] = [
    { label: "Empty message", state: "empty" },
    { label: "Mic denied", state: "mic-denied" },
    { label: "Network error", state: "network-error" },
    { label: "Inappropriate", state: "inappropriate" },
    { label: "Rate limit", state: "rate-limit" },
    { label: "Email failed", state: "email-failed" },
  ];
  return (
    <section className="relative z-10 px-5 pb-12">
      <div className="mx-auto" style={{ maxWidth: 620 }}>
        <p className="text-xs uppercase tracking-widest text-center mb-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          Edge states
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {states.map((s) => (
            <button
              key={s.state}
              onClick={() => onShow(s.state)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
