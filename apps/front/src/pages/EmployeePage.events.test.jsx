// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import EmployeePage from "./EmployeePage";

import {
  apiFetch,
} from "../api/client";

import {
  getProspects,
} from "../api/prospects";

import {
  getQuotes,
} from "../api/quotes";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => <div>Navbar</div>,
  })
);

vi.mock(
  "../auth/useAuth",
  () => ({
    useAuth: () => ({
      user: {
        username: "employee_test",
        role: "EMPLOYEE",
      },
    }),
  })
);

vi.mock(
  "../api/client",
  () => ({
    apiFetch: vi.fn(),
  })
);

vi.mock(
  "../api/prospects",
  () => ({
    getProspects: vi.fn(),
    updateProspectStatus: vi.fn(),
    convertProspect: vi.fn(),
  })
);

vi.mock(
  "../api/quotes",
  () => ({
    getQuotes: vi.fn(),
    createQuote: vi.fn(),
  })
);


const EVENTS = [
  {
    id: 7,
    title: "Séminaire Client",
    description: "Séminaire privé.",
    city: "Paris",
    start_at: "2026-09-10T09:00:00Z",
    end_at: "2026-09-10T18:00:00Z",
    capacity: 80,
    event_type: "SEMINAR",
    theme: "Innovation",
    status: "ACCEPTED",
    visible: false,
    client_agreed: false,
    client: 31,
  },
  {
    id: 8,
    title: "Événement vitrine",
    description: "Exemple public.",
    city: "Lyon",
    start_at: "2026-09-12T09:00:00Z",
    end_at: "2026-09-12T18:00:00Z",
    capacity: 100,
    event_type: "CONFERENCE",
    theme: "Vitrine",
    status: "ACCEPTED",
    visible: true,
    client_agreed: true,
    client: null,
  },
  {
    id: 9,
    title: "Convention Lyon",
    description: "Convention privée.",
    city: "Lyon",
    start_at: "2026-09-15T09:00:00Z",
    end_at: "2026-09-15T18:00:00Z",
    capacity: 120,
    event_type: "CONFERENCE",
    theme: "Entreprise",
    status: "IN_PROGRESS",
    visible: false,
    client_agreed: false,
    client: 44,
  },
];


describe(
  "EmployeePage - gestion des evenements prives",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects.mockResolvedValue({
        results: [],
      });

      getQuotes.mockResolvedValue({
        results: [],
      });

      apiFetch.mockImplementation(
        (
          path,
          options = {},
        ) => {
          if (
            path === "/api/events/"
            && !options.method
          ) {
            return Promise.resolve({
              results: EVENTS,
            });
          }

          if (
            path === "/api/events/7/start/"
            && options.method === "POST"
          ) {
            return Promise.resolve({
              status: "IN_PROGRESS",
            });
          }

          if (
            path === "/api/events/9/complete/"
            && options.method === "POST"
          ) {
            return Promise.resolve({
              status: "DONE",
            });
          }

          return Promise.reject(
            new Error(
              `Appel API inattendu : ${path}`
            )
          );
        }
      );
    });

    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    async function openEventsTab() {
      render(<EmployeePage />);

      const eventsTab =
        await screen.findByRole(
          "button",
          {
            name: "Événements",
          }
        );

      fireEvent.click(
        eventsTab
      );
    }


    it(
      "affiche uniquement les evenements prives des clients",
      async () => {
        await openEventsTab();

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/"
          );
        });

        expect(
          await screen.findByText(
            "Séminaire Client"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Convention Lyon"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Événement vitrine"
          )
        ).toBeNull();
      }
    );


    it(
      "permet a l employe de demarrer un evenement accepte",
      async () => {
        await openEventsTab();

        const eventCard =
          await screen.findByRole(
            "article",
            {
              name: "Séminaire Client",
            }
          );

        fireEvent.click(
          within(
            eventCard
          ).getByRole(
            "button",
            {
              name: "Démarrer",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/7/start/",
            {
              method: "POST",
            }
          );
        });

        await waitFor(() => {
          expect(
            within(
              eventCard
            ).getByText(
              "En cours"
            )
          ).toBeTruthy();
        });
      }
    );


    it(
      "permet a l employe de terminer un evenement en cours",
      async () => {
        await openEventsTab();

        const eventCard =
          await screen.findByRole(
            "article",
            {
              name: "Convention Lyon",
            }
          );

        fireEvent.click(
          within(
            eventCard
          ).getByRole(
            "button",
            {
              name: "Terminer",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/9/complete/",
            {
              method: "POST",
            }
          );
        });

        await waitFor(() => {
          expect(
            within(
              eventCard
            ).getByText(
              "Terminé"
            )
          ).toBeTruthy();
        });
      }
    );
  }
);