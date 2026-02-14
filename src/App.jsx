import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import QuoteRequestPage from "./pages/QuoteRequestPage";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Innov'Events</h2>
          <nav>
            <Link to="/demande-de-devis">Demande de devis</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/demande-de-devis" element={<QuoteRequestPage />} />
          <Route
            path="*"
            element={
              <div style={{ marginTop: 24 }}>
                <p>Va sur :</p>
                <Link to="/demande-de-devis">/demande-de-devis</Link>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
