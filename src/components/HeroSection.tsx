import { useRef, useState } from "react";
import { Balloons } from "@/components/ui/balloons";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { HERO_PHOTOS } from "../constants";
import { ThreeDCarousel } from "./ThreeDCarousel";

export function HeroSection({ onCTA }: { onCTA: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const balloonsRef = useRef<{ launchAnimation: () => void } | null>(null);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-14 overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 10%, #1c1220 0%, #0c0a10 65%)" }}>
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] rounded-full blur-[100px]" style={{ background: "radial-gradient(ellipse, rgba(232,131,106,0.1) 0%, transparent 70%)" }} />
      <p className="text-[10px] tracking-[0.42em] uppercase mb-7" style={{ fontFamily: "var(--font-outfit)", color: "#b09290" }}>Birthday Wishes</p>
      <div className="w-full max-w-[760px]" style={{ marginBottom: "1.3rem" }}>
        <ThreeDCarousel photos={HERO_PHOTOS} activeIndex={activeIndex} onChangeActive={setActiveIndex} />
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
      <Balloons ref={balloonsRef} type="default" />
    </section>
  );
}


// ── Root ──────────────────────────────────────────────────────────────────────
