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
  getQuotes,
  sendQuote,
} from "../api/quotes";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div>NAVBAR</div>
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
    getProspects:
      vi.fn().mockResolvedValue([]),

    updateProspectStatus:
      vi.fn(),
  })
);


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages:
      vi.fn().mockResolvedValue([]),

    updateContactMessage:
      vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes: vi.fn(),
    createQuote: vi.fn(),
    sendQuote: vi.fn(),
  })
);


vi.mock(
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => (
      <div>HERO</div>
    ),
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => (
      <div>PHOTOS</div>
    ),
  })
);


describe(
  "AdminPage - envoi devis",
  () => {
    beforeEach(() => {
      getQuotes.mockResolvedValue([
        {
          id: 12,
          prospect: 5,
          client: null,
          status: "DRAFT",
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
        },
      ]);

      sendQuote.mockResolvedValue({
        quote_id: 12,
        status: "SENT",
        client_id: 33,
        client_created: true,
        activation_required: true,
        activation_email_sent: true,
      });
    });


    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "permet d envoyer un devis brouillon",
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