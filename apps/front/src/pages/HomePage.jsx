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
import {
  HomeEventPhotos,
} from "../components/EventPhotosCarousel";
import Footer from "../components/Footer/Footer";


export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [notification, setNotification] =
    useState(
      location.state?.quoteSuccess || ""
    );

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });

    const timer = setTimeout(() => {
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
      <div className="container">
        <Navbar />

        {notification && (
          <div
            role="status"
            aria-live="polite"
            style={{
              margin: "20px auto",
              padding: "14px 18px",
              maxWidth: 900,
              border: "1px solid #badbcc",
              borderRadius: 8,
              background: "#d1e7dd",
              color: "#0f5132",
              fontWeight: 600,
            }}
          >
            ✓ {notification}
          </div>
        )}

        <Hero />
        <HomeEventPhotos />
        <Outlet />
        <Footer />
      </div>
    </>
  );
}