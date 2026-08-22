import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

const CANDLE_COUNT = 4;
const CANDLE_HEIGHTS = [0.38, 0.34, 0.41, 0.36];
const CANDLE_RING_RADIUS = 0.52;
const BOTTOM_TIER_H = 0.85;
const TOP_TIER_H = 0.7;
const TOP_CENTER_Y = BOTTOM_TIER_H + TOP_TIER_H / 2;
const TOP_TOP_Y = BOTTOM_TIER_H + TOP_TIER_H;
const pointerState = { x: 0, y: 0 };

function Flame({ position, extinguished, onExtinguish, hinting }: {
  position: [number, number, number]; extinguished: boolean;
  onExtinguish: () => void; hinting: boolean;
}) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const opacity = useRef(1);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (extinguished) {
      opacity.current = Math.max(0, opacity.current - 0.08);
      [outerRef, innerRef].forEach((ref) => {
        if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity.current * 0.7;
      });
      if (lightRef.current) lightRef.current.intensity = opacity.current;
      return;
    }
    const time = clock.getElapsedTime();
    const flicker = 0.82 + Math.sin(time * 9.3 + offset) * 0.11 + Math.sin(time * 14.7 + offset * 1.7) * 0.06 + Math.sin(time * 5.1 + offset * 0.9) * 0.04;
    const wobble = Math.sin(time * 6.5 + offset) * 0.013;
    const hintMod = hinting ? 0.4 + 0.6 * Math.abs(Math.sin(time * 3)) : 1;
    if (outerRef.current) {
      outerRef.current.scale.set(flicker, flicker * 1.3, flicker);
      outerRef.current.position.x = wobble;
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.65 * hintMod;
    }
    if (innerRef.current) {
      innerRef.current.scale.set(flicker * 0.65, flicker * 0.9, flicker * 0.65);
      innerRef.current.position.x = wobble;
      (innerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.92 * hintMod;
    }
    if (lightRef.current) lightRef.current.intensity = flicker * 1.1 * hintMod;
  });
  return <group position={position}>
    <mesh onPointerDown={(event) => { event.stopPropagation(); if (!extinguished) onExtinguish(); }}>
      <sphereGeometry args={[0.22, 6, 6]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh ref={outerRef}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#FFF3B0" transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <mesh ref={innerRef}><sphereGeometry args={[0.045, 8, 8]} /><meshBasicMaterial color="#FF9B20" transparent opacity={0.92} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <pointLight ref={lightRef} color="#FFB667" intensity={1.1} distance={5} decay={2} />
  </group>;
}

function SmokeWisp({ position, onDone }: { position: [number, number, number]; onDone: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const start = useRef(Date.now());
  const done = useRef(false);
  useFrame(() => {
    if (done.current || !ref.current) return;
    const progress = (Date.now() - start.current) / 1500;
    if (progress >= 1) { done.current = true; onDone(); return; }
    ref.current.position.y = position[1] + progress * 1.8;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
    ref.current.scale.setScalar(0.7 + progress * 1.5);
  });
  return <mesh ref={ref} position={position} renderOrder={10}>
    <sphereGeometry args={[0.055, 6, 6]} /><meshBasicMaterial color="#9A9A9A" transparent opacity={0.5} depthWrite={false} />
  </mesh>;
}

function FrostingDetails({ radius, topY, count, sprinkles }: { radius: number; topY: number; count: number; sprinkles: number }) {
  const details = useMemo(() => Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return { x: Math.cos(angle) * (radius - 0.12), z: Math.sin(angle) * (radius - 0.12), scale: 0.88 + (index * 0.17) % 0.25 };
  }), [count, radius]);
  const sprinkleItems = useMemo(() => Array.from({ length: sprinkles }, (_, index) => {
    const angle = (index / sprinkles) * Math.PI * 2 * 2.4 + index;
    const distance = (((index * 0.618) % 1) * 0.85 + 0.1) * (radius - 0.15);
    return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance, rotation: (index * 47 * Math.PI) / 180, color: index % 2 === 0 ? "#F4A6B8" : "#E8B87D" };
  }), [radius, sprinkles]);
  return <>
    {details.map((item, index) => <mesh key={`dollop-${index}`} position={[item.x, topY + 0.05, item.z]} scale={[item.scale, item.scale, item.scale]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#F7C9D3" roughness={0.55} /></mesh>)}
    {Array.from({ length: Math.ceil(count * 0.8) }, (_, index) => { const angle = (index / count) * Math.PI * 2 + 0.3; const length = 0.13 + (index * 0.063) % 0.18; return <mesh key={`drip-${index}`} position={[Math.cos(angle) * (radius - 0.02), topY - length / 2, Math.sin(angle) * (radius - 0.02)]}><cylinderGeometry args={[0.038, 0.018, length, 6]} /><meshStandardMaterial color="#F7C9D3" roughness={0.55} /></mesh>; })}
    {sprinkleItems.map((item, index) => <mesh key={`sprinkle-${index}`} position={[item.x, topY + 0.04, item.z]} rotation={[Math.PI / 2, item.rotation, 0]}><cylinderGeometry args={[0.026, 0.026, 0.075, 4]} /><meshStandardMaterial color={item.color} roughness={0.6} /></mesh>)}
  </>;
}

function CakeTier({ radius, height, centerY, count, sprinkles, gold }: { radius: number; height: number; centerY: number; count: number; sprinkles: number; gold?: boolean }) {
  const topY = centerY + height / 2;
  return <group>
    <mesh position={[0, centerY, 0]}><cylinderGeometry args={[radius, radius, height, 32]} /><meshStandardMaterial color="#F0DFC8" roughness={0.65} /></mesh>
    <mesh position={[0, topY + 0.015, 0]}><cylinderGeometry args={[radius, radius, 0.03, 32]} /><meshStandardMaterial color="#F7C9D3" roughness={0.5} /></mesh>
    <mesh position={[0, topY, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.055, 8, 32]} /><meshStandardMaterial color="#F7C9D3" roughness={0.5} /></mesh>
    {gold && <mesh position={[0, centerY - height / 2 + 0.04, 0]}><cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.07, 32]} /><meshStandardMaterial color="#C8993A" roughness={0.3} metalness={0.8} /></mesh>}
    <FrostingDetails radius={radius} topY={topY} count={count} sprinkles={sprinkles} />
  </group>;
}

