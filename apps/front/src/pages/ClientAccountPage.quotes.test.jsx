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

import ClientAccountPage
  from "./ClientAccountPage";

import {
  getMyQuotes,
  quoteAction,
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
        id: 33,
        username:
          "client_test",
        email:
          "client@test.local",
        role:
          "CLIENT",
      },
      logout:
        vi.fn(),
    }),
  })
);


vi.mock(
  "react-router-dom",
  () => ({
    useNavigate:
      () => vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getMyQuotes:
      vi.fn(),

    quoteAction:
      vi.fn(),
  })
);


const QUOTES = [
  {
    id: 42,

    reference:
      "42-290826",

    status:
      "SENT",

    total_ht:
      "2000.00",

    total_tva:
      "400.00",

    total_ttc:
      "2400.00",

    items: [
      {
        id: 1,

        label:
          "Organisation événement",

        amount_ht:
          "2000.00",
      },
    ],
  },
];


describe(
  "ClientAccountPage - devis",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getMyQuotes
        .mockResolvedValue({
          results:
            QUOTES,
        });

      quoteAction
        .mockResolvedValue({
          status:
            "ACCEPTED",
        });

      vi.stubGlobal(
        "fetch",
        vi.fn()
          .mockResolvedValue({
            json:
              vi.fn()
                .mockResolvedValue({
                  results: [],
                }),
          })
      );
    });


    afterEach(() => {
      cleanup();

      vi.unstubAllGlobals();

      vi.restoreAllMocks();
    });


    it(
      "affiche la référence commerciale du devis sans suppression",
      async () => {
        render(
          <ClientAccountPage />
        );


        expect(
          await screen.findByText(
            "Devis 42-290826"
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


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Supprimer",
            }
          )
        ).toBeNull();
      }
    );


    it(
      "permet au client d accepter son devis",
      async () => {
        render(
          <ClientAccountPage />
        );


        await screen.findByText(
          "Devis 42-290826"
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Accepter/i,
            }
          )
        );


        await waitFor(
          () => {
            expect(
              quoteAction
            ).toHaveBeenCalledWith(
              42,
              "accept",
              ""
            );
          }
        );


        expect(
          await screen.findByText(
            "Accepté"
          )
        ).toBeTruthy();
      }
    );
  }
);