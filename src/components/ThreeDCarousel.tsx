import { useEffect, useState, type PointerEvent } from "react";

export interface CarouselPhoto {
  url: string;
  alt: string;
  title?: string;
  date?: string;
  location?: string;
  caption?: string;
}

interface ThreeDCarouselProps {
  photos: CarouselPhoto[];
  activeIndex: number;
  onChangeActive: (index: number) => void;
  autoRotateInterval?: number;
  isMobile?: boolean;
  onPhotoClick?: (photo: CarouselPhoto) => void;
}

export function ThreeDCarousel({ photos, activeIndex, onChangeActive, autoRotateInterval = 3500, isMobile = false, onPhotoClick }: ThreeDCarouselProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const totalPhotos = photos.length;

  useEffect(() => {
    if (!isPlaying || isDragging || isHovered || totalPhotos < 2) return;
    const timer = setInterval(() => onChangeActive((activeIndex + 1) % totalPhotos), autoRotateInterval);
    return () => clearInterval(timer);
  }, [activeIndex, autoRotateInterval, isDragging, isHovered, isPlaying, onChangeActive, totalPhotos]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStartX(event.clientX); setDragOffset(0); setIsDragging(true);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX !== null && isDragging) setDragOffset(event.clientX - dragStartX);
  };
  const handlePointerUp = () => {
    if (dragStartX !== null && isDragging) {
      if (dragOffset < -40) onChangeActive((activeIndex + 1) % totalPhotos);
      if (dragOffset > 40) onChangeActive((activeIndex - 1 + totalPhotos) % totalPhotos);
    }
    setDragStartX(null); setDragOffset(0); setIsDragging(false);
  };

  const getCardStyle = (index: number) => {
    let diff = (index - activeIndex + totalPhotos) % totalPhotos;
    if (diff > totalPhotos / 2) diff -= totalPhotos;
    const effectiveDiff = diff + (isDragging ? dragOffset / 300 : 0);
    const absDiff = Math.abs(effectiveDiff);
    const rotateY = -effectiveDiff * (isMobile ? 25 : 32);
    const isActive = diff === 0;
    return {
      isActive,
      style: {
        width: `${isMobile ? 190 : 260}px`, height: `${isMobile ? 250 : 340}px`,
        transform: `translate3d(-50%, -50%, 0) translateX(${effectiveDiff * (isMobile ? 118 : 185)}px) translateZ(${-absDiff * (isMobile ? 100 : 145)}px) rotateY(${rotateY + (isActive ? tilt.y : 0)}deg) rotateX(${isActive ? tilt.x : 0}deg) scale(${Math.max(0.62, 1 - absDiff * 0.17)})`,
        opacity: Math.max(0.2, 1 - absDiff * 0.34), filter: `brightness(${Math.max(0.4, 1 - absDiff * 0.3)})${absDiff > 0.3 ? ` blur(${Math.min(absDiff * 1.6, 3)}px)` : ""}`,
        zIndex: 100 - Math.round(absDiff * 10), transition: isDragging ? "none" : "all 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    };
  };

  if (totalPhotos === 0) return null;
  return (
    <div className="relative flex w-full select-none flex-col items-center justify-center py-4">
      <div className="relative flex h-[330px] w-full touch-pan-y items-center justify-center [perspective:1000px] md:h-[410px]" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onMouseEnter={() => !isMobile && setIsHovered(true)} onMouseLeave={() => { setIsHovered(false); setTilt({ x: 0, y: 0 }); handlePointerUp(); }} aria-label="Birthday photo carousel">
        {photos.map((photo, index) => {
          const card = getCardStyle(index);
          return <button type="button" key={photo.url} className="group absolute left-1/2 top-1/2 overflow-hidden rounded-[18px] border border-white/10 bg-[#181322] text-left shadow-2xl [transform-style:preserve-3d]" style={card.style} onClick={() => card.isActive ? onPhotoClick?.(photo) : onChangeActive(index)} onMouseMove={(event) => { if (!card.isActive || isMobile) return; const rect = event.currentTarget.getBoundingClientRect(); setTilt({ x: -((event.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 10, y: ((event.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10 }); }} aria-label={card.isActive ? `View ${photo.alt}` : `Show ${photo.alt}`}>
            <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105" draggable={false} />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0c0a10]/90 via-[#0c0a10]/15 to-transparent" />
            {card.isActive && (photo.title || photo.caption || photo.location || photo.date) && <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col p-4"><span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#e8836a]"><span aria-hidden="true">✦</span>{photo.date}{photo.location && <><span className="text-white/30">•</span><span className="flex items-center text-white/70"><span className="mr-0.5" aria-hidden="true">⌖</span>{photo.location}</span></>}</span>{photo.title && <span className="text-lg font-bold leading-tight text-[#f5f0eb]">{photo.title}</span>}{photo.caption && <span className="mt-1 line-clamp-2 text-xs italic text-white/70">&quot;{photo.caption}&quot;</span>}</span>}
          </button>;
        })}
      </div>
      <div className="z-20 mt-2 flex items-center justify-center gap-4 md:mt-4">
        <button type="button" onClick={() => onChangeActive((activeIndex - 1 + totalPhotos) % totalPhotos)} aria-label="Previous photo" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-2xl leading-none text-white/80 transition hover:scale-105 hover:text-[#e8836a]">&lsaquo;</button>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">{photos.map((photo, index) => <button type="button" key={photo.url} onClick={() => onChangeActive(index)} aria-label={`Go to photo ${index + 1}`} className={`rounded-full transition-all duration-300 ${index === activeIndex ? "h-2.5 w-7 bg-[#e8836a] shadow-[0_0_10px_#e8836a]" : "h-2.5 w-2.5 bg-white/30 hover:bg-white/60"}`} />)}</div>
        <button type="button" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"} className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm transition hover:scale-105 ${isPlaying ? "text-[#e8836a]" : "text-white/50"}`}>{isPlaying ? "Ⅱ" : "▶"}</button>
        <button type="button" onClick={() => onChangeActive((activeIndex + 1) % totalPhotos)} aria-label="Next photo" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-2xl leading-none text-white/80 transition hover:scale-105 hover:text-[#e8836a]">&rsaquo;</button>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-white/35">{isMobile ? "Swipe to rotate" : "Drag to rotate"}</p>
    </div>
  );
}
