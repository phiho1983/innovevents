import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getHomePathForUser,
} from "../auth/roleAccess";

import "./Navbar.css";


export default function Navbar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);


  function closeMenu() {
    setMenuOpen(false);
  }


  function handleLogout() {
    logout();

    closeMenu();

    navigate("/");
  }


  return (
    <header className="navbar">
      <div className="container navbarInner">
        <Link
          to="/"
          className="brandBtn"
          aria-label="Innov'Events - Accueil"
          onClick={closeMenu}
        >
          <span>
            Innov
          </span>

          <span
            className="brandAccent"
            aria-hidden="true"
          >
            ’
          </span>

          <span>
            Events
          </span>
        </Link>


        <button
          type="button"
          className={`navToggle ${
            menuOpen
              ? "navToggleOpen"
              : ""
          }`}
          aria-label={
            menuOpen
              ? "Fermer le menu"
              : "Ouvrir le menu"
          }
          aria-expanded={
            menuOpen
          }
          aria-controls="main-navigation"
          onClick={() => {
            setMenuOpen(
              (open) =>
                !open
            );
          }}
        >
          <span />
          <span />
        </button>


        <nav
          id="main-navigation"
          className={`navlinks ${
            menuOpen
              ? "navlinksOpen"
              : ""
          }`}
          aria-label="Navigation principale"
        >
          <Link
            to="/evenements"
            onClick={closeMenu}
          >
            Événements
          </Link>

          <Link
            to="/avis"
            onClick={closeMenu}
          >
            Avis
          </Link>

          <Link
            to="/contact"
            onClick={closeMenu}
          >
            Contact
          </Link>


          {user ? (
            <>
              <Link
                to={
                  getHomePathForUser(
                    user
                  )
                }
                onClick={closeMenu}
              >
                {user.username ||
                  "Mon espace"}
              </Link>

              <button
                type="button"
                className="btn-soft navLogout"
                onClick={
                  handleLogout
                }
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
            >
              Se connecter
            </Link>
          )}


          <Link
            to="/demande-de-devis"
            className="btn navProjectButton"
            onClick={closeMenu}
          >
            Parler de votre projet
          </Link>
        </nav>
      </div>
    </header>
  );
}
