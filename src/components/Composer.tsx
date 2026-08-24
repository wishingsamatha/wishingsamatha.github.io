import { useState, useRef, useCallback } from "react";
import CakeSection from "../CakeSection";
import { AIAssistant } from "./AIAssistant";
import type { EdgeState, MicState, Tab } from "../types";
import { containsInappropriate } from "../utils";

interface ComposerProps {
  onSuccess: () => void;
  setEdge: (e: EdgeState) => void;
}

export function Composer({ onSuccess, setEdge }: ComposerProps) {
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
