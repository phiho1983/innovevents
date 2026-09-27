/**
 * @vitest-environment jsdom
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import AdminPage from "./AdminPage";
import { apiFetch } from "../api/client";


vi.mock("../components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("../components/admin/HomeHeroAdmin", () => ({
  default: () => <div>Hero admin</div>,
}));

vi.mock("../components/admin/HomePhotosAdminTab", () => ({
  default: () => <div>Photos admin</div>,
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: "admin_test",
      role: "ADMIN",
      is_superuser: true,
    },
  }),
}));

vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../api/prospects", () => ({
  getProspects: vi.fn().mockResolvedValue({ results: [] }),
  updateProspectStatus: vi.fn(),
  deleteProspect: vi.fn(),
}));

vi.mock("../api/quotes", () => ({
  getQuotes: vi.fn().mockResolvedValue({ results: [] }),
  createQuote: vi.fn(),
  sendQuote: vi.fn(),
  deleteQuote: vi.fn(),
  downloadQuotePdf: vi.fn(),
}));

vi.mock("../api/contactMessages", () => ({
  getContactMessages: vi.fn().mockResolvedValue({ results: [] }),
  updateContactMessage: vi.fn(),
  deleteContactMessage: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));


describe("Admin - détails événement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiFetch.mockImplementation((path) => {
      if (path === "/api/events/") {
        return Promise.resolve({
          results: [{
            id: 21,
            title: "Convention Marseille",
            description: "Description complète admin.",
            city: "Marseille",
            start_at: "2026-11-10T09:00:00Z",
            end_at: "2026-11-10T18:00:00Z",
            capacity: 90,
            event_type: "CONFERENCE",
            theme: "Entreprise",
            status: "DRAFT",
            visible: false,
            client_agreed: false,
            client: 31,
          }],
        });
      }

      if (path === "/api/users-rights/") {
        return Promise.resolve({
          results: [{
            id: 31,
            username: "alice",
            email: "alice@test.local",
            first_name: "Alice",
            last_name: "Martin",
            role: "CLIENT",
          }],
        });
      }

      return Promise.resolve({ results: [] });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("affiche le client et ouvre les détails", async () => {
    render(<AdminPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Événements",
      })
    );

    const card = await screen.findByRole(
      "article",
      { name: "Convention Marseille" }
    );

    expect(
      within(card).getByText(/Alice Martin/)
    ).toBeTruthy();

    expect(
      within(card).queryByText(
        "Description complète admin."
      )
    ).toBeNull();

    fireEvent.click(
      within(card).getByRole("button", {
        name: "Voir détails",
      })
    );

    expect(
      within(card).getByText(
        "Description complète admin."
      )
    ).toBeTruthy();

    expect(
      within(card).getByText(/Capacité\s*:\s*90/)
    ).toBeTruthy();
  });
});