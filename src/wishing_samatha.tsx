import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { Balloons } from "@/components/ui/balloons";
import CakeSection from "./CakeSection";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "write" | "voice";
type MicState = "idle" | "recording" | "processing" | "success";
type AppScreen = "hero" | "composer" | "success" | "view";
type EdgeState =
  | null
  | "empty"
  | "mic-denied"
  | "network-error"
  | "inappropriate"
  | "rate-limit"
  | "email-failed";

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

const ENGLISH_BANNED_WORDS = [
  "fuck",
  "lanza",
  "pooku",
  "gudda",
  "Denggutha",
  "munda",
  "balisindda",
  "gudda balisindda",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "damn",
  "cunt",
  "dick",
  "piss",
  "slut",
  "whore",
  "motherfucker",
  "fucker",
  "douchebag",
  "wanker",
  "twat",
  "prick",
  "dickhead",
  "ass",
  "arse",
  "bugger",
  "bollocks",
  "wank",
  "tosser",
];

const TELUGU_BANNED_WORDS = [
  "లంజ",
  "లంజోడుకా",
  "గుడ్డ",
  "గుడ్డ బలిసిన",
  "దెంగై",
  "దెంగుతా",
  "మొడ్డ",
  "పూకు",
  "పూక",
  "సుల్లి",
  "సుల్లి గుడ్డ",
  "బొంద",
  "బలిసిన",
  "నా మొడ్డ",
  "నీ మొడ్డ",
  "అమ్మ",
  "నీ అమ్మ",
  "చెత్త",
  "చెత్త నా కొడకా",
  "వెధవ",
  "వెధవా",
  "పిచ్చోడా",
  "ఎర్రి పూకా",
  "ఎర్రి పూక",
  "దెంగు",
  "దెంగుతున్నా",
  "గాడిద",
  "గాడిద కొడకా",
  "కుక్క",
  "కుక్క కొడకా",
  "పంది",
  "పంది కొడకా",
  "లంజ కొడకా",
];

function containsInappropriate(text: string): boolean {
  const lower = text.toLowerCase();
  const hasEnglish = ENGLISH_BANNED_WORDS.some((word) => new RegExp(`\\b${word}\\b`, "i").test(lower));
  const hasTelugu = TELUGU_BANNED_WORDS.some((word) => lower.includes(word.toLowerCase()));

  return hasEnglish || hasTelugu;
}

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

function getGeneratedMessage(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "generatedMessage" in data &&
    typeof data.generatedMessage === "string" &&
    data.generatedMessage.trim()
  ) {
    return data.generatedMessage;
  }

  throw new Error("AI response did not include a message");
}

// ── Confetti pieces ───────────────────────────────────────────────────────────

const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: ["#E8A598", "#C9748F", "#D4A574", "rgba(255,255,255,0.6)"][i % 4],
  left: `${5 + (i * 5.2) % 90}%`,
  delay: `${(i * 0.12).toFixed(2)}s`,
  size: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5,
}));

// ── Sub-components ────────────────────────────────────────────────────────────

