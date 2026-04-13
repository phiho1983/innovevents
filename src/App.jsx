// front/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import QuoteRequestPage from "./pages/QuoteRequestPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import ClientAccountPage from "./pages/ClientAccountPage";

import { StaffOnlyRoute, ClientOnlyRoute } from "./auth/RoleRoute";
import EventsPage       from "./pages/EventsPage"

import ReviewsPage      from "./pages/ReviewsPage"
import LegalPage        from "./pages/LegalPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/demande-de-devis" element={<QuoteRequestPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ADMIN : protégé */}
      <Route element={<StaffOnlyRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* CLIENT : protégé */}
      <Route element={<ClientOnlyRoute />}>
        <Route path="/client" element={<ClientAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/evenements"       element={<EventsPage />} />
      <Route path="/contact"          element={<ContactPage />} />
      <Route path="/avis"             element={<ReviewsPage />} />
      <Route path="/mentions-legales" element={<LegalPage />} />
    </Routes>
  );
}
