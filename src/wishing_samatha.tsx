import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "write" | "voice";
type MicState = "idle" | "recording" | "processing" | "success";
type AppScreen = "hero" | "composer" | "success";
type EdgeState =
  | null
  | "empty"
  | "mic-denied"
  | "network-error"
  | "inappropriate"
  | "rate-limit"
  | "email-failed";

// ── Slideshow photos (Unsplash) ───────────────────────────────────────────────

const SLIDES = [
  // {
  //   id: "photo-1",
  //   kb: "animate-kb-1",
  //   alt: "Photo 1",
  //   src: "/images/Photo 1.jpg",
  // },
  // {
  //   id: "photo-2",
  //   kb: "animate-kb-2",
  //   alt: "Photo 2",
  //   src: "/images/Photo 2.jpg",
  // },
  {
    id: "photo-3",
    kb: "animate-kb-3",
    alt: "Photo 3",
    src: "/images/Photo 3.jpg",
  },
  {
    id: "photo-4",
    kb: "animate-kb-4",
    alt: "Photo 4",
    src: "/images/Photo 4.jpg",
  },
  {
    id: "photo-5",
    kb: "animate-kb-5",
    alt: "Photo 5",
    src: "/images/Photo 5.jpg",
  },
];

// ── AI conversation flow ──────────────────────────────────────────────────────

const AI_STEPS = [
  { key: "name", question: "What's your name?" },
  { key: "relation", question: "How do you know Samatha?" },
  { key: "memory", question: "Any special memory you share?" },
  {
    key: "tone",
    question: "What tone would you like?",
    chips: ["Warm & heartfelt", "Short & sweet", "Deeply emotional", "Playful & funny"],
  },
];

const TONE_DRAFTS: Record<string, string> = {
  "Warm & heartfelt":
    "Samatha, knowing you has been one of the quiet gifts I never expected. You have this rare way of making the people around you feel truly seen. On this birthday, I hope the warmth you pour into the world comes rushing back to you tenfold. Happy birthday — you deserve every beautiful thing.",
  "Short & sweet":
    "Happy birthday, Samatha! Wishing you a day as wonderful as you are. Here's to another year of laughing too hard and making memories worth keeping. 🎂",
  "Deeply emotional":
    "Samatha — there are people who change the texture of your days simply by existing in your life. You are one of those people for me. Today I want you to know how deeply you matter, not just for what you do, but for who you are. Happy birthday, with all my heart.",
  "Playful & funny":
    "Happy birthday to someone who somehow gets better-looking AND funnier every year. Truly unfair for the rest of us. May your cake be huge, your candles few, and your selfies always fire. You absolute legend.",
};

// ── Confetti pieces ───────────────────────────────────────────────────────────

const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: ["#E8A598", "#C9748F", "#D4A574", "rgba(255,255,255,0.6)"][i % 4],
  left: `${5 + (i * 5.2) % 90}%`,
  delay: `${(i * 0.12).toFixed(2)}s`,
  size: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5,
}));

// ── Sub-components ────────────────────────────────────────────────────────────

function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, [current]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {SLIDES.map((slide, i) => {
        const isActive = i === current;
        const isPrev = i === prev;
        return (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
            style={{ opacity: isActive ? 1 : isPrev ? 0 : 0, zIndex: isActive ? 2 : isPrev ? 1 : 0 }}
          >
            <img
              src={`https://images.unsplash.com/photo-${slide.id}?w=1600&h=900&fit=crop&auto=format`}
              alt={slide.alt}
              className={`w-full h-full object-cover ${slide.kb}`}
            />
          </div>
        );
      })}
      {/* layered overlay */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 40%, rgba(10,10,10,0.75) 80%, rgba(10,10,10,0.95) 100%)" }} />
    </div>
  );
}

