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
  deleteQuote,
  getQuotes,
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

    deleteProspect:
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

    deleteContactMessage:
      vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes: vi.fn(),
    createQuote: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
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


const QUOTES = [
  {
    id: 12,
    reference: "12-030926",
    prospect: 5,
    client: null,
    status: "DRAFT",
    total_ht: "1000.00",
    total_tva: "200.00",
    total_ttc: "1200.00",
    items: [],
  },
  {
    id: 13,
    reference: "13-040926",
    prospect: 6,
    client: 33,
    status: "SENT",
    total_ht: "500.00",
    total_tva: "100.00",
    total_ttc: "600.00",
    items: [],
  },
];


describe(
  "AdminPage - référence et suppression devis",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getQuotes.mockResolvedValue(
        QUOTES
      );

      deleteQuote.mockResolvedValue(
        null
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


    async function openQuotesTab() {
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

      await screen.findByText(
        "Devis 12-030926"
      );
    }


    it(
      "affiche la référence commerciale du devis",
      async () => {
        await openQuotesTab();

        expect(
          screen.getByText(
            "Devis 12-030926"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Devis 13-040926"
          )
        ).toBeTruthy();
      }
    );


    it(
      "affiche Supprimer uniquement pour un brouillon",
      async () => {
        await openQuotesTab();

        const buttons =
          screen.getAllByRole(
            "button",
            {
              name: "Supprimer",
            }
          );

        expect(
          buttons
        ).toHaveLength(1);
      }
    );


    it(
      "supprime un brouillon après confirmation",
      async () => {
        await openQuotesTab();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Supprimer",
            }
          )
        );

        expect(
          window.confirm
        ).toHaveBeenCalled();

        await waitFor(
          () => {
            expect(
              deleteQuote
            ).toHaveBeenCalledWith(
              12
            );
          }
        );

        await waitFor(
          () => {
            expect(
              screen.queryByText(
                "Devis 12-030926"
              )
            ).toBeNull();
          }
        );

        expect(
          screen.getByText(
            "Devis 13-040926"
          )
        ).toBeTruthy();
      }
    );
  }
);