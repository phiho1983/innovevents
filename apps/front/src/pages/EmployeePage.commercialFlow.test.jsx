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

import EmployeePage
  from "./EmployeePage";

import {
  getProspects,
} from "../api/prospects";

import {
  createQuote,
  getQuotes,
  sendQuote,
} from "../api/quotes";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div>
        NAVBAR
      </div>
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
  })
);


const REQUESTS = [
  {
    id: 5,

    first_name:
      "Claire",

    last_name:
      "Martin",

    email:
      "claire@test.local",

    company:
      "Martin Events",

    event_type:
      "Séminaire",

    status:
      "TO_CONTACT",

    created_at:
      "2026-09-03T10:00:00Z",
  },
];


const QUOTES = [
  {
    id: 12,

    prospect:
      5,

    client:
      null,

    status:
      "DRAFT",

    tva_rate:
      "0.20",

    total_ht:
      "1000.00",

    total_tva:
      "200.00",

    total_ttc:
      "1200.00",

    items: [
      {
        id:
          1,

        label:
          "Organisation",

        amount_ht:
          "1000.00",
      },
    ],
  },
];


describe(
  "EmployeePage - workflow commercial",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();


      getProspects
        .mockResolvedValue({
          results:
            REQUESTS,
        });


      getQuotes
        .mockResolvedValue({
          results:
            QUOTES,
        });


      createQuote
        .mockResolvedValue({
          id:
            99,

          prospect:
            5,

          status:
            "DRAFT",

          tva_rate:
            "0.20",

          total_ht:
            "500.00",

          total_tva:
            "100.00",

          total_ttc:
            "600.00",

          items: [
            {
              id:
                2,

              label:
                "Sonorisation",

              amount_ht:
                "500.00",
            },
          ],
        });


      sendQuote
        .mockResolvedValue({
          quote_id:
            12,

          status:
            "SENT",

          client_id:
            33,

          client_created:
            true,

          activation_required:
            true,

          activation_email_sent:
            true,
        });
    });


    afterEach(() => {
      cleanup();

      vi.restoreAllMocks();
    });


    it(
      "utilise Demandes au lieu de Prospects et ne propose plus la conversion manuelle",
      async () => {
        render(
          <EmployeePage />
        );


        expect(
          await screen.findByRole(
            "button",
            {
              name:
                "Demandes",
            }
          )
        ).toBeTruthy();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Prospects",
            }
          )
        ).toBeNull();


        expect(
          await screen.findByText(
            "Claire Martin"
          )
        ).toBeTruthy();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                /convertir.*client/i,
            }
          )
        ).toBeNull();
      }
    );


    it(
      "cree un devis en selectionnant une demande et non un ID manuel",
      async () => {
        render(
          <EmployeePage />
        );


        fireEvent.click(
          screen.getByRole(
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
                /nouveau devis/i,
            }
          )
        );


        expect(
          screen.queryByLabelText(
            "Prospect"
          )
        ).toBeNull();


        fireEvent.change(
          screen.getByLabelText(
            "Demande"
          ),
          {
            target: {
              value:
                "5",
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
                "Sonorisation",
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
                "500.00",
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


        await waitFor(
          () => {
            expect(
              createQuote
            ).toHaveBeenCalledWith({
              prospect:
                5,

              tva_rate:
                "0.20",

              items: [
                {
                  label:
                    "Sonorisation",

                  amount_ht:
                    "500.00",
                },
              ],
            });
          }
        );
      }
    );


    it(
      "permet a l employe d envoyer un devis brouillon",
      async () => {
        render(
          <EmployeePage />
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Devis",
            }
          )
        );


        expect(
          await screen.findByText(
            "Devis #12"
          )
        ).toBeTruthy();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Envoyer le devis",
            }
          )
        );


        await waitFor(
          () => {
            expect(
              sendQuote
            ).toHaveBeenCalledWith(
              12
            );
          }
        );


        expect(
          await screen.findByText(
            "Envoyé"
          )
        ).toBeTruthy();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Envoyer le devis",
            }
          )
        ).toBeNull();
      }
    );
  }
);