/** @returns the private-page footer. */

export function Footer() {
  return (
    <footer
      className="relative z-10 text-center py-10 px-5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
        Made with love ♡
      </p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
        This page is private. Your message is shared only with Samatha and is never posted publicly.
      </p>
    </footer>
  );
}

// ── Edge Demo Strip (design exhibit) ─────────────────────────────────────────
