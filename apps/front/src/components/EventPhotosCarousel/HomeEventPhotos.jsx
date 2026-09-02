import {
  useEffect,
  useState,
} from "react";

import {
  getHomePhotos,
} from "../../api/homePhotos";

import EventPhotosCarousel from "./EventPhotosCarousel";


function makeDefaultPhotos() {
  return Array.from(
    {
      length: 12,
    },
    (_, index) => {
      const slot =
        index + 1;

      const placeholderNumber =
        (index % 6) + 1;

      return {
        id: slot,

        url: null,

        title:
          `Event - ${String(slot).padStart(2, "0")}`,

        placeholder:
          `p${placeholderNumber}`,
      };
    }
  );
}


function buildCarouselPhotos(
  apiPhotos
) {
  const defaults =
    makeDefaultPhotos();

  const photosBySlot =
    new Map(
      apiPhotos.map(
        (photo) => [
          Number(
            photo.slot
          ),
          photo,
        ]
      )
    );


  return defaults.map(
    (
      defaultPhoto,
      index
    ) => {
      const slot =
        index + 1;

      const apiPhoto =
        photosBySlot.get(
          slot
        );


      if (!apiPhoto) {
        return defaultPhoto;
      }


      return {
        ...defaultPhoto,

        url:
          apiPhoto.image_url ||
          null,

        title:
          apiPhoto.alt_text ||
          defaultPhoto.title,
      };
    }
  );
}


export default function HomeEventPhotos() {
  const [
    photos,
    setPhotos,
  ] = useState(
    () =>
      makeDefaultPhotos()
  );


  useEffect(
    () => {
      let active =
        true;


      async function loadPhotos() {
        try {
          const data =
            await getHomePhotos();


          if (!active) {
            return;
          }


          setPhotos(
            buildCarouselPhotos(
              Array.isArray(
                data
              )
                ? data
                : []
            )
          );
        } catch {
          if (!active) {
            return;
          }


          setPhotos(
            makeDefaultPhotos()
          );
        }
      }


      loadPhotos();


      return () => {
        active = false;
      };
    },
    []
  );


  return (
    <section
      className="home-realizations"
      aria-labelledby="home-realizations-title"
    >
      <div className="home-realizations-header">
        <div>
          <p className="home-realizations-eyebrow">
            Nos réalisations
          </p>

          <h2
            id="home-realizations-title"
            className="home-realizations-title"
          >
            Des événements qui
            <br />
            marquent les esprits.
          </h2>
        </div>


        <a
          href="/evenements"
          className="home-realizations-link"
        >
          Découvrir nos événements

          <span aria-hidden="true">
            →
          </span>
        </a>
      </div>


      <EventPhotosCarousel
        photos={photos}
        speed={18}
      />
    </section>
  );
}