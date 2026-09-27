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
  waitFor,
  within,
} from "@testing-library/react";

import AdminPage from "./AdminPage";

import {
  apiFetch,
} from "../api/client";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div>Navbar</div>
    ),
  })
);


vi.mock(
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => (
      <div>Hero admin</div>
    ),
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => (
      <div>Photos admin</div>
    ),
  })
);


vi.mock(
  "../auth/useAuth",
  () => ({
    useAuth: () => ({
      user: {
        id: 1,
        username: "admin_test",
        role: "ADMIN",
        is_superuser: true,
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
    getProspects:
      vi.fn().mockResolvedValue({
        results: [],
      }),

    updateProspectStatus:
      vi.fn(),

    deleteProspect:
      vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes:
      vi.fn().mockResolvedValue({
        results: [],
      }),

    createQuote:
      vi.fn(),

    sendQuote:
      vi.fn(),

    deleteQuote:
      vi.fn(),

    downloadQuotePdf:
      vi.fn(),
  })
);


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages:
      vi.fn().mockResolvedValue({
        results: [],
      }),

    updateContactMessage:
      vi.fn(),

    deleteContactMessage:
      vi.fn(),
  })
);


vi.mock(
  "react-router-dom",
  () => ({
    useNavigate: () =>
      vi.fn(),
  })
);


const EVENTS = [
  {
    id: 21,
    title: "Convention Marseille",
    description: "",
    city: "Marseille",
    start_at:
      "2026-11-10T09:00:00Z",
    end_at:
      "2026-11-10T18:00:00Z",
    capacity: 90,
    event_type: "CONFERENCE",
    theme: "Entreprise",
    status: "ACCEPTED",
    visible: false,
    client_agreed: false,
    client: 31,
  },
];


describe(
  "AdminPage - gestion des événements",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

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
            path === "/api/events/"
            && options.method === "POST"
          ) {
            return Promise.resolve({
              id: 22,
              title:
                "Séminaire Admin",
              description: "",
              city: "Lyon",
              start_at:
                "2026-12-01T09:00",
              end_at:
                "2026-12-01T18:00",
              capacity: 40,
              event_type: "SEMINAR",
              theme: "Innovation",
              status: "DRAFT",
              visible: false,
              client_agreed: false,
              client: 31,
            });
          }

          if (
            path
              === "/api/events/21/"
            && options.method
              === "DELETE"
          ) {
            return Promise.resolve(
              null
            );
          }

          return Promise.reject(
            new Error(
              `Appel API inattendu : ${path}`
            )
          );
        }
      );

      vi.spyOn(
        window,
        "confirm"
      ).mockReturnValue(true);
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    async function openEvents() {
      render(
        <AdminPage />
      );

      const tab =
        await screen.findByRole(
          "button",
          {
            name: "Événements",
          }
        );

      fireEvent.click(tab);
    }


    it(
      "affiche les événements dans le dashboard admin",
      async () => {
        await openEvents();

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/"
          );
        });

        expect(
          await screen.findByText(
            "Convention Marseille"
          )
        ).toBeTruthy();
      }
    );


    it(
      "permet a l admin de creer un evenement prive",
      async () => {
        await openEvents();

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Créer un événement",
            }
          )
        );

        fireEvent.change(
          screen.getByLabelText(
            "Client"
          ),
          {
            target: {
              value: "31",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Titre"
          ),
          {
            target: {
              value:
                "Séminaire Admin",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Ville"
          ),
          {
            target: {
              value: "Lyon",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Début"
          ),
          {
            target: {
              value:
                "2026-12-01T09:00",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Fin"
          ),
          {
            target: {
              value:
                "2026-12-01T18:00",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Capacité"
          ),
          {
            target: {
              value: "40",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Type"
          ),
          {
            target: {
              value: "SEMINAR",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Thème"
          ),
          {
            target: {
              value:
                "Innovation",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enregistrer l'événement",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/",
            expect.objectContaining({
              method: "POST",
            })
          );
        });

        const createCall =
          apiFetch.mock.calls.find(
            ([path, options]) =>
              path === "/api/events/"
              && options?.method
                === "POST"
          );

        const payload =
          JSON.parse(
            createCall[1].body
          );

        expect(
          payload
        ).toMatchObject({
          client: 31,
          title:
            "Séminaire Admin",
          city: "Lyon",
          capacity: 40,
          event_type:
            "SEMINAR",
          visible: false,
          client_agreed: false,
        });

        expect(
          await screen.findByText(
            "Séminaire Admin"
          )
        ).toBeTruthy();
      }
    );


    it(
      "permet a l admin de supprimer un evenement",
      async () => {
        await openEvents();

        const card =
          await screen.findByRole(
            "article",
            {
              name:
                "Convention Marseille",
            }
          );

        fireEvent.click(
          within(card).getByRole(
            "button",
            {
              name: "Supprimer",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/events/21/",
            {
              method: "DELETE",
            }
          );
        });

        await waitFor(() => {
          expect(
            screen.queryByText(
              "Convention Marseille"
            )
          ).toBeNull();
        });
      }
    );
  }
);