function SlideIndicator({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {SLIDES.map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            width: i === current ? 20 : 4,
            height: 4,
            background: i === current ? "linear-gradient(90deg,#E8A598,#C9748F)" : "rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </div>
  );
}

function TypingDots() {
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

function EdgeModal({ state, onClose, onRetry }: EdgeModalProps) {
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
              className="btn-primary flex-1 py-3 rounded-xl text-sm"
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

function AIAssistant({ onDraftReady, onClose }: AIAssistantProps) {
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

  const handleChip = useCallback(
    (chip: string) => {
      const newAnswers = { ...answers, [currentStep.key]: chip };
      setAnswers(newAnswers);
      setThinking(true);
      scrollBottom();
      setTimeout(() => {
        setThinking(false);
        const generated = TONE_DRAFTS[chip] || TONE_DRAFTS["Warm & heartfelt"];
        setDraft(generated);
        setEditedDraft(generated);
        setDone(true);
        scrollBottom();
      }, 1800);
    },
    [answers, currentStep]
  );

  const handleSubmit = useCallback(() => {
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
      setTimeout(() => {
        setThinking(false);
        setDraft(TONE_DRAFTS["Warm & heartfelt"]);
        setEditedDraft(TONE_DRAFTS["Warm & heartfelt"]);
        setDone(true);
        scrollBottom();
      }, 2000);
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
              className="btn-primary w-full py-2.5 rounded-xl text-sm mt-2"
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

function Composer({ onSuccess, setEdge }: ComposerProps) {
  const [tab, setTab] = useState<Tab>("write");
  const [message, setMessage] = useState("");
  const [micState, setMicState] = useState<MicState>("idle");
  const [showAI, setShowAI] = useState(false);
  const [sending, setSending] = useState(false);
  const MAX = 500;

  const handleSend = useCallback(() => {
    if (tab === "write" && !message.trim()) {
      setEdge("empty");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      // Randomly show edge state demo or success
      onSuccess();
    }, 1400);
  }, [tab, message, onSuccess, setEdge]);

  const handleMic = useCallback(() => {
    if (micState === "idle") {
      // Try to access mic
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then(() => {
          setMicState("recording");
          setTimeout(() => {
            setMicState("processing");
            setTimeout(() => setMicState("success"), 1200);
          }, 3000);
        })
        .catch(() => {
          setEdge("mic-denied");
        });
    } else if (micState === "recording") {
      setMicState("processing");
      setTimeout(() => setMicState("success"), 1200);
    }
  }, [micState, setEdge]);

  const micConfig = {
    idle: { label: "Tap to record", icon: "🎙", ring: false, color: "rgba(255,255,255,0.08)" },
    recording: { label: "Recording… tap to stop", icon: "⏹", ring: true, color: "rgba(201,116,143,0.3)" },
    processing: { label: "Processing…", icon: "◌", ring: false, color: "rgba(212,165,116,0.2)" },
    success: { label: "Voice note ready", icon: "✓", ring: false, color: "rgba(232,165,152,0.2)" },
  }[micState];

  return (
    <section id="composer" className="relative z-10 px-5 py-16" style={{ background: "transparent" }}>
      <div className="mx-auto" style={{ maxWidth: 620 }}>
        {/* Section label */}
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(232,165,152,0.6)" }}>
            Leave a wish
          </p>
          <h2
            className="text-3xl font-light"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Say something to{" "}
            <span className="gradient-text italic">Samatha</span>
          </h2>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-6 md:p-8 animate-fade-in-up delay-200">
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {(["write", "voice"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                style={
                  tab === t
                    ? {
                      background: "linear-gradient(135deg,rgba(232,165,152,0.2),rgba(201,116,143,0.2))",
                      color: "#E8A598",
                      border: "1px solid rgba(232,165,152,0.2)",
                    }
                    : { color: "rgba(255,255,255,0.4)" }
                }
              >
                {t === "write" ? "✏ Write a message" : "🎙 Voice note"}
              </button>
            ))}
          </div>

          {/* Write tab */}
          {tab === "write" && (
            <div className="animate-fade-in">
              {showAI ? (
                <AIAssistant
                  onDraftReady={(draft) => {
                    setMessage(draft);
                    setShowAI(false);
                  }}
                  onClose={() => setShowAI(false)}
                />
              ) : (
                <>
                  <div className="relative mb-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                      placeholder="Write your birthday wish…"
                      rows={5}
                      className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.9)",
                        lineHeight: 1.7,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(232,165,152,0.35)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      }}
                    />
                    <span
                      className="absolute bottom-3 right-4 text-xs"
                      style={{ color: message.length > MAX * 0.9 ? "#E8A598" : "rgba(255,255,255,0.25)" }}
                    >
                      {message.length}/{MAX}
                    </span>
                  </div>

                  {/* AI chip */}
                  <button
                    onClick={() => setShowAI(true)}
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-5 transition-all"
                    style={{
                      background: "rgba(232,165,152,0.08)",
                      border: "1px solid rgba(232,165,152,0.2)",
                      color: "rgba(232,165,152,0.8)",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
                      style={{ background: "linear-gradient(135deg,#E8A598,#C9748F)", color: "#0a0a0a" }}
                    >
                      ✦
                    </span>
                    Not sure what to say? Let AI help
                  </button>
                </>
              )}
            </div>
          )}

          {/* Voice tab */}
          {tab === "voice" && (
            <div className="animate-fade-in flex flex-col items-center py-6 gap-5">
              <div className="relative">
                {micState === "recording" && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse-ring"
                    style={{ background: "rgba(201,116,143,0.15)", transform: "scale(1.4)" }}
                  />
                )}
                <button
                  onClick={handleMic}
                  className="relative w-20 h-20 rounded-full text-2xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: micConfig.color,
                    border: `2px solid ${micState === "recording" ? "rgba(201,116,143,0.6)" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: micState === "recording" ? "0 0 0 0 rgba(201,116,143,0.7)" : "none",
                    animation: micState === "recording" ? "recording-ring 1.2s ease-out infinite" : "none",
                  }}
                >
                  {micConfig.icon}
                </button>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {micConfig.label}
              </p>

              {micState === "success" && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl animate-fade-in"
                  style={{ background: "rgba(232,165,152,0.1)", border: "1px solid rgba(232,165,152,0.2)" }}
                >
                  {/* Fake waveform */}
                  <div className="flex items-center gap-0.5 h-5">
                    {[3, 7, 5, 10, 6, 9, 4, 8, 5, 7, 3, 6].map((h, i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full"
                        style={{ height: h * 1.5, background: "linear-gradient(to top,#C9748F,#E8A598)" }}
                      />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "rgba(232,165,152,0.8)" }}>
                    0:03
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Send button */}
          {!showAI && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 mt-2"
              style={{ opacity: sending ? 0.7 : 1 }}
            >
              {sending ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-t-transparent border-black/40 animate-spin inline-block"
                  />
                  Sending…
                </>
              ) : (
                "Send your wish →"
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({ onBack }: { onBack: () => void }) {
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
        className="text-xs px-5 py-2.5 rounded-xl transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        Send another wish
      </button>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="relative z-10 text-center py-10 px-5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
        Made with love, privately ♡
      </p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
        This page is private. Your message is shared only with Samatha and is never posted publicly.
      </p>
    </footer>
  );
}

// ── Edge Demo Strip (design exhibit) ─────────────────────────────────────────

function EdgeDemoStrip({ onShow }: { onShow: (e: EdgeState) => void }) {
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

function HeroSection({ onCTA }: { onCTA: () => void }) {
  const [slideCurrent, setSlideCurrent] = useState(0);



  const nextSlide = () => setSlideCurrent((c) => (c + 1) % SLIDES.length);
  const prevSlide = () => setSlideCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl h-[60vh] max-h-[500px] z-0 overflow-hidden rounded-[2.5rem]" style={{ boxShadow: "0 0 80px rgba(232,165,152,0.1)" }}>
        {SLIDES.map((slide, i) => {
          let offset = i - slideCurrent;
          return (
            <div
              key={slide.id}
              className="absolute inset-0 transition-transform duration-[1500ms] ease-in-out pointer-events-none"
              style={{
                transform: `translateX(${offset * 100}%)`,
              }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className={`w-full h-full object-cover ${slide.kb}`}
              />
            </div>
          );
        })}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.7) 100%)" }}
        />

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full text-white transition-all hover:scale-110 hover:bg-white/20"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full text-white transition-all hover:scale-110 hover:bg-white/20"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          →
        </button>
      </div>

      <div className="relative z-20 flex flex-col items-center gap-6">
        {/* Eyebrow */}
        <div
          className="animate-fade-in-up text-xs uppercase tracking-[0.25em] px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          A private birthday page
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up delay-200 text-5xl md:text-7xl font-light leading-none"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", maxWidth: 700 }}
        >
          Happy Birthday,{" "}
          <em className="shimmer-text not-italic block md:inline">Samatha</em>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up delay-300 text-base md:text-lg font-light max-w-xs"
          style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}
        >
          A small gift, from the people who love you — just for today.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up delay-500 flex flex-col items-center gap-3">
          <button
            onClick={onCTA}
            className="btn-primary px-8 py-4 rounded-2xl text-sm tracking-wide"
          >
            Leave a wish
          </button>
          <a
            href="#composer"
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ↓ scroll
          </a>
        </div>

        {/* Slide indicator */}
        <div className="animate-fade-in-up delay-700">
          <SlideIndicator current={slideCurrent} />
        </div>
      </div>

    </section>
  );
}


// ── Root ──────────────────────────────────────────────────────────────────────

export default function WishingSamatha() {
  const [screen, setScreen] = useState<AppScreen>("hero");
  const [edge, setEdge] = useState<EdgeState>(null);

  const scrollToComposer = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  };

  if (screen === "success") {
    return (
      <>
        {/* background still shows on success */}
        <SuccessScreen onBack={() => setScreen("hero")} />
        <EdgeModal state={edge} onClose={() => setEdge(null)} />
      </>
    );
  }

  return (
    <div style={{ background: "transparent", minHeight: "100vh" }}>
      <HeroSection onCTA={scrollToComposer} />
      <Composer onSuccess={() => setScreen("success")} setEdge={setEdge} />
      <EdgeDemoStrip onShow={setEdge} />
      <Footer />
      <EdgeModal state={edge} onClose={() => setEdge(null)} onRetry={() => { setEdge(null); setScreen("success"); }} />
    </div>
  );
}
