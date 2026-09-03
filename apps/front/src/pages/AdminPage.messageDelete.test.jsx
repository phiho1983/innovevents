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
  deleteContactMessage,
  getContactMessages,
} from "../api/contactMessages";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => <div>NAVBAR</div>,
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

    convertProspect:
      vi.fn(),
  })
);


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes:
      vi.fn().mockResolvedValue([]),

    createQuote:
      vi.fn(),

    sendQuote:
      vi.fn(),
  })
);


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages:
      vi.fn(),

    updateContactMessage:
      vi.fn(),

    deleteContactMessage:
      vi.fn(),
  })
);


vi.mock(
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => <div>HERO</div>,
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => <div>HOME PHOTOS</div>,
  })
);


describe(
  "AdminPage - suppression Message",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getContactMessages
        .mockResolvedValue([
          {
            id: 4,
            name: "David Archive",
            email: "david@example.com",
            subject: "Ancien message",
            message: "À supprimer.",
            status: "ARCHIVED",
          },
        ]);

      deleteContactMessage
        .mockResolvedValue(
          undefined
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


    it(
      "supprime définitivement un message archivé",
      async () => {
        render(<AdminPage />);

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Messages",
            }
          )
        );

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Archivés (1)",
            }
          )
        );

        expect(
          await screen.findByText(
            "David Archive"
          )
        ).toBeTruthy();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Supprimer définitivement",
            }
          )
        );

        await waitFor(() => {
          expect(
            deleteContactMessage
          ).toHaveBeenCalledWith(
            4
          );
        });

        expect(
          screen.queryByText(
            "David Archive"
          )
        ).toBeNull();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Archivés (0)",
            }
          )
        ).toBeTruthy();
      }
    );
  }
);
