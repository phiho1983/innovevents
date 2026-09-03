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
  deleteProspect,
  getProspects,
} from "../api/prospects";


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
    getProspects: vi.fn(),
    updateProspectStatus: vi.fn(),
    deleteProspect: vi.fn(),
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
      vi.fn().mockResolvedValue([]),

    updateContactMessage:
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
  "AdminPage - suppression demande archivée",
  () => {
    beforeEach(() => {
      getProspects.mockResolvedValue([
        {
          id: 4,
          first_name: "David",
          last_name: "Archive",
          email: "david@example.com",
          phone: "",
          company: "",
          city: "",
          event_type: "Anniversaire",
          desired_date: "2026-12-20",
          participant_count: 30,
          message: "Demande archivée.",
          status: "ARCHIVED",
          created_at:
            "2026-09-03T10:00:00Z",
        },
      ]);

      deleteProspect
        .mockResolvedValue(undefined);

      vi.spyOn(
        window,
        "confirm"
      ).mockReturnValue(true);
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
      vi.clearAllMocks();
    });


    it(
      "permet à l admin de supprimer définitivement une demande archivée",
      async () => {
        render(<AdminPage />);

        await screen.findByRole(
          "button",
          {
            name: "Archivées (1)",
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Archivées (1)",
            }
          )
        );

        expect(
          screen.getByText(
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

        expect(
          window.confirm
        ).toHaveBeenCalled();

        await waitFor(() => {
          expect(
            deleteProspect
          ).toHaveBeenCalledWith(4);
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
              name: "Archivées (0)",
            }
          )
        ).toBeTruthy();
      }
    );
  }
);
