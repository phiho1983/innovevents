import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./EventPhotosCarousel.css";


export default function EventPhotosCarousel({
  photos = [],
  speed = 18,
}) {
  const viewportRef =
    useRef(null);

  const rafRef =
    useRef(0);

  const velRef =
    useRef(0);

  const [
    isHover,
    setIsHover,
  ] = useState(false);

  const [
    active,
    setActive,
  ] = useState(null);


  /* ======================================================= */
  /* Auto-scroll au survol                                  */
  /* ======================================================= */

  useEffect(() => {
    const tick = () => {
      const viewport =
        viewportRef.current;

      if (
        viewport &&
        isHover &&
        !active &&
        velRef.current !== 0
      ) {
        const max =
          viewport.scrollWidth -
          viewport.clientWidth;

        if (max > 0) {
          viewport.scrollLeft +=
            velRef.current *
            speed;

          if (
            viewport.scrollLeft < 0
          ) {
            viewport.scrollLeft = 0;
          }

          if (
            viewport.scrollLeft > max
          ) {
            viewport.scrollLeft = max;
          }
        }
      }

      rafRef.current =
        requestAnimationFrame(
          tick
        );
    };


    rafRef.current =
      requestAnimationFrame(
        tick
      );


    return () => {
      cancelAnimationFrame(
        rafRef.current
      );
    };
  }, [
    isHover,
    active,
    speed,
  ]);


  /* ======================================================= */
  /* Direction selon la position de la souris               */
  /* ======================================================= */

  function handleMouseMove(
    event
  ) {
    const viewport =
      viewportRef.current;

    if (
      !viewport ||
      active
    ) {
      return;
    }


    const rect =
      viewport.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left;

    const ratio =
      x /
      rect.width;


    if (
      ratio > 0.4 &&
      ratio < 0.6
    ) {
      velRef.current = 0;

      return;
    }


    velRef.current =
      ratio <= 0.4
        ? -1
        : 1;
  }


  function handleMouseLeave() {
    setIsHover(false);

    velRef.current = 0;
  }


  /* ======================================================= */
  /* Fermeture modal avec Escape                            */
  /* ======================================================= */

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setActive(null);
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  if (!photos.length) {
    return null;
  }


  return (
    <>
      <div
        className="epcViewport"
        ref={viewportRef}
        onMouseEnter={() => {
          setIsHover(true);
        }}
        onMouseLeave={
          handleMouseLeave
        }
        onMouseMove={
          handleMouseMove
        }
      >
        <div className="epcTrack">
          {photos.map(
            (
              photo,
              index
            ) => (
              <button
                key={photo.id}
                type="button"
                className="epcCard"
                onClick={() => {
                  setActive(
                    photo
                  );
                }}
                aria-label="Ouvrir"
              >
                <div className="epcMedia">
                  {photo.url ? (
                    <img
                      src={
                        photo.url
                      }
                      alt={
                        photo.title ||
                        ""
                      }
                      draggable={
                        false
                      }
                    />
                  ) : (
                    <div className="epcPlaceholder">
                      <span className="epcPlaceholderIndex">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span className="epcPlaceholderLabel">
                        Visuel à venir
                      </span>
                    </div>
                  )}


                  <div className="epcCardOverlay">
                    <span className="epcCardNumber">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="epcCardTitle">
                      {photo.title ||
                        "Réalisation Innov'Events"}
                    </span>

                    <span
                      className="epcCardArrow"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>
                </div>
              </button>
            )
          )}
        </div>
      </div>


      {active && (
        <div
          className="epcModalOverlay"
          onMouseDown={() => {
            setActive(null);
          }}
          role="presentation"
        >
          <div
            className="epcModalContent"
            onMouseDown={(
              event
            ) => {
              event.stopPropagation();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={
              active.title ||
              "Réalisation Innov'Events"
            }
          >
            <button
              className="epcCloseBtn"
              type="button"
              onClick={() => {
                setActive(null);
              }}
              aria-label="Fermer"
            >
              <span
                aria-hidden="true"
              >
                ×
              </span>
            </button>


            {active.url ? (
              <img
                className="epcModalImg"
                src={
                  active.url
                }
                alt={
                  active.title ||
                  ""
                }
              />
            ) : (
              <div className="epcModalPlaceholder">
                <span>
                  Visuel à venir
                </span>
              </div>
            )}


            {active.title && (
              <div className="epcModalCaption">
                {active.title}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}