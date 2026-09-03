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
  getProspects,
} from "../api/prospects";

import {
  createQuote,
  getQuotes,
} from "../api/quotes";

import {
  getContactMessages,
  updateContactMessage,
} from "../api/contactMessages";


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
        id: 1,
        username: "admin",
        role: "ADMIN",
      },
      logout: vi.fn(),
    }),
  })
);


vi.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => vi.fn(),
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


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages: vi.fn(),
    updateContactMessage: vi.fn(),
  })
);


vi.mock(
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => (
      <div>
        HERO
      </div>
    ),
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => (
      <div>
        HOME PHOTOS
      </div>
    ),
  })
);


describe(
  "AdminPage - workflow commercial",
  () => {
    beforeEach(() => {
      getProspects.mockResolvedValue([
        {
          id: 42,
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean@example.com",
          phone: "",
          company: "",
          city: "",
          event_type: "Mariage",
          desired_date: "2026-10-15",
          participant_count: 80,
          message:
            "Nous souhaitons organiser "
            + "un mariage en octobre.",
          status: "TO_CONTACT",
          created_at:
            "2026-09-03T10:00:00Z",
        },
      ]);


      getQuotes.mockResolvedValue([]);


      getContactMessages
        .mockResolvedValue([
          {
            id: 7,
            name: "Marie Martin",
            email: "marie@example.com",
            subject: "Partenariat",
            message:
              "Bonjour, je souhaite "
              + "vous proposer un partenariat.",
            status: "NEW",
            created_at:
              "2026-09-03T11:00:00Z",
          },
        ]);


      updateContactMessage
        .mockResolvedValue({
          id: 7,
          status: "READ",
        });


      createQuote.mockResolvedValue({
        id: 99,
        prospect: 42,
        status: "DRAFT",
        tva_rate: "0.20",
        total_ht: "1000.00",
        total_tva: "200.00",
        total_ttc: "1200.00",
        items: [
          {
            id: 1,
            label: "Organisation",
            amount_ht: "1000.00",
          },
        ],
      });
    });


    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "utilise les onglets Demandes, Messages et Devis",
      async () => {
        render(
          <AdminPage />
        );


        expect(
          screen.getByRole(
            "button",
            {
              name: "Demandes",
            }
          )
        ).toBeTruthy();


        expect(
          screen.getByRole(
            "button",
            {
              name: "Messages",
            }
          )
        ).toBeTruthy();


        expect(
          screen.getByRole(
            "button",
            {
              name: "Devis",
            }
          )
        ).toBeTruthy();


        expect(
          screen.queryByRole(
            "button",
            {
              name: "Prospects",
            }
          )
        ).toBeNull();
      }
    );


    it(
      "cree un devis directement depuis une demande sans saisir son ID",
      async () => {
        render(
          <AdminPage />
        );


        expect(
          await screen.findByText(
            "Jean Dupont"
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            /Mariage/
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            /80 participants/
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            /Nous souhaitons organiser/
          )
        ).toBeTruthy();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Créer un devis",
            }
          )
        );


        expect(
          screen.getByText(
            /Nouveau devis pour Jean Dupont/
          )
        ).toBeTruthy();


        expect(
          screen.queryByText(
            /ID du prospect/i
          )
        ).toBeNull();


        fireEvent.change(
          screen.getByPlaceholderText(
            "Libellé prestation"
          ),
          {
            target: {
              value:
                "Organisation",
            },
          }
        );


        fireEvent.change(
          screen.getByPlaceholderText(
            "Montant HT €"
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
              prospect: 42,
              tva_rate: "0.20",
              items: [
                {
                  label:
                    "Organisation",
                  amount_ht:
                    "1000",
                },
              ],
            });
          }
        );
      }
    );


    it(
      "affiche les messages de contact et permet de les marquer comme lus",
      async () => {
        render(
          <AdminPage />
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Messages",
            }
          )
        );


        expect(
          await screen.findByText(
            "Partenariat"
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            "Marie Martin"
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            /vous proposer un partenariat/
          )
        ).toBeTruthy();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Marquer comme lu",
            }
          )
        );


        await waitFor(
          () => {
            expect(
              updateContactMessage
            ).toHaveBeenCalledWith(
              7,
              {
                status: "READ",
              }
            );
          }
        );
      }
    );
  }
);