function Candle({ x, z, height, index, extinguished, onExtinguish, hinting }: { x: number; z: number; height: number; index: number; extinguished: boolean; onExtinguish: () => void; hinting: boolean }) {
  const [smokeActive, setSmokeActive] = useState(false);
  const previous = useRef(false);
  const baseY = TOP_TOP_Y;
  const flameY = baseY + height + 0.084;
  useEffect(() => { if (extinguished && !previous.current) setSmokeActive(true); previous.current = extinguished; }, [extinguished]);
  return <group>
    <mesh position={[x, baseY + height / 2, z]}><cylinderGeometry args={[0.05, 0.05, height, 8]} /><meshStandardMaterial color={index % 2 === 0 ? "#F7C9D3" : "#F0DFC8"} roughness={0.7} /></mesh>
    <mesh position={[x, baseY + height + 0.024, z]}><cylinderGeometry args={[0.008, 0.008, 0.045, 4]} /><meshStandardMaterial color="#2A2018" roughness={1} /></mesh>
    <Flame position={[x, flameY, z]} extinguished={extinguished} onExtinguish={onExtinguish} hinting={hinting} />
    {smokeActive && <SmokeWisp position={[x, flameY, z]} onDone={() => setSmokeActive(false)} />}
  </group>;
}

function CakeModel({ extinguished, onExtinguish, hinting }: { extinguished: boolean[]; onExtinguish: (index: number) => void; hinting: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!reducedMotion.current) groupRef.current.rotation.y += (delta / 60) * Math.PI * 2;
    const maxTilt = Math.PI / 30;
    groupRef.current.rotation.x += (-pointerState.y * maxTilt - groupRef.current.rotation.x) * 0.04;
    groupRef.current.rotation.z += (pointerState.x * maxTilt * 0.5 - groupRef.current.rotation.z) * 0.04;
  });
  return <group ref={groupRef}>
    <ambientLight intensity={0.08 + (extinguished.filter((item) => !item).length / CANDLE_COUNT) * 0.12} color="#F5ECD4" />
    <directionalLight position={[-2, 4, -3]} intensity={0.12} color="#A0C0FF" />
    <CakeTier radius={1.5} height={BOTTOM_TIER_H} centerY={BOTTOM_TIER_H / 2} count={14} sprinkles={22} gold />
    <CakeTier radius={1} height={TOP_TIER_H} centerY={TOP_CENTER_Y} count={10} sprinkles={14} />
    {Array.from({ length: CANDLE_COUNT }, (_, index) => { const angle = (index / CANDLE_COUNT) * Math.PI * 2; return <Candle key={index} x={Math.cos(angle) * CANDLE_RING_RADIUS} z={Math.sin(angle) * CANDLE_RING_RADIUS} height={CANDLE_HEIGHTS[index]} index={index} extinguished={extinguished[index]} onExtinguish={() => onExtinguish(index)} hinting={hinting} />; })}
  </group>;
}

