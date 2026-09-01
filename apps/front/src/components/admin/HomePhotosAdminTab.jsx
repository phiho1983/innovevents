import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getHomePhotos,
  uploadHomePhoto,
} from "../../api/homePhotos";


function normalizePhotos(
  photos
) {
  return [...photos].sort(
    (a, b) =>
      Number(a.slot) -
      Number(b.slot)
  );
}


function buildInitialAltTexts(
  photos
) {
  const result = {};

  photos.forEach(
    (photo) => {
      result[photo.id] =
        photo.alt_text || "";
    }
  );

  return result;
}


export default function HomePhotosAdminTab() {
  const [
    photos,
    setPhotos,
  ] = useState([]);

  const [
    altTexts,
    setAltTexts,
  ] = useState({});

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState({});

  const [
    previews,
    setPreviews,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingId,
    setSavingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  useEffect(
    () => {
      let active = true;

      async function loadPhotos() {
        try {
          setLoading(true);
          setError("");

          const data =
            await getHomePhotos();

          if (!active) {
            return;
          }

          const orderedPhotos =
            normalizePhotos(
              data
            );

          setPhotos(
            orderedPhotos
          );

          setAltTexts(
            buildInitialAltTexts(
              orderedPhotos
            )
          );
        } catch (loadError) {
          if (!active) {
            return;
          }

          setError(
            loadError?.message ||
            "Impossible de charger les photos de l'accueil."
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadPhotos();

      return () => {
        active = false;
      };
    },
    []
  );


  useEffect(
    () => {
      return () => {
        Object.values(
          previews
        ).forEach(
          (previewUrl) => {
            if (
              previewUrl &&
              previewUrl.startsWith(
                "blob:"
              )
            ) {
              URL.revokeObjectURL(
                previewUrl
              );
            }
          }
        );
      };
    },
    [previews]
  );


  const orderedPhotos =
    useMemo(
      () =>
        normalizePhotos(
          photos
        ),
      [photos]
    );


  function handleFileChange(
    photo,
    event
  ) {
    const file =
      event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFiles(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            photo.id
          ];

          return next;
        }
      );

      return;
    }

    setSelectedFiles(
      (previous) => ({
        ...previous,
        [photo.id]:
          file,
      })
    );

    if (
      typeof URL !==
        "undefined" &&
      typeof URL.createObjectURL ===
        "function"
    ) {
      setPreviews(
        (previous) => {
          const previousUrl =
            previous[
              photo.id
            ];

          if (
            previousUrl &&
            previousUrl.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              previousUrl
            );
          }

          return {
            ...previous,
            [photo.id]:
              URL.createObjectURL(
                file
              ),
          };
        }
      );
    }
  }


  function handleAltTextChange(
    photoId,
    value
  ) {
    setAltTexts(
      (previous) => ({
        ...previous,
        [photoId]:
          value,
      })
    );

    setError("");
    setSuccess("");
  }


  async function handleSave(
    photo
  ) {
    const image =
      selectedFiles[
        photo.id
      ];

    if (!image) {
      setError(
        `Sélectionnez une image pour l'emplacement ${photo.slot}.`
      );

      setSuccess("");

      return;
    }

    setSavingId(
      photo.id
    );

    setError("");
    setSuccess("");

    try {
      const updatedPhoto =
        await uploadHomePhoto(
          photo.id,
          {
            image,
            altText:
              altTexts[
                photo.id
              ] || "",
          }
        );

      setPhotos(
        (previousPhotos) =>
          previousPhotos.map(
            (
              currentPhoto
            ) =>
              currentPhoto.id ===
              updatedPhoto.id
                ? updatedPhoto
                : currentPhoto
          )
      );

      setAltTexts(
        (previous) => ({
          ...previous,
          [updatedPhoto.id]:
            updatedPhoto.alt_text ||
            "",
        })
      );

      setSelectedFiles(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            photo.id
          ];

          return next;
        }
      );

      setPreviews(
        (previous) => {
          const previousUrl =
            previous[
              photo.id
            ];

          if (
            previousUrl &&
            previousUrl.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              previousUrl
            );
          }

          const next = {
            ...previous,
          };

          delete next[
            photo.id
          ];

          return next;
        }
      );

      setSuccess(
        `Emplacement ${photo.slot} mis à jour avec succès.`
      );
    } catch (saveError) {
      setError(
        saveError?.message ||
        `Impossible de mettre à jour l'emplacement ${photo.slot}.`
      );
    } finally {
      setSavingId(
        null
      );
    }
  }


  if (loading) {
    return (
      <p>
        Chargement des photos...
      </p>
    );
  }


  return (
    <section>
      <div
        style={{
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin:
              "0 0 6px",
          }}
        >
          Photos de l'accueil
        </h2>

        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Gérez les 12 photos du
          carrousel affiché sur la
          page d'accueil.
        </p>
      </div>


      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding:
              "10px 12px",
            border:
              "1px solid #f5c2c7",
            borderRadius: 6,
            background:
              "#f8d7da",
            color:
              "#842029",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}


      {success && (
        <div
          style={{
            marginBottom: 16,
            padding:
              "10px 12px",
            border:
              "1px solid #badbcc",
            borderRadius: 6,
            background:
              "#d1e7dd",
            color:
              "#0f5132",
            fontSize: 13,
          }}
        >
          {success}
        </div>
      )}


      {orderedPhotos.length ===
        0 && (
        <p
          style={{
            color: "#777",
          }}
        >
          Aucun emplacement trouvé.
        </p>
      )}


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {orderedPhotos.map(
          (photo) => {
            const previewUrl =
              previews[
                photo.id
              ];

            const currentImage =
              previewUrl ||
              photo.image_url ||
              "";

            const isSaving =
              savingId ===
              photo.id;

            return (
              <article
                key={
                  photo.id
                }
                style={{
                  border:
                    "1px solid #e2e2e2",
                  borderRadius: 10,
                  padding: 14,
                  background:
                    "#fff",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                    }}
                  >
                    Emplacement{" "}
                    {photo.slot}
                  </h3>

                  <span
                    style={{
                      fontSize: 11,
                      padding:
                        "3px 7px",
                      borderRadius:
                        20,
                      background:
                        currentImage
                          ? "#d1e7dd"
                          : "#f1f1f1",
                      color:
                        currentImage
                          ? "#0f5132"
                          : "#666",
                    }}
                  >
                    {currentImage
                      ? "Image définie"
                      : "Vide"}
                  </span>
                </div>


                <div
                  style={{
                    width:
                      "100%",
                    aspectRatio:
                      "16 / 10",
                    overflow:
                      "hidden",
                    borderRadius:
                      8,
                    background:
                      "#f2f2f2",
                    border:
                      "1px solid #e5e5e5",
                    marginBottom:
                      12,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {currentImage ? (
                    <img
                      src={
                        currentImage
                      }
                      alt={
                        altTexts[
                          photo.id
                        ] ||
                        `Aperçu emplacement ${photo.slot}`
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "100%",
                        objectFit:
                          "cover",
                        display:
                          "block",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color:
                          "#999",
                        fontSize:
                          13,
                      }}
                    >
                      Aucun visuel
                    </span>
                  )}
                </div>


                <div
                  style={{
                    marginBottom:
                      12,
                  }}
                >
                  <label
                    htmlFor={
                      `home-photo-image-${photo.slot}`
                    }
                    style={{
                      display:
                        "block",
                      fontSize:
                        13,
                      fontWeight:
                        600,
                      marginBottom:
                        5,
                    }}
                  >
                    Image du slot{" "}
                    {photo.slot}
                  </label>

                  <input
                    id={
                      `home-photo-image-${photo.slot}`
                    }
                    aria-label={
                      `Image du slot ${photo.slot}`
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(
                      event
                    ) =>
                      handleFileChange(
                        photo,
                        event
                      )
                    }
                    disabled={
                      isSaving
                    }
                    style={{
                      width:
                        "100%",
                      fontSize:
                        13,
                    }}
                  />
                </div>


                <div
                  style={{
                    marginBottom:
                      12,
                  }}
                >
                  <label
                    htmlFor={
                      `home-photo-alt-${photo.slot}`
                    }
                    style={{
                      display:
                        "block",
                      fontSize:
                        13,
                      fontWeight:
                        600,
                      marginBottom:
                        5,
                    }}
                  >
                    Texte alternatif
                  </label>

                  <input
                    id={
                      `home-photo-alt-${photo.slot}`
                    }
                    aria-label={
                      `Texte alternatif du slot ${photo.slot}`
                    }
                    type="text"
                    maxLength={200}
                    value={
                      altTexts[
                        photo.id
                      ] || ""
                    }
                    onChange={(
                      event
                    ) =>
                      handleAltTextChange(
                        photo.id,
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      isSaving
                    }
                    placeholder="Décrivez brièvement la photo"
                    style={{
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "8px 10px",
                      border:
                        "1px solid #ccc",
                      borderRadius:
                        6,
                    }}
                  />
                </div>


                <button
                  type="button"
                  aria-label={
                    `Enregistrer le slot ${photo.slot}`
                  }
                  onClick={() =>
                    handleSave(
                      photo
                    )
                  }
                  disabled={
                    isSaving
                  }
                  className="btn"
                  style={{
                    width:
                      "100%",
                  }}
                >
                  {isSaving
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}