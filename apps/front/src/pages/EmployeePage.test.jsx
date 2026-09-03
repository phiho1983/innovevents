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

import EmployeePage
  from "./EmployeePage";

import {
  getProspects,
  updateProspectStatus,
} from "../api/prospects";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => (
      <div>Navbar</div>
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
  "../api/prospects",
  () => ({
    getProspects:
      vi.fn(),

    updateProspectStatus:
      vi.fn(),
  })
);


const REQUESTS = [
  {
    id: 1,

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
      "2026-08-29T10:00:00Z",
  },
];


describe(
  "EmployeePage - gestion des demandes",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects
        .mockResolvedValue({
          results:
            REQUESTS,
        });
    });


    afterEach(() => {
      cleanup();

      vi.restoreAllMocks();
    });


    it(
      "affiche les demandes accessibles a l employe",
      async () => {
        render(
          <EmployeePage />
        );


        expect(
          await screen.findByText(
            "Claire Martin"
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            "claire@test.local"
          )
        ).toBeTruthy();


        expect(
          screen.getByText(
            "Martin Events"
          )
        ).toBeTruthy();


        expect(
          screen.getByRole(
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
                /convertir.*client/i,
            }
          )
        ).toBeNull();
      }
    );


    it(
      "permet a l employe de changer le statut d une demande",
      async () => {
        updateProspectStatus
          .mockResolvedValue({
            status:
              "CONTACTED",
          });


        render(
          <EmployeePage />
        );


        const select =
          await screen.findByRole(
            "combobox"
          );


        fireEvent.change(
          select,
          {
            target: {
              value:
                "CONTACTED",
            },
          }
        );


        await waitFor(
          () => {
            expect(
              updateProspectStatus
            ).toHaveBeenCalledWith(
              1,
              "CONTACTED"
            );
          }
        );


        await waitFor(
          () => {
            expect(
              screen.getByRole(
                "combobox"
              ).value
            ).toBe(
              "CONTACTED"
            );
          }
        );
      }
    );
  }
);