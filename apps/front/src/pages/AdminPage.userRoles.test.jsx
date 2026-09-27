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
  within,
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
  "../components/admin/HomeHeroAdmin",
  () => ({
    default: () => (
      <div>
        HERO ADMIN
      </div>
    ),
  })
);


vi.mock(
  "../components/admin/HomePhotosAdminTab",
  () => ({
    default: () => (
      <div>
        HOME PHOTOS ADMIN
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
        username: "admin_test",
        role: "ADMIN",
        is_superuser: false,
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

    deleteQuote:
      vi.fn(),

    downloadQuotePdf:
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


function jsonResponse(
  data,
  status = 200
) {
  return {
    ok:
      status >= 200
      && status < 300,

    status,

    json: async () => data,
  };
}


describe(
  "AdminPage - gestion des rôles utilisateurs",
  () => {
    beforeEach(() => {
      localStorage.clear();

      localStorage.setItem(
        "access_token",
        "admin-token-test"
      );

      vi.spyOn(
        window,
        "confirm"
      ).mockReturnValue(true);
    });


    afterEach(() => {
      cleanup();

      vi.restoreAllMocks();

      vi.unstubAllGlobals();
    });


    it(
      "permet de transformer un client en employe",
      async () => {
        const clientUser = {
          id: 2,
          username:
            "client_test",
          email:
            "client@test.local",
          first_name: "",
          last_name: "",
          role: "CLIENT",
          is_staff: false,
          is_superuser: false,
        };

        const employeeUser = {
          id: 3,
          username:
            "employee_test",
          email:
            "employee@test.local",
          first_name: "",
          last_name: "",
          role: "EMPLOYEE",
          is_staff: false,
          is_superuser: false,
        };

        const promotedUser = {
          ...clientUser,
          role: "EMPLOYEE",
        };

        const fetchMock =
          vi.fn();

        fetchMock
          .mockResolvedValueOnce(
            jsonResponse([
              clientUser,
              employeeUser,
            ])
          )
          .mockResolvedValueOnce(
            jsonResponse(
              promotedUser
            )
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        render(
          <AdminPage />
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Utilisateurs",
            }
          )
        );

        const clientName =
          await screen.findByText(
            "client_test"
          );

        const clientRow =
          clientName.closest(
            "tr"
          );

        expect(
          clientRow
        ).toBeTruthy();

        expect(
          within(
            clientRow
          ).getByRole(
            "button",
            {
              name:
                "Passer employé",
            }
          )
        ).toBeTruthy();

        const employeeName =
          screen.getByText(
            "employee_test"
          );

        const employeeRow =
          employeeName.closest(
            "tr"
          );

        expect(
          within(
            employeeRow
          ).getByRole(
            "button",
            {
              name:
                "Repasser client",
            }
          )
        ).toBeTruthy();

        fireEvent.click(
          within(
            clientRow
          ).getByRole(
            "button",
            {
              name:
                "Passer employé",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              fetchMock
            ).toHaveBeenCalledTimes(
              2
            );
          }
        );

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[1];

        expect(
          url
        ).toContain(
          "/api/users-rights/2/promote-employee/"
        );

        expect(
          options.method
        ).toBe(
          "PATCH"
        );

        await waitFor(
          () => {
            expect(
              screen.getAllByRole(
                "button",
                {
                  name:
                    "Repasser client",
                }
              ).length
            ).toBe(
              2
            );
          }
        );
      }
    );
  }
);