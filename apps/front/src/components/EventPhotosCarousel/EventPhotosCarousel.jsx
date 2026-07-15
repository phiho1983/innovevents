import { useEffect, useRef, useState } from "react";
import "./EventPhotosCarousel.css";

export default function EventPhotosCarousel({ photos = [], speed = 18 }) {
  const viewportRef = useRef(null);
  const rafRef = useRef(0);
  const velRef = useRef(0); // -1..1

  const [isHover, setIsHover] = useState(false);
  const [active, setActive] = useState(null); // {id,url,title,placeholder}

  // Auto scroll au hover (stop quand modal ouverte)
  useEffect(() => {
    const tick = () => {
      const el = viewportRef.current;

      if (el && isHover && !active && velRef.current !== 0) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          el.scrollLeft += velRef.current * speed;
          if (el.scrollLeft < 0) el.scrollLeft = 0;
          if (el.scrollLeft > max) el.scrollLeft = max;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isHover, active, speed]);

  // Direction selon position souris (gauche -> -, droite -> +, centre -> stop)
  const onMouseMove = (e) => {
    const el = viewportRef.current;
    if (!el || active) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const r = x / rect.width;

    if (r > 0.4 && r < 0.6) velRef.current = 0;
    else if (r <= 0.4) velRef.current = -1;
    else velRef.current = 1;
  };

  const onMouseLeave = () => {
    setIsHover(false);
    velRef.current = 0;
  };

  // Fermer au clavier (ESC)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!photos.length) return null;

  return (
    <>
      <div
        className="epcViewport"
        ref={viewportRef}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
      >
        <div className="epcTrack">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              className="epcCard"
              onClick={() => setActive(p)}
              aria-label="Ouvrir"
            >
              {/* ✅ Ici: si pas d’image => rectangle pastel */}
              {p.url ? (
                <img src={p.url} alt={p.title || ""} draggable={false} />
              ) : (
                <div className={`epcPlaceholder ${p.placeholder || ""}`}>
                  <span>{p.title}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {active && (
        <div className="epcModalOverlay" onMouseDown={() => setActive(null)}>
          <div
            className="epcModalContent"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="epcCloseBtn"
              type="button"
              onClick={() => setActive(null)}
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* ✅ Modal: image si url, sinon rectangle */}
            {active.url ? (
              <img className="epcModalImg" src={active.url} alt={active.title || ""} />
            ) : (
              <div className={`epcModalPlaceholder ${active.placeholder || ""}`}>
                {active.title}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
