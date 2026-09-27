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

import EmployeePage from "./EmployeePage";
import { apiFetch } from "../api/client";
import { getProspects } from "../api/prospects";
import { getQuotes } from "../api/quotes";


vi.mock("../components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      username: "employee_test",
      role: "EMPLOYEE",
    },
  }),
}));

vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../api/prospects", () => ({
  getProspects: vi.fn(),
  updateProspectStatus: vi.fn(),
  convertProspect: vi.fn(),
}));

vi.mock("../api/quotes", () => ({
  getQuotes: vi.fn(),
  createQuote: vi.fn(),
  sendQuote: vi.fn(),
  deleteQuote: vi.fn(),
  downloadQuotePdf: vi.fn(),
}));


describe("Employee - détails événement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProspects.mockResolvedValue({
      results: [],
    });

    getQuotes.mockResolvedValue({
      results: [],
    });

    apiFetch.mockImplementation(
      (path, options = {}) => {
        if (
          path === "/api/events/"
          && !options.method
        ) {
          return Promise.resolve({
            results: [{
              id: 7,
              title: "Séminaire Client",
              description:
                "Description complète employee.",
              city: "Paris",
              start_at:
                "2026-10-10T09:00:00Z",
              end_at:
                "2026-10-10T18:00:00Z",
              capacity: 80,
              event_type: "SEMINAR",
              theme: "Innovation",
              status: "ACCEPTED",
              visible: false,
              client_agreed: false,
              client: 31,
            }],
          });
        }

        return Promise.resolve({
          results: [],
        });
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("ouvre et ferme les détails de l événement", async () => {
    render(<EmployeePage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Événements",
      })
    );

    const card = await screen.findByRole(
      "article",
      { name: "Séminaire Client" }
    );

    expect(
      within(card).queryByText(
        "Description complète employee."
      )
    ).toBeNull();

    fireEvent.click(
      within(card).getByRole("button", {
        name: "Voir détails",
      })
    );

    expect(
      within(card).getByText(
        "Description complète employee."
      )
    ).toBeTruthy();

    expect(
      within(card).getByText(/Capacité\s*:\s*80/)
    ).toBeTruthy();

    expect(
      within(card).getByText(/Innovation/)
    ).toBeTruthy();
  });
});