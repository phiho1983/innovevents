import "./HomeReviewsSection.css";
import {
  useEffect,
  useState,
} from "react";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


export default function HomeReviewsSection() {
  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    let active = true;


    async function loadReviews() {
      try {
        const response =
          await fetch(
            `${API}/api/reviews/`
          );


        if (!response.ok) {
          throw new Error(
            "Impossible de charger les avis"
          );
        }


        const data =
          await response.json();


        if (!active) {
          return;
        }


        const reviewList =
          Array.isArray(data)
            ? data
            : data.results || [];


        setReviews(
          reviewList.slice(0, 3)
        );
      } catch {
        if (!active) {
          return;
        }


        setReviews([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }


    loadReviews();


    return () => {
      active = false;
    };
  }, []);


  if (
    !loading &&
    reviews.length === 0
  ) {
    return null;
  }


  return (
    <section
      className="homeReviews"
      aria-labelledby="home-reviews-title"
    >
      <div className="homeReviewsHeader">
        <div>
          <p className="homeReviewsEyebrow">
            Ils nous font confiance
          </p>

          <h2
            id="home-reviews-title"
            className="homeReviewsTitle"
          >
            Des expériences
            <br />
            qui laissent une trace.
          </h2>
        </div>

        <a
          href="/avis"
          className="homeReviewsLink"
        >
          Voir tous les avis

          <span aria-hidden="true">
            →
          </span>
        </a>
      </div>


      {loading ? (
        <div
          className="homeReviewsLoading"
          aria-live="polite"
        >
          Chargement des avis...
        </div>
      ) : (
        <div className="homeReviewsGrid">
          {reviews.map(
            (review) => {
              const rating =
                Math.max(
                  1,
                  Math.min(
                    5,
                    Number(
                      review.rating
                    ) || 5
                  )
                );


              return (
                <article
                  key={review.id}
                  className="homeReviewCard"
                >
                  <div
                    className="homeReviewStars"
                    aria-label={`${rating} sur 5`}
                  >
                    {"★".repeat(
                      rating
                    )}
                  </div>


                  <blockquote className="homeReviewQuote">
                    “{review.content}”
                  </blockquote>


                  <footer className="homeReviewMeta">
                    <strong>
                      {review.author_name ||
                        "Client Innov'Events"}
                    </strong>

                    {review.created_at && (
                      <time
                        dateTime={
                          review.created_at
                        }
                      >
                        {new Date(
                          review.created_at
                        ).toLocaleDateString(
                          "fr-FR",
                          {
                            month:
                              "long",
                            year:
                              "numeric",
                          }
                        )}
                      </time>
                    )}
                  </footer>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}