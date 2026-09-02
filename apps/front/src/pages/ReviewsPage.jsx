import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";

import {
  useAuth,
} from "../auth/useAuth";

import "./ReviewsPage.css";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


export default function ReviewsPage() {
  const {
    user,
  } = useAuth();


  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  const [
    form,
    setForm,
  ] = useState({
    rating: 5,
    content: "",
  });


  useEffect(() => {
    loadReviews();
  }, []);


  async function loadReviews() {
    try {
      const response =
        await fetch(
          `${API}/api/reviews/`
        );


      const data =
        await response.json();


      setReviews(
        data.results ||
          data
      );
    } catch (loadError) {
      console.error(
        "Erreur chargement avis :",
        loadError
      );
    } finally {
      setLoading(false);
    }
  }


  async function submitReview(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setError("");


    if (
      !form.content.trim() ||
      form.content.trim().length < 10
    ) {
      setError(
        "Votre avis doit contenir au moins 10 caractères."
      );

      return;
    }


    setSaving(true);


    try {
      const token =
        localStorage.getItem(
          "access_token"
        );


      const response =
        await fetch(
          `${API}/api/reviews/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                rating:
                  Number(
                    form.rating
                  ),

                content:
                  form.content.trim(),
              }),
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (!response.ok) {
        throw data;
      }


      setForm({
        rating: 5,
        content: "",
      });


      setMessage(
        "Merci ! Votre avis a bien été publié."
      );


      await loadReviews();
    } catch (submitError) {
      setError(
        submitError?.detail ||
          submitError?.content?.[0] ||
          submitError?.rating?.[0] ||
          "Impossible d'envoyer votre avis."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <>
      <Navbar />


      <main className="reviewsPage">
        <div className="container">
          <header className="reviewsHero">
            <p className="reviewsEyebrow">
              Vos expériences
            </p>

            <h1 className="reviewsHeroTitle">
              Ce sont nos clients
              <br />
              <em>
                qui en parlent le mieux.
              </em>
            </h1>

            <p className="reviewsHeroText">
              Découvrez les retours de celles
              et ceux qui ont partagé une expérience
              avec Innov&apos;Events.
            </p>
          </header>


          <div className="reviewsLayout">
            {/* =========================================== */}
            {/* Publication                                 */}
            {/* =========================================== */}

            <section className="reviewSubmitPanel">
              <p className="reviewPanelEyebrow">
                Partager votre expérience
              </p>

              <h2>
                Laisser un avis
              </h2>


              {!user && (
                <div className="reviewAccessMessage">
                  <p>
                    Pour laisser un avis,
                    connectez-vous à votre compte.
                  </p>

                  <Link
                    to="/login"
                    className="reviewAccessLink"
                  >
                    Se connecter
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              )}


              {user &&
                user.role !== "CLIENT" && (
                  <p className="reviewAccessMessageText">
                    Seuls les comptes clients
                    peuvent publier un avis.
                  </p>
                )}


              {user?.role === "CLIENT" && (
                <form
                  onSubmit={
                    submitReview
                  }
                  className="reviewForm"
                >
                  <div className="reviewField">
                    <label
                      htmlFor="review-rating"
                      className="reviewLabel"
                    >
                      Note
                    </label>

                    <select
                      id="review-rating"
                      value={
                        form.rating
                      }
                      onChange={(
                        event
                      ) =>
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
                      className="reviewSelect"
                    >
                      {[
                        5,
                        4,
                        3,
                        2,
                        1,
                      ].map(
                        (
                          note
                        ) => (
                          <option
                            key={
                              note
                            }
                            value={
                              note
                            }
                          >
                            {
                              "★".repeat(
                                note
                              )
                            }
                            {" — "}
                            {note}/5
                          </option>
                        )
                      )}
                    </select>
                  </div>


                  <div className="reviewField">
                    <label
                      htmlFor="review-content"
                      className="reviewLabel"
                    >
                      Votre avis
                    </label>

                    <textarea
                      id="review-content"
                      value={
                        form.content
                      }
                      onChange={(
                        event
                      ) =>
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
                      rows={5}
                      placeholder={
                        "Partagez votre expérience "
                        + "avec Innov'Events..."
                      }
                      className="reviewTextarea"
                    />
                  </div>


                  {message && (
                    <div
                      className="reviewSuccess"
                      role="status"
                    >
                      {message}
                    </div>
                  )}


                  {error && (
                    <div
                      className="reviewError"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}


                  <button
                    type="submit"
                    className="btn reviewSubmitButton"
                    disabled={
                      saving
                    }
                  >
                    {
                      saving
                        ? "Envoi..."
                        : "Publier mon avis"
                    }

                    {!saving && (
                      <span aria-hidden="true">
                        →
                      </span>
                    )}
                  </button>
                </form>
              )}
            </section>


            {/* =========================================== */}
            {/* Liste                                      */}
            {/* =========================================== */}

            <section
              className="reviewsPublished"
              aria-labelledby="reviews-published-title"
            >
              <div className="reviewsPublishedHeader">
                <p className="reviewsPublishedEyebrow">
                  Témoignages
                </p>

                <h2
                  id="reviews-published-title"
                >
                  Avis publiés
                </h2>
              </div>


              {loading && (
                <div className="reviewsLoading">
                  Chargement des avis...
                </div>
              )}


              {!loading &&
                reviews.length === 0 && (
                  <div className="reviewsEmpty">
                    Aucun avis pour le moment.
                  </div>
                )}


              {!loading &&
                reviews.length > 0 && (
                  <div className="reviewsGrid">
                    {reviews.map(
                      (
                        review
                      ) => (
                        <article
                          key={
                            review.id
                          }
                          className="reviewCard"
                        >
                          <div
                            className="reviewStars"
                            aria-label={
                              `${review.rating || 5} sur 5`
                            }
                          >
                            {
                              "★".repeat(
                                review.rating ||
                                  5
                              )
                            }
                          </div>


                          <blockquote>
                            “{review.content}”
                          </blockquote>


                          <footer>
                            <strong>
                              {
                                review.author_name ||
                                "Client Innov'Events"
                              }
                            </strong>

                            {review.created_at && (
                              <time
                                dateTime={
                                  review.created_at
                                }
                              >
                                {
                                  new Date(
                                    review.created_at
                                  )
                                    .toLocaleDateString(
                                      "fr-FR"
                                    )
                                }
                              </time>
                            )}
                          </footer>
                        </article>
                      )
                    )}
                  </div>
                )}
            </section>
          </div>
        </div>
      </main>


      <Footer />
    </>
  );
}