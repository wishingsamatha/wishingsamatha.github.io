import { useEffect, useState } from "react";
import { Composer } from "./components/Composer";
import { EdgeDemoStrip } from "./components/EdgeDemoStrip";
import { EdgeModal } from "./components/EdgeModal";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { SuccessScreen } from "./components/SuccessScreen";
import { ViewWishes } from "./components/ViewWishes";
import type { AppScreen, EdgeState } from "./types";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("hero");
  const [edge, setEdge] = useState<EdgeState>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(window.location.hash === "#/view" ? "view" : "hero");
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