function Confetti({ active }: { active: boolean }) {
  const particles = useMemo(() => Array.from({ length: 60 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2.5 + Math.random() * 2,
    rotation: 360 + Math.floor(Math.random() * 360),
    color: index % 3 === 0 ? "#F4A6B8" : index % 3 === 1 ? "#E8B87D" : "#F5F0EA",
    size: 5 + Math.random() * 7,
    round: index % 4 === 0,
  })), []);
  if (!active) return null;
  return <div className="cake-confetti" aria-hidden="true">
    {particles.map((particle) => <div key={particle.id} style={{ left: `${particle.left}%`, width: particle.size, height: particle.size, backgroundColor: particle.color, borderRadius: particle.round ? "50%" : "2px", animation: `confetti-fall ${particle.duration}s cubic-bezier(0.22,1,0.36,1) ${particle.delay}s both`, "--rot": `${particle.rotation}deg` } as React.CSSProperties} />)}
  </div>;
}

export default function CakeSection({ onAllExtinguished, triggerWishWall }: { onAllExtinguished: () => void; triggerWishWall: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [isNearView, setIsNearView] = useState(false);
  const [extinguished, setExtinguished] = useState(() => Array(CANDLE_COUNT).fill(false));
  const [allOut, setAllOut] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [promptText, setPromptText] = useState("make a wish");
  const [hinting, setHinting] = useState(false);
  const [showBlow, setShowBlow] = useState(true);
  const interactedRef = useRef(false);
  const allOutRef = useRef(false);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsNearView(true); }, { rootMargin: "200px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointerState.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerState.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { pointerState.x = 0; pointerState.y = 0; };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => { wrap.removeEventListener("pointermove", onMove); wrap.removeEventListener("pointerleave", onLeave); };
  }, [isNearView]);

  useEffect(() => {
    if (allOut) return;
    const timeout = window.setTimeout(() => { if (!interactedRef.current) setHinting(true); }, 12000);
    return () => window.clearTimeout(timeout);
  }, [allOut]);

  useEffect(() => {
    if (!extinguished.every(Boolean) || allOutRef.current) return;
    allOutRef.current = true;
    setAllOut(true);
    onAllExtinguished();
    const revealTimeout = window.setTimeout(() => {
      setPromptText("and they all wished for you.");
      if (!reducedMotion) setConfetti(true);
      const wallTimeout = window.setTimeout(() => { setConfetti(false); triggerWishWall(); }, 1500);
      return () => window.clearTimeout(wallTimeout);
    }, 600);
    return () => window.clearTimeout(revealTimeout);
  }, [extinguished, onAllExtinguished, triggerWishWall, reducedMotion]);

  const handleExtinguish = useCallback((index: number) => {
    interactedRef.current = true;
    setHinting(false);
    setExtinguished((previous) => {
      if (previous[index]) return previous;
      const next = [...previous];
      next[index] = true;
      return next;
    });
  }, []);

  const handleBlowClick = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastBlow = 0;
      const check = () => {
        analyser.getByteFrequencyData(data);
        const lowFrequency = (data[1] + data[2] + data[3] + data[4]) / 4;
        const now = Date.now();
        if (lowFrequency > 170 && now - lastBlow > 600) {
          lastBlow = now;
          interactedRef.current = true;
          setHinting(false);
          setExtinguished((previous) => {
            const nextIndex = previous.findIndex((item) => !item);
            if (nextIndex === -1) return previous;
            const next = [...previous];
            next[nextIndex] = true;
            return next;
          });
        }
        if (!allOutRef.current) requestAnimationFrame(check);
        else { stream.getTracks().forEach((track) => track.stop()); void context.close(); }
      };
      requestAnimationFrame(check);
    } catch { setShowBlow(false); }
  }, []);

  return <section ref={sectionRef} className="cake-section">
    <p className="cake-prompt">{promptText}</p>
    <div ref={canvasWrapRef} className="cake-canvas-wrap">
      {!isNearView && <div className="cake-loading" />}
      {isNearView && <Canvas dpr={[1, 2]} camera={{ position: [0, 3.2, 7.5], fov: 42 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <CakeModel extinguished={extinguished} onExtinguish={handleExtinguish} hinting={hinting} />
          <EffectComposer><Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} intensity={0.4} /></EffectComposer>
        </Suspense>
      </Canvas>}
      {allOut && <div className="cake-glow" />}
    </div>
    {!allOut && <div className="cake-controls"><p className="label-style">tap the candles</p>{showBlow && <button type="button" onClick={handleBlowClick} className="cake-blow-button">or blow them out</button>}</div>}
    <Confetti active={confetti && !reducedMotion} />
  </section>;
}