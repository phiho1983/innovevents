// @vitest-environment jsdom

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

import EmployeePage from "./EmployeePage";

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


const PROSPECTS = [
  {
    id: 1,
    first_name: "Claire",
    last_name: "Martin",
    email: "claire@test.local",
    company: "Martin Events",
    event_type: "Séminaire",
    status: "QUALIFIED",
    created_at: "2026-08-29T10:00:00Z",
  },
];


const QUOTES = [
  {
    id: 42,
    prospect: 1,
    status: "SENT",
    tva_rate: "0.20",
    total_ht: "2000.00",
    total_tva: "400.00",
    total_ttc: "2400.00",
    created_at: "2026-08-29T11:00:00Z",
    items: [
      {
        id: 1,
        label: "Organisation événement",
        amount_ht: "2000.00",
      },
    ],
  },
];


describe(
  "EmployeePage - gestion des devis",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects.mockResolvedValue({
        results: PROSPECTS,
      });

      getQuotes.mockResolvedValue({
        results: QUOTES,
      });
    });

    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });

    async function openQuotesTab() {
      render(<EmployeePage />);

      const quotesTab =
        await screen.findByRole(
          "button",
          {
            name: "Devis",
          }
        );

      fireEvent.click(
        quotesTab
      );
    }

    it(
      "affiche les devis accessibles a l employe",
      async () => {
        await openQuotesTab();

        await waitFor(() => {
          expect(
            getQuotes
          ).toHaveBeenCalled();
        });

        expect(
          await screen.findByText(
            "Devis #42"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Envoyé"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            /2400\.00 €/
          )
        ).toBeTruthy();
      }
    );

    it(
      "permet a l employe de creer un devis pour un prospect",
      async () => {
        createQuote.mockResolvedValue({
          id: 99,
          prospect: 1,
          status: "DRAFT",
          tva_rate: "0.20",
          total_ht: "500.00",
          total_tva: "100.00",
          total_ttc: "600.00",
          items: [
            {
              id: 10,
              label: "Sonorisation",
              amount_ht: "500.00",
            },
          ],
        });

        await openQuotesTab();

        const newQuoteButton =
          await screen.findByRole(
            "button",
            {
              name: /nouveau devis/i,
            }
          );

        fireEvent.click(
          newQuoteButton
        );

        fireEvent.change(
          screen.getByLabelText(
            "Prospect"
          ),
          {
            target: {
              value: "1",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Libellé prestation"
          ),
          {
            target: {
              value: "Sonorisation",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Montant HT"
          ),
          {
            target: {
              value: "500.00",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Créer le devis",
            }
          )
        );

        await waitFor(() => {
          expect(
            createQuote
          ).toHaveBeenCalledWith({
            prospect: 1,
            tva_rate: "0.20",
            items: [
              {
                label:
                  "Sonorisation",
                amount_ht:
                  "500.00",
              },
            ],
          });
        });

        expect(
          await screen.findByText(
            "Devis #99"
          )
        ).toBeTruthy();
      }
    );

    it(
      "calcule les totaux du nouveau devis avant creation",
      async () => {
        await openQuotesTab();

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name: /nouveau devis/i,
            }
          )
        );

        fireEvent.change(
          screen.getByLabelText(
            "Montant HT"
          ),
          {
            target: {
              value: "1000",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: /ajouter prestation/i,
            }
          )
        );

        const amountInputs =
          screen.getAllByLabelText(
            "Montant HT"
          );

        fireEvent.change(
          amountInputs[1],
          {
            target: {
              value: "500",
            },
          }
        );

        expect(
          screen.getByText(
            /Total HT :/
          ).textContent
        ).toContain(
          "1500.00 €"
        );

        expect(
          screen.getByText(
            /^TVA :/
          ).textContent
        ).toContain(
          "300.00 €"
        );

        expect(
          screen.getByText(
            /Total TTC :/
          ).textContent
        ).toContain(
          "1800.00 €"
        );
      }
    );
  }
);