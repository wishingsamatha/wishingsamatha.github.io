import { useState, useEffect, useRef, useCallback } from "react";
import { AI_STEPS, TONE_DRAFTS } from "../constants";
import { getGeneratedMessage } from "../utils";
import type { EdgeState } from "../types";

export function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: 4,
            background: "rgba(232,165,152,0.8)",
            animation: `typing-dot 1.2s ${i * 0.18}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}

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

export function AIAssistant({ onDraftReady, onClose }: AIAssistantProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [editedDraft, setEditedDraft] = useState("");
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const currentStep = AI_STEPS[step];

  const scrollBottom = () => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
  };

  const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://wishingsamatha-github-io-5f.vercel.app");

  const handleChip = useCallback(
    async (chip: string) => {
      const newAnswers = { ...answers, [currentStep.key]: chip };
      setAnswers(newAnswers);
      setThinking(true);
      scrollBottom();
      try {
        const res = await fetch(`${API_BASE}/api/ai-compose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAnswers.name,
            relation: newAnswers.relation,
            memory: newAnswers.memory,
            tone: chip,
          }),
        });
        const data = await res.json();
        const generatedMessage = getGeneratedMessage(data);
        setDraft(generatedMessage);
        setEditedDraft(generatedMessage);
        setDone(true);
      } catch {
        const fallback = TONE_DRAFTS[chip] || TONE_DRAFTS["Warm & heartfelt"];
        setDraft(fallback);
        setEditedDraft(fallback);
        setDone(true);
      } finally {
        setThinking(false);
        scrollBottom();
      }
    },
    [answers, currentStep]
  );

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    const newAnswers = { ...answers, [currentStep.key]: input.trim() };
    setAnswers(newAnswers);
    setInput("");
    if (step < AI_STEPS.length - 1) {
      setStep((s) => s + 1);
      scrollBottom();
    } else {
      setThinking(true);
      scrollBottom();
      try {
        const res = await fetch(`${API_BASE}/api/ai-compose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAnswers.name,
            relation: newAnswers.relation,
            memory: newAnswers.memory,
            tone: 'Warm & heartfelt',
          }),
        });
        const data = await res.json();
        const generatedMessage = getGeneratedMessage(data);
        setDraft(generatedMessage);
        setEditedDraft(generatedMessage);
        setDone(true);
      } catch {
        setDraft(TONE_DRAFTS["Warm & heartfelt"]);
        setEditedDraft(TONE_DRAFTS["Warm & heartfelt"]);
        setDone(true);
      } finally {
        setThinking(false);
        scrollBottom();
      }
    }
  }, [input, answers, currentStep, step]);

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-xs"
            style={{ background: "linear-gradient(135deg,#E8A598,#C9748F)" }}
          >
            ✦
          </div>
          <span className="text-sm font-medium">AI Writing Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)" }}
        >
          ✕ Close
        </button>
      </div>

      {/* Chat scroll area */}
      <div
        ref={chatRef}
        className="rounded-2xl p-4 mb-4 space-y-3 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.4)", maxHeight: 280, minHeight: 180, border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {AI_STEPS.slice(0, step + 1).map((s, i) => (
          <div key={s.key}>
            {/* AI bubble */}
            <div className="flex items-start gap-2 mb-2">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5"
                style={{ background: "linear-gradient(135deg,#E8A598,#C9748F)" }}
              >
                ✦
              </div>
              <div
                className="text-sm px-3 py-2 rounded-2xl rounded-tl-none max-w-[80%]"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)" }}
              >
                {s.question}
              </div>
            </div>
            {/* User answer */}
            {answers[s.key] && (
              <div className="flex justify-end mb-2">
                <div
                  className="text-sm px-3 py-2 rounded-2xl rounded-tr-none max-w-[80%]"
                  style={{ background: "rgba(201,116,143,0.18)", color: "rgba(255,255,255,0.85)" }}
                >
                  {answers[s.key]}
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex items-start gap-2">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px]"
              style={{ background: "linear-gradient(135deg,#E8A598,#C9748F)" }}
            >
              ✦
            </div>
            <div
              className="px-3 py-2 rounded-2xl rounded-tl-none"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <TypingDots />
            </div>
          </div>
        )}

        {done && !thinking && (
          <div>
            <div className="flex items-start gap-2 mb-3">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5"
                style={{ background: "linear-gradient(135deg,#E8A598,#C9748F)" }}
              >
                ✦
              </div>
              <div
                className="text-sm px-3 py-2 rounded-2xl rounded-tl-none"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)" }}
              >
                Here's a draft I wrote for you. Feel free to edit it below.
              </div>
            </div>
            <textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              rows={4}
              className="w-full text-sm rounded-2xl p-3 resize-none outline-none transition-all"
              style={{
                background: "rgba(232,165,152,0.06)",
                border: "1px solid rgba(232,165,152,0.25)",
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={() => onDraftReady(editedDraft)}
              className="btn-primary rainbow-border w-full py-2.5 rounded-xl text-sm mt-2"
            >
              Use this message
            </button>
          </div>
        )}
      </div>

      {/* Tone chips (last step) */}
      {!done && !thinking && step === AI_STEPS.length - 1 && currentStep.chips && (
        <div className="flex flex-wrap gap-2 mb-3">
          {currentStep.chips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{
                background: "rgba(232,165,152,0.1)",
                border: "1px solid rgba(232,165,152,0.25)",
                color: "rgba(232,165,152,0.9)",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input (non-chip steps) */}
      {!done && !thinking && !(step === AI_STEPS.length - 1 && currentStep.chips) && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
          <button
            onClick={handleSubmit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-opacity"
            style={{
              background: "linear-gradient(135deg,#E8A598,#C9748F)",
              color: "#0a0a0a",
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Composer ──────────────────────────────────────────────────────────────────

interface ComposerProps {
  onSuccess: () => void;
  setEdge: (e: EdgeState) => void;
}

