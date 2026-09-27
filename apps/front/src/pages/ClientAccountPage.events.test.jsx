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

import ClientAccountPage from "./ClientAccountPage";
import { getMyQuotes } from "../api/quotes";


vi.mock("../components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 31,
      username: "alice",
      email: "alice@test.local",
      role: "CLIENT",
    },
  }),
}));

vi.mock("../api/quotes", () => ({
  getMyQuotes: vi.fn(),
  quoteAction: vi.fn(),
}));


describe("Client - événements privés", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getMyQuotes.mockResolvedValue({
      results: [],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [{
            id: 21,
            title: "Séminaire Marseille",
            description:
              "Description complète client.",
            city: "Marseille",
            start_at:
              "2026-10-28T09:00:00Z",
            end_at:
              "2026-10-28T18:00:00Z",
            capacity: 80,
            event_type: "SEMINAR",
            theme: "Innovation",
            status: "DRAFT",
            visible: false,
            client_agreed: false,
            client: 31,
          }],
        }),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it(
    "affiche un événement attribué même en brouillon et permet de voir les détails",
    async () => {
      render(<ClientAccountPage />);

      const title =
        await screen.findByText(
          "Séminaire Marseille"
        );

      const card =
        title.closest("article");

      expect(card).toBeTruthy();

      expect(
        within(card).queryByText(
          "Description complète client."
        )
      ).toBeNull();

      fireEvent.click(
        within(card).getByRole("button", {
          name: "Voir détails",
        })
      );

      expect(
        within(card).getByText(
          "Description complète client."
        )
      ).toBeTruthy();

      expect(
        within(card).getByText(
          /Capacité\s*:\s*80/
        )
      ).toBeTruthy();

      expect(
        within(card).getByText(
          /Brouillon/
        )
      ).toBeTruthy();
    }
  );
});