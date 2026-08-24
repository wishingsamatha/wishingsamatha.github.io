import type { EdgeState } from "../types";

interface EdgeModalProps {
  state: EdgeState;
  onClose: () => void;
  onRetry?: () => void;
}

export function EdgeModal({ state, onClose, onRetry }: EdgeModalProps) {
  if (!state) return null;

  const configs: Record<
    NonNullable<EdgeState>,
    { icon: string; title: string; body: string; cta?: string; ctaAction?: () => void }
  > = {
    empty: {
      icon: "✦",
      title: "Your wish is blank",
      body: "Write something — even a single sentence means the world. Samatha will treasure every word.",
      cta: "Go back",
      ctaAction: onClose,
    },
    "mic-denied": {
      icon: "🎙",
      title: "Microphone access denied",
      body: "To record a voice note, allow microphone access in your browser settings. Reload the page after enabling it.",
      cta: "Use text instead",
      ctaAction: onClose,
    },
    "network-error": {
      icon: "↺",
      title: "Couldn't send your wish",
      body: "Something went wrong on the network. Your message is safely preserved here.",
      cta: "Try again",
      ctaAction: onRetry,
    },
    inappropriate: {
      icon: "✦",
      title: "Let's keep it kind",
      body: "The AI flagged some content that might not be appropriate. Take another look — a sincere wish will mean far more.",
      cta: "Edit message",
      ctaAction: onClose,
    },
    "rate-limit": {
      icon: "◌",
      title: "Slow down a little",
      body: "You've sent several wishes in a short time. Come back in a few minutes — your message will be just as meaningful then.",
    },
    "email-failed": {
      icon: "✓",
      title: "Wish delivered — almost",
      body: "Your wish reached our server, but the email or Telegram notification didn't go through. Don't worry — Samatha will still receive it.",
      cta: "Understood",
      ctaAction: onClose,
    },
  };

  const c = configs[state];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl p-8 max-w-sm w-full animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg mb-5"
          style={{ background: "rgba(201,116,143,0.15)", border: "1px solid rgba(201,116,143,0.25)" }}
        >
          {c.icon}
        </div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          {c.title}
        </h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
          {c.body}
        </p>
        <div className="flex gap-3">
          {c.cta && (
            <button
              onClick={c.ctaAction || onClose}
              className="btn-primary rainbow-border flex-1 py-3 rounded-xl text-sm"
            >
              {c.cta}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Assistant Panel ────────────────────────────────────────────────────────

interface AIAssistantProps {
  onDraftReady: (draft: string) => void;
  onClose: () => void;
}
