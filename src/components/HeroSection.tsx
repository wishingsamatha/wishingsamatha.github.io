import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { Balloons } from "@/components/ui/balloons";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { HERO_PHOTOS } from "../constants";

export function HeroSection({ onCTA }: { onCTA: () => void }) {
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