function BirthdayCalendar() {
  const year = new Date().getFullYear();
  const month = 7;
  const birthdayDay = 25;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => `blank-${i}`);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      className="inline-block rounded-lg p-1.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(232,131,106,0.2)",
        backdropFilter: "blur(6px)",
        width: 92,
        fontFamily: "var(--font-outfit)",
      }}
    >
      <p
        className="mb-1 text-center"
        style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b09290", lineHeight: 1 }}
      >
        Aug {year}
      </p>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={index}
            className="text-center"
            style={{ fontSize: 6, color: "#6e6268", lineHeight: 1, paddingTop: 1 }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((blank) => (
          <div key={blank} style={{ height: 12 }} />
        ))}

        {days.map((day) => {
          const isBirthday = day === birthdayDay;
          return (
            <div
              key={day}
              className="relative flex items-center justify-center rounded-sm"
              style={{
                height: 12,
                fontSize: 7,
                background: isBirthday
                  ? "linear-gradient(135deg, rgba(232,131,106,0.4), rgba(196,96,74,0.3))"
                  : "transparent",
                border: isBirthday ? "1px solid rgba(232,131,106,0.5)" : "none",
                color: isBirthday ? "#f5f0eb" : "#6e6268",
                fontWeight: isBirthday ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {day}
              {isBirthday && (
                <span className="absolute -right-1 -top-1.5" style={{ fontSize: 8, lineHeight: 1 }} title="Samatha's Birthday">
                  🎂
                </span>
              )}
            </div>
          );
        })}
      </div>
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

function Composer({ onSuccess, setEdge }: ComposerProps) {
  const [tab, setTab] = useState<Tab>("write");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [nameError, setNameError] = useState("");
  const [micState, setMicState] = useState<MicState>("idle");
  const [showAI, setShowAI] = useState(false);
  const [sending, setSending] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [showCakeModal, setShowCakeModal] = useState(false);
  const [cakeSuccess, setCakeSuccess] = useState(false);
  const MAX = 500;

  const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://wishingsamatha-github-io-5f.vercel.app");

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setMicState('processing');
        try {
          const res = await fetch(`${API_BASE}/api/voice-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64 }),
          });
          const data = await res.json();
          setAudioUrl(data.audioUrl);
          setMicState('success');
        } catch {
          setEdge('network-error');
          setMicState('idle');
        }
      };
    };

    mediaRecorder.current.start();
    setMicState('recording');
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
  };

  const handleMic = useCallback(() => {
    if (micState === "idle") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          startRecording();
        })
        .catch(() => setEdge('mic-denied'));
    } else if (micState === "recording") {
      stopRecording();
    }
  }, [micState, setEdge]);

const handleSend = useCallback(async () => {
  // Name is mandatory
  if (!visitorName.trim()) {
    setNameError("Name is required");
    return;
  }


  if (tab === "write") {
    if (!message.trim()) {
      setEdge("empty");
      return;
    }
    if (containsInappropriate(message)) {
      setEdge("inappropriate");
      return;
    }
  } else if (tab === "voice" && !audioUrl) {
    setEdge("empty");
    return;
  }

  setSending(true);
  try {
    const payload = {
      name: visitorName.trim(),
      location: location.trim() || null,
      message: tab === 'write' ? message : null,
      voiceUrl: tab === 'voice' ? audioUrl : null,
    };
    const res = await fetch(`${API_BASE}/api/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      onSuccess();
    } else {
      setEdge('network-error');
    }
  } catch {
    setEdge('network-error');
  } finally {
    setSending(false);
  }
}, [visitorName, location, tab, message, audioUrl, onSuccess, setEdge]);


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
          {/* Name input – mandatory */}
<div className="mb-4">
  <input
    type="text"
    value={visitorName}
    onChange={(e) => {
      setVisitorName(e.target.value.slice(0, 50));
      if (nameError) setNameError("");
    }}
    placeholder="Your name *"
    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
    style={{
      background: "rgba(255,255,255,0.04)",
      border: nameError
        ? "1px solid rgba(255,100,100,0.5)"
        : "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.9)",
    }}
  />
  {nameError && (
    <p className="text-xs mt-1" style={{ color: "rgba(255,120,120,0.8)" }}>
      Please enter your name so Samatha knows who sent the wish.
    </p>
  )}
</div>

          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {(["write", "voice"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
  setTab(t);
  setNameError("");
}}
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

          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value.slice(0, 120))}
            placeholder="Your location (optional)"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.9)",
            }}
          />

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
              className="btn-primary rainbow-border w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 mt-2"
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
      <button
        onClick={() => {
          setShowCakeModal(true);
          setCakeSuccess(false);
        }}
        aria-label="View wishes"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full transition-all hover:scale-110"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.5)",
          fontSize: "1.3rem",
          cursor: "pointer",
          lineHeight: 1,
        }}
        title="View wishes"
      >
        💬
      </button>

      {showCakeModal && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setShowCakeModal(false)}
        >
          <div
            className="absolute bottom-24 right-6 p-[2px] rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(232,131,106,0.9), rgba(232,131,106,0.08), rgba(232,131,106,0.9))",
              backgroundSize: "300% 300%",
              animation: "shine 3s linear infinite",
              boxShadow:
                "0 0 30px rgba(232,131,106,0.35), 0 0 60px rgba(232,131,106,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-[calc(1.5rem-2px)] p-4"
              style={{
                background: "rgba(20, 15, 25, 0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {!cakeSuccess ? (
                <CakeSection
                  onAllExtinguished={() => undefined}
                  triggerWishWall={() => {
                    setCakeSuccess(true);
                    setTimeout(() => {
                      setShowCakeModal(false);
                      window.location.hash = "#/view";
                    }, 800);
                  }}
                />
              ) : (
                <div
                  className="w-64 rounded-3xl p-5 text-center"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(232,131,106,0.3)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#f5f0eb", fontFamily: "var(--font-outfit)" }}
                  >
                    Wishes unlocked!
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Redirecting…
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Wishes viewer ────────────────────────────────────────────────────────────

interface Wish {
  id: string | number;
  visitor_name: string | null;
  created_at: string;
  location?: string | null;
  message?: string | null;
  voice_url?: string | null;
}

function ViewWishes({ onBack }: { onBack: () => void }) {
  const [messagePassword, setMessagePassword] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  const PAGE_PASSWORD = "";
  const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://wishingsamatha-github-io-5f.vercel.app");

  const fetchWishes = async (withMessages = false) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/wishes-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: PAGE_PASSWORD,
          messagePassword: withMessages ? messagePassword : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load wishes");
        return;
      }
      setWishes(data.wishes || []);
      setVisibleCount(5);
      if (withMessages) setFullAccess(Boolean(data.fullAccess));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWishes();
  }, []);

  const grouped = wishes.reduce<Record<string, Wish[]>>((groups, wish) => {
    const key = (wish.visitor_name || "Anonymous").trim().toLowerCase();
    (groups[key] ||= []).push(wish);
    return groups;
  }, {});

  const groupSummaries = Object.entries(grouped)
    .map(([key, items]) => {
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const latest = items[items.length - 1];
      return { key, displayName: items[0].visitor_name?.trim() || "Anonymous", preview: latest.message?.trim() || (latest.voice_url ? "Voice note" : "Message locked"), location: latest.location, lastDate: latest.created_at, messages: items, count: items.length };
    })
    .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

  const visibleGroups = groupSummaries.slice(0, visibleCount);
  const selectedGroup = groupSummaries.find((group) => group.key === selectedGroupName) || null;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row px-4 py-6 gap-4"
      style={{
        background: "radial-gradient(ellipse at 50% 10%, #1c1220 0%, #0c0a10 65%)",
        fontFamily: "var(--font-outfit)",
      }}
    >
      <button
        onClick={onBack}
        className="absolute top-5 left-5 z-20 px-4 py-2 rounded-xl text-sm transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
      >
        ← Back
      </button>

      <div className={`${selectedGroupName ? "hidden md:block" : "block"} w-full md:w-[320px] md:shrink-0 glass rounded-3xl p-4 overflow-y-auto`} style={{ maxHeight: "calc(100vh - 3rem)", marginTop: "3rem" }}>
        <h2 className="text-xl font-light mb-4" style={{ fontFamily: "var(--font-fraunces)", color: "#f5f0eb" }}>Wishes</h2>
        {loading && wishes.length === 0 && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p>}
        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
        {!loading && wishes.length === 0 && !error && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>No wishes yet.</p>}
        <div className="space-y-2">
          {visibleGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => { setSelectedGroupName(group.key); setError(""); }}
              className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:scale-[1.01]"
              style={{ background: selectedGroupName === group.key ? "rgba(232,131,106,0.15)" : "rgba(255,255,255,0.04)", border: selectedGroupName === group.key ? "1px solid rgba(232,131,106,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", color: "#fff" }}>
                {group.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate" style={{ color: "#f5f0eb" }}>{group.displayName}</p>
                  <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.35)" }}>{group.count} msg{group.count > 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{group.preview} · {group.location || "No location"} · {new Date(group.lastDate).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
        {groupSummaries.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((previous) => Math.min(previous + 5, groupSummaries.length))}
            className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            View More ({groupSummaries.length - visibleCount} remaining)
          </button>
        )}
      </div>

      <div className={`${selectedGroupName ? "flex-1 block" : "hidden md:flex flex-1"} glass rounded-3xl p-5 md:p-7 overflow-y-auto`} style={{ maxHeight: "calc(100vh - 3rem)", marginTop: "3rem", minHeight: 400 }}>
        {selectedGroupName && (
          <button
            onClick={() => setSelectedGroupName(null)}
            className="md:hidden mb-4 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
          >
            ← Back to wishes
          </button>
        )}

        {!selectedGroup && <div className="h-full flex flex-col items-center justify-center text-center"><p style={{ color: "rgba(255,255,255,0.35)" }}>Select a person from the left to view their wishes</p></div>}

        {selectedGroup && !fullAccess && (
          <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center">
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Enter the secret code to reveal {selectedGroup.displayName}'s messages</p>
            <input type="password" value={messagePassword} onChange={(event) => setMessagePassword(event.target.value)} placeholder="Message password" className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }} />
            <button onClick={() => void fetchWishes(true)} disabled={loading} className="w-full py-3 rounded-xl text-sm text-white" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", boxShadow: "0 8px 28px rgba(232,131,106,0.32)" }}>{loading ? "Unlocking…" : "Reveal messages"}</button>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}

        {selectedGroup && fullAccess && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", color: "#fff" }}>{selectedGroup.displayName.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-medium" style={{ color: "#f5f0eb" }}>{selectedGroup.displayName}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{selectedGroup.location || "No location"} · {selectedGroup.count} message{selectedGroup.count > 1 ? "s" : ""}</p>
              </div>
            </div>
            {selectedGroup.messages.map((wish) => (
              <div key={wish.id} className="space-y-2">
                {wish.message && <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-tl-none px-4 py-3 text-sm" style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.25)", color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{wish.message}</div></div>}
                {wish.voice_url && <div className="flex justify-start"><div className="rounded-2xl rounded-tl-none px-4 py-3" style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.25)" }}><audio controls src={wish.voice_url} className="w-full max-w-sm" /></div></div>}
                <p className="text-xs text-right" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(wish.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

function Footer() {
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

const HERO_PHOTOS = [
  { url: "/images/Photo 1.jpg", alt: "Samatha celebrating her birthday" },
  { url: "/images/Photo 2.jpg", alt: "Samatha smiling in a birthday portrait" },
  { url: "/images/Photo 3.jpg", alt: "Samatha in a festive portrait" },
  { url: "/images/Photo 4.jpg", alt: "Samatha posing for a birthday photo" },
  { url: "/images/Photo 5.jpg", alt: "Samatha in a joyful birthday portrait" },
];

function HeroSection({ onCTA }: { onCTA: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const balloonsRef = useRef<{ launchAnimation: () => void } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const N = HERO_PHOTOS.length;
  const entryTransforms = [
    "translate(170%, -145%) rotate(18deg) scale(0.5)",
    "translate(-170%, -135%) rotate(-17deg) scale(0.5)",
    "translate(155%, -165%) rotate(15deg) scale(0.5)",
    "translate(160%, 150%) rotate(-16deg) scale(0.5)",
    "translate(-155%, -155%) rotate(19deg) scale(0.5)",
  ];

  function getCardStyle(slot: number, cardIndex: number): CSSProperties {
    const base: CSSProperties = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      borderRadius: "18px",
      overflow: "hidden",
      transformOrigin: "center center",
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
    };

    if (slot === 0) return { ...base, transform: "translate(0, 0) rotate(-1deg) scale(1)", opacity: 1, zIndex: 50, transition: "transform 750ms cubic-bezier(0.34, 1.18, 0.64, 1), opacity 500ms ease", boxShadow: "0 36px 80px rgba(0,0,0,0.8), 0 8px 24px rgba(232,131,106,0.2)" };
    if (slot === 1) return { ...base, transform: "translate(-6%, 30px) rotate(-3deg) scale(0.87)", opacity: 0.6, zIndex: 40, transition: "transform 580ms ease-out, opacity 460ms ease", boxShadow: "0 16px 44px rgba(0,0,0,0.55)" };
    if (slot === 2) return { ...base, transform: "translate(-11%, 56px) rotate(-5.5deg) scale(0.75)", opacity: 0.32, zIndex: 30, transition: "transform 480ms ease-out, opacity 400ms ease", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" };
    if (slot === 3) return { ...base, transform: "translate(-16%, 82px) rotate(-8deg) scale(0.62)", opacity: 0.1, zIndex: 20, transition: "transform 420ms ease-out, opacity 360ms ease" };
    return { ...base, transform: entryTransforms[cardIndex], opacity: 0, zIndex: 10, transition: "none" };
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-14 overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 10%, #1c1220 0%, #0c0a10 65%)" }}>
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] rounded-full blur-[100px]" style={{ background: "radial-gradient(ellipse, rgba(232,131,106,0.1) 0%, transparent 70%)" }} />
      <p className="text-[10px] tracking-[0.42em] uppercase mb-7" style={{ fontFamily: "var(--font-outfit)", color: "#b09290" }}>Birthday Wishes</p>
      <div className="relative w-[130px] h-[170px] md:w-[260px] md:h-[340px]" style={{ marginBottom: "2.2rem" }}>
        {HERO_PHOTOS.map((photo, i) => {
          const slot = (activeIndex - i + N) % N;
          return <div key={i} style={getCardStyle(slot, i)}><img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" draggable={false} />{slot === 0 && <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,10,16,0.3) 0%, transparent 55%)" }} />}</div>;
        })}
      </div>
      <div className="text-center mb-3 relative z-10">
        <h1 className="leading-[1.08] font-light" style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(2.2rem, 7.5vw, 3.8rem)", color: "#f5f0eb" }}>Happy Birthday,</h1>
        <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4">
          <h1 className="leading-[1.05] italic" style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(2.5rem, 8.5vw, 4.2rem)", color: "#e8836a" }}>Samatha</h1>
          <div className="hidden items-center md:flex" style={{ height: "1em" }}>
            <BirthdayCalendar />
          </div>
          <div className="md:hidden">
            <BirthdayCalendar />
          </div>
        </div>
      </div>
      <p className="text-center max-w-[270px] leading-relaxed mb-10 relative z-10" style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(0.78rem, 2.8vw, 0.9rem)", color: "#6e6268" }}>A small gift from your loved ones</p>
      <div className="flex flex-row items-center gap-3 w-full max-w-[360px] relative z-10">
        <button onClick={() => balloonsRef.current?.launchAnimation()} className="flex-1 basis-0 min-w-0 h-12 px-2 rounded-full flex items-center justify-center whitespace-nowrap text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ fontFamily: "var(--font-outfit)", border: "1px solid rgba(232,131,106,0.45)", color: "#f0ebe6", background: "rgba(232,131,106,0.07)" }}>Launch Balloons! 🎈</button>
        <button onClick={onCTA} className="flex-1 basis-0 min-w-0 h-12 px-2 rounded-full flex items-center justify-center whitespace-nowrap text-sm tracking-wide text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ fontFamily: "var(--font-outfit)", background: "linear-gradient(135deg, #e8836a 0%, #c4604a 100%)", boxShadow: "0 8px 28px rgba(232,131,106,0.32)" }}>Make a Wish ✨</button>
      </div>
      <p className="mt-10 text-[10px] tracking-[0.25em] relative z-10" style={{ fontFamily: "var(--font-outfit)", color: "#322c30" }}>↓ scroll</p>
      <div className="flex items-center gap-2 mt-4 relative z-10">{HERO_PHOTOS.map((_, i) => <button key={i} onClick={() => setActiveIndex(i)} className="rounded-full transition-all duration-300" style={{ width: i === activeIndex ? "22px" : "6px", height: "6px", background: i === activeIndex ? "#e8836a" : "#322c30" }} aria-label={`Go to photo ${i + 1}`} />)}</div>
      <Balloons ref={balloonsRef} type="default" />
    </section>
  );
}


// ── Root ──────────────────────────────────────────────────────────────────────

export default function WishingSamatha() {
  const [screen, setScreen] = useState<AppScreen>("hero");
  const [edge, setEdge] = useState<EdgeState>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#/view") {
        setScreen("view");
      } else {
        // Any other hash (including empty or "#/") shows the main page
        setScreen("hero");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const scrollToComposer = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  };

  if (screen === "view") {
    return (
      <div style={{ background: "transparent", minHeight: "100vh" }}>
        <ViewWishes onBack={() => { setScreen("hero"); window.location.hash = ""; }} />
        <EdgeModal state={edge} onClose={() => setEdge(null)} />
      </div>
    );
  }

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
