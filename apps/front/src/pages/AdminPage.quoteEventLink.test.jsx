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
} from "@testing-library/react";

import AdminPage from "./AdminPage";

import {
  apiFetch,
} from "../api/client";

import {
  createQuote,
  getQuotes,
} from "../api/quotes";

import {
  getProspects,
} from "../api/prospects";


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
    getProspects: vi.fn(),
    updateProspectStatus: vi.fn(),
    deleteProspect: vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes: vi.fn(),
    createQuote: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
    downloadQuotePdf: vi.fn(),
  })
);


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages:
      vi.fn().mockResolvedValue([]),

    updateContactMessage:
      vi.fn(),

    deleteContactMessage:
      vi.fn(),
  })
);


const PRIVATE_EVENT = {
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
  status: "DRAFT",
  visible: false,
  client_agreed: false,
  client: 31,
};


describe(
  "AdminPage - devis lie a un evenement",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects.mockResolvedValue(
        []
      );

      getQuotes.mockResolvedValue(
        []
      );

      apiFetch.mockImplementation(
        (path) => {
          if (
            path === "/api/events/"
          ) {
            return Promise.resolve({
              results: [
                PRIVATE_EVENT,
              ],
            });
          }

          return Promise.resolve(
            []
          );
        }
      );

      createQuote.mockResolvedValue({
        id: 77,
        reference:
          "DEV-2026-0077",
        event: 21,
        client: 31,
        status: "DRAFT",
        tva_rate: "0.20",
        items: [
          {
            id: 1,
            label:
              "Organisation convention",
            amount_ht:
              "2500.00",
          },
        ],
        total_ht:
          "2500.00",
        total_tva:
          "500.00",
        total_ttc:
          "3000.00",
      });
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    it(
      "cree un devis directement pour un evenement prive",
      async () => {
        render(
          <AdminPage />
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Devis",
            }
          )
        );

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "+ Nouveau devis",
            }
          )
        );

        const eventSelect =
          await screen.findByLabelText(
            "Événement privé"
          );

        expect(
          screen.getByRole(
            "option",
            {
              name:
                "Convention Marseille",
            }
          )
        ).toBeTruthy();

        fireEvent.change(
          eventSelect,
          {
            target: {
              value: "21",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Libellé prestation"
          ),
          {
            target: {
              value:
                "Organisation convention",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Montant HT"
          ),
          {
            target: {
              value: "2500",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Créer le devis",
            }
          )
        );

        await waitFor(() => {
          expect(
            createQuote
          ).toHaveBeenCalledTimes(
            1
          );
        });

        const payload =
          createQuote.mock.calls[0][0];

        expect(
          payload.event
        ).toBe(
          21
        );

        expect(
          payload
        ).not.toHaveProperty(
          "prospect"
        );

        expect(
          payload
        ).toMatchObject({
          tva_rate:
            "0.20",

          items: [
            {
              label:
                "Organisation convention",

              amount_ht:
                "2500",
            },
          ],
        });
      }
    );
  }
);