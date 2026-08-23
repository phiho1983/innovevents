import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  ClientOnlyRoute,
  StaffOnlyRoute,
} from "./auth/RoleRoute";

import ActivateAccountPage from "./pages/ActivateAccountPage";
import AdminPage from "./pages/AdminPage";
import ClientAccountPage from "./pages/ClientAccountPage";
import ContactPage from "./pages/ContactPage";
import EventsPage from "./pages/EventsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LegalPage from "./pages/LegalPage";
import LoginPage from "./pages/LoginPage";
import QuoteRequestPage from "./pages/QuoteRequestPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ReviewsPage from "./pages/ReviewsPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";


export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/demande-de-devis"
        element={<QuoteRequestPage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

      <Route
        path="/activation"
        element={<ActivateAccountPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      <Route
        path="/evenements"
        element={<EventsPage />}
      />

      <Route
        path="/contact"
        element={<ContactPage />}
      />

      <Route
        path="/avis"
        element={<ReviewsPage />}
      />

      <Route
        path="/mentions-legales"
        element={<LegalPage />}
      />

      <Route
        element={<StaffOnlyRoute />}
      >
        <Route
          path="/admin"
          element={<AdminPage />}
        />
      </Route>

      <Route
        element={<ClientOnlyRoute />}
      >
        <Route
          path="/client"
          element={<ClientAccountPage />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}