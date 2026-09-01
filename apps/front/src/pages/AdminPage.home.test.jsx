/**
 * @vitest-environment jsdom
 */

import {
  afterEach,
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
} from "@testing-library/react";

import AdminPage from "./AdminPage";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div data-testid="navbar">
        Navbar
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
    getProspects:
      vi.fn().mockResolvedValue([]),

    updateProspectStatus:
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
  })
);


vi.mock(
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => (
      <div>
        HERO HOME ADMIN
      </div>
    ),
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => (
      <div>
        MINI CMS HOME ADMIN
      </div>
    ),
  })
);


describe(
  "AdminPage - onglet Accueil",
  () => {
    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "affiche le Hero et le mini-CMS lorsque l admin ouvre Accueil",
      () => {
        render(
          <AdminPage />
        );

        expect(
          screen.queryByText(
            "HERO HOME ADMIN"
          )
        ).toBeNull();

        expect(
          screen.queryByText(
            "MINI CMS HOME ADMIN"
          )
        ).toBeNull();

        const homeTab =
          screen.getByRole(
            "button",
            {
              name: "Accueil",
            }
          );

        fireEvent.click(
          homeTab
        );

        expect(
          screen.getByText(
            "HERO HOME ADMIN"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "MINI CMS HOME ADMIN"
          )
        ).toBeTruthy();
      }
    );
  }
);