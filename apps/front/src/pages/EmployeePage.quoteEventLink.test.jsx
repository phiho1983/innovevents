/**
 * @vitest-environment jsdom
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import EmployeePage
  from "./EmployeePage";

import {
  apiFetch,
} from "../api/client";

import {
  getProspects,
} from "../api/prospects";

import {
  createQuote,
  getQuotes,
} from "../api/quotes";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div>Navbar</div>
    ),
  })
);


vi.mock(
  "../auth/useAuth",
  () => ({
    useAuth: () => ({
      user: {
        username:
          "employee_test",

        role:
          "EMPLOYEE",
      },
    }),
  })
);


vi.mock(
  "../api/client",
  () => ({
    apiFetch:
      vi.fn(),
  })
);


vi.mock(
  "../api/prospects",
  () => ({
    getProspects:
      vi.fn(),

    updateProspectStatus:
      vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes:
      vi.fn(),

    createQuote:
      vi.fn(),

    sendQuote:
      vi.fn(),

    downloadQuotePdf:
      vi.fn(),
  })
);


const EVENTS = [
  {
    id: 21,

    title:
      "Convention Marseille",

    status:
      "DRAFT",

    visible:
      false,

    client:
      31,
  },
];


describe(
  "EmployeePage - devis lie a un evenement",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects
        .mockResolvedValue({
          results: [],
        });

      getQuotes
        .mockResolvedValue({
          results: [],
        });

      apiFetch
        .mockImplementation(
          (path) => {
            if (
              path
              === "/api/events/"
            ) {
              return Promise.resolve({
                results:
                  EVENTS,
              });
            }

            return Promise.reject(
              new Error(
                `Appel API inattendu : ${path}`
              )
            );
          }
        );

      createQuote
        .mockResolvedValue({
          id: 99,

          reference:
            "99-270926",

          event:
            21,

          status:
            "DRAFT",

          tva_rate:
            "0.20",

          total_ht:
            "2500.00",

          total_tva:
            "500.00",

          total_ttc:
            "3000.00",

          items: [
            {
              id: 1,

              label:
                "Organisation convention",

              amount_ht:
                "2500.00",
            },
          ],
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
          <EmployeePage />
        );

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Devis",
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
              value:
                "21",
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
              value:
                "2500",
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