import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ExpertisesSection from "../components/ExpertisesSection";
import HomeReviewsSection from "../components/HomeReviewsSection";

import {
  HomeEventPhotos,
} from "../components/EventPhotosCarousel";

import Footer from "../components/Footer/Footer";


export default function HomePage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();


  const [
    notification,
    setNotification,
  ] = useState(
    location.state?.quoteSuccess ||
      ""
  );


  useEffect(() => {
    if (!notification) {
      return undefined;
    }


    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      }
    );


    const timer =
      setTimeout(() => {
        setNotification("");
      }, 5000);


    return () => {
      clearTimeout(timer);
    };
  }, [
    notification,
    navigate,
    location.pathname,
  ]);


  return (
    <>
      {/* ================================================= */}
      {/* Navigation                                      */}
      {/* ================================================= */}

      <Navbar />


      {/* ================================================= */}
      {/* Contenu principal                               */}
      {/* ================================================= */}

      <main>
        <div className="container">
          {notification && (
            <div
              role="status"
              aria-live="polite"
              style={{
                margin:
                  "20px auto",
                padding:
                  "14px 18px",
                maxWidth:
                  900,
                border:
                  "1px solid var(--color-success-border)",
                borderRadius:
                  "var(--radius-sm)",
                background:
                  "var(--color-success-bg)",
                color:
                  "var(--color-success-text)",
                fontWeight:
                  600,
              }}
            >
              ✓ {notification}
            </div>
          )}


          {/* Hero */}

          <Hero />


          {/* Réalisations */}

          <HomeEventPhotos />


          {/* Expertises */}

          <ExpertisesSection />


          {/* Avis clients */}

          <HomeReviewsSection />


          {/* Routes enfants éventuelles */}

          <Outlet />
        </div>
      </main>


      {/* ================================================= */}
      {/* Footer                                          */}
      {/* ================================================= */}

      <Footer />
    </>
  );
}