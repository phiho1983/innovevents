import {
  useEffect,
  useState,
} from "react";

import {
  getHomeHero,
  uploadHomeHero,
} from "../../api/homeHero";


export default function HomeHeroAdmin() {
  const [
    hero,
    setHero,
  ] = useState(null);

  const [
    altText,
    setAltText,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    preview,
    setPreview,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

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

      async function loadHero() {
        try {
          setLoading(true);
          setError("");

          const data =
            await getHomeHero();

          if (!active) {
            return;
          }

          setHero(
            data
          );

          setAltText(
            data?.alt_text || ""
          );
        } catch (loadError) {
          if (!active) {
            return;
          }

          setError(
            loadError?.message ||
            "Impossible de charger l'image principale."
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadHero();

      return () => {
        active = false;
      };
    },
    []
  );


  useEffect(
    () => {
      return () => {
        if (
          preview &&
          preview.startsWith(
            "blob:"
          ) &&
          typeof URL !==
            "undefined" &&
          typeof URL.revokeObjectURL ===
            "function"
        ) {
          URL.revokeObjectURL(
            preview
          );
        }
      };
    },
    [preview]
  );


  function handleFileChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    setError("");
    setSuccess("");

    if (
      preview &&
      preview.startsWith(
        "blob:"
      ) &&
      typeof URL !==
        "undefined" &&
      typeof URL.revokeObjectURL ===
        "function"
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    if (!file) {
      setSelectedFile(
        null
      );

      setPreview(
        ""
      );

      return;
    }

    setSelectedFile(
      file
    );

    if (
      typeof URL !==
        "undefined" &&
      typeof URL.createObjectURL ===
        "function"
    ) {
      setPreview(
        URL.createObjectURL(
          file
        )
      );
    } else {
      setPreview(
        ""
      );
    }
  }


  async function handleSave() {
    if (!selectedFile) {
      setError(
        "Sélectionnez une image pour le Hero."
      );

      setSuccess(
        ""
      );

      return;
    }

    setSaving(
      true
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    try {
      const updatedHero =
        await uploadHomeHero({
          image:
            selectedFile,
          altText:
            altText,
        });

      setHero(
        updatedHero
      );

      setAltText(
        updatedHero?.alt_text ||
        ""
      );

      setSelectedFile(
        null
      );

      if (
        preview &&
        preview.startsWith(
          "blob:"
        ) &&
        typeof URL !==
          "undefined" &&
        typeof URL.revokeObjectURL ===
          "function"
      ) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview(
        ""
      );

      setSuccess(
        "Hero mis à jour avec succès."
      );
    } catch (saveError) {
      setError(
        saveError?.message ||
        "Impossible de mettre à jour le Hero."
      );
    } finally {
      setSaving(
        false
      );
    }
  }


  if (loading) {
    return (
      <p>
        Chargement du Hero...
      </p>
    );
  }


  const currentImage =
    preview ||
    hero?.image_url ||
    "";


  return (
    <section
      style={{
        marginBottom: 28,
      }}
    >
      <div
        style={{
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin:
              "0 0 6px",
          }}
        >
          Image principale
        </h2>

        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Gérez l&apos;image principale
          affichée dans le Hero de la
          page d&apos;accueil.
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


      <article
        style={{
          maxWidth: 720,
          border:
            "1px solid #e2e2e2",
          borderRadius: 10,
          padding: 16,
          background:
            "#fff",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width:
              "100%",
            aspectRatio:
              "16 / 9",
            overflow:
              "hidden",
            borderRadius:
              8,
            background:
              "#f2f2f2",
            border:
              "1px solid #e5e5e5",
            marginBottom:
              16,
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
                altText ||
                "Aperçu du Hero"
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
              Aucun visuel défini
            </span>
          )}
        </div>


        <div
          style={{
            marginBottom:
              14,
          }}
        >
          <label
            htmlFor="home-hero-image"
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
            Image principale du Hero
          </label>

          <input
            id="home-hero-image"
            aria-label="Image principale du Hero"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFileChange
            }
            disabled={
              saving
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
              14,
          }}
        >
          <label
            htmlFor="home-hero-alt"
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
            id="home-hero-alt"
            aria-label="Texte alternatif du Hero"
            type="text"
            maxLength={200}
            value={
              altText
            }
            onChange={(
              event
            ) => {
              setAltText(
                event.target.value
              );

              setError(
                ""
              );

              setSuccess(
                ""
              );
            }}
            disabled={
              saving
            }
            placeholder="Décrivez brièvement l'image principale"
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
          onClick={
            handleSave
          }
          disabled={
            saving
          }
          className="btn"
          aria-label="Enregistrer le Hero"
          style={{
            width:
              "100%",
          }}
        >
          {saving
            ? "Enregistrement..."
            : "Enregistrer le Hero"}
        </button>
      </article>
    </section>
  );
}