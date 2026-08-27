import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Navbar from "../components/Navbar"
import { useAuth } from "../auth/useAuth"


const API = import.meta.env.VITE_API_URL || "http://localhost:8000"


export default function ReviewsPage() {
  const { user } = useAuth()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    rating: 5,
    content: "",
  })

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    try {
      const response = await fetch(
        `${API}/api/reviews/`
      )

      const data = await response.json()

      setReviews(
        data.results || data
      )
    } catch (loadError) {
      console.error(
        "Erreur chargement avis :",
        loadError
      )
    } finally {
      setLoading(false)
    }
  }

  async function submitReview(event) {
    event.preventDefault()

    setMessage("")
    setError("")

    if (
      !form.content.trim() ||
      form.content.trim().length < 10
    ) {
      setError(
        "Votre avis doit contenir au moins 10 caractères."
      )
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem(
        "access_token"
      )

      const response = await fetch(
        `${API}/api/reviews/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: Number(
              form.rating
            ),
            content:
              form.content.trim(),
          }),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw data
      }

      setForm({
        rating: 5,
        content: "",
      })

      setMessage(
        "Merci ! Votre avis a bien été publié."
      )

      await loadReviews()
    } catch (submitError) {
      setError(
        submitError?.detail ||
          submitError?.content?.[0] ||
          submitError?.rating?.[0] ||
          "Impossible d'envoyer votre avis."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />

      <main
        className="container"
        style={{
          padding: "24px 0",
        }}
      >
        <h1
          style={{
            marginBottom: 20,
          }}
        >
          Avis clients
        </h1>

        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 18,
            background: "#fff",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            Laisser un avis
          </h2>

          {!user && (
            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Pour laisser un avis,
              connectez-vous à votre compte.{" "}
              <Link
                to="/login"
                style={{
                  color: "#6a46b4",
                  fontWeight: 700,
                }}
              >
                Se connecter
              </Link>
            </p>
          )}

          {user &&
            user.role !== "CLIENT" && (
              <p
                style={{
                  margin: 0,
                  color: "#666",
                }}
              >
                Seuls les comptes clients
                peuvent publier un avis.
              </p>
            )}

          {user?.role === "CLIENT" && (
            <form
              onSubmit={
                submitReview
              }
            >
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                Note
              </label>

              <select
                value={form.rating}
                onChange={(event) =>
                  setForm(
                    (
                      previousForm
                    ) => ({
                      ...previousForm,
                      rating:
                        event.target.value,
                    })
                  )
                }
                style={{
                  padding: 10,
                  border:
                    "1px solid #ddd",
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                {[5, 4, 3, 2, 1].map(
                  (note) => (
                    <option
                      key={note}
                      value={note}
                    >
                      {"★".repeat(
                        note
                      )}
                      {" — "}
                      {note}/5
                    </option>
                  )
                )}
              </select>

              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                Votre avis
              </label>

              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm(
                    (
                      previousForm
                    ) => ({
                      ...previousForm,
                      content:
                        event.target.value,
                    })
                  )
                }
                rows={4}
                placeholder={
                  (
                    "Partagez votre "
                    + "expérience avec "
                    + "Innov'Events..."
                  )
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border:
                    "1px solid #ddd",
                  borderRadius: 6,
                  resize: "vertical",
                  marginBottom: 10,
                  boxSizing:
                    "border-box",
                }}
              />

              {message && (
                <p
                  style={{
                    color: "#2e7d32",
                    fontSize: 14,
                  }}
                >
                  {message}
                </p>
              )}

              {error && (
                <p
                  style={{
                    color: "#c62828",
                    fontSize: 14,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn"
                disabled={saving}
              >
                {saving
                  ? "Envoi..."
                  : "Publier mon avis"}
              </button>
            </form>
          )}
        </section>

        <h2
          style={{
            marginBottom: 12,
          }}
        >
          Avis publiés
        </h2>

        {loading && (
          <p>Chargement...</p>
        )}

        {!loading &&
          reviews.length === 0 && (
            <p
              style={{
                color: "#888",
              }}
            >
              Aucun avis pour le moment.
            </p>
          )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              (
                "repeat("
                + "auto-fill,"
                + "minmax(280px,1fr)"
                + ")"
              ),
            gap: 16,
          }}
        >
          {reviews.map(
            (review) => (
              <div
                key={review.id}
                style={{
                  border:
                    "1px solid #eee",
                  borderRadius: 8,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    marginBottom: 6,
                  }}
                >
                  {"★".repeat(
                    review.rating || 5
                  )}
                </div>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin:
                      "0 0 10px",
                  }}
                >
                  {review.content}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "#888",
                    margin: 0,
                  }}
                >
                  {review.author_name}
                  {" — "}
                  {new Date(
                    review.created_at
                  ).toLocaleDateString(
                    "fr-FR"
                  )}
                </p>
              </div>
            )
          )}
        </div>
      </main>
    </>
  )
}