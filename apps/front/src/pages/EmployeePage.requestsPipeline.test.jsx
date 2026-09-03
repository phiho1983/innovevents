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
        username:
          "employee_test",

        role:
          "EMPLOYEE",
      },
    }),
  })
);


vi.mock(
  "../api/client",
  () => ({
    apiFetch:
      vi.fn(),
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


vi.mock(
  "../api/quotes",
  () => ({
    getQuotes:
      vi.fn()
        .mockResolvedValue({
          results: [],
        }),

    createQuote:
      vi.fn(),

    sendQuote:
      vi.fn(),
  })
);


const REQUESTS = [
  {
    id: 1,
    first_name: "Alice",
    last_name: "Nouveau",
    email: "alice@example.com",
    company: "Alice Events",
    event_type: "Séminaire",
    status: "TO_CONTACT",
    created_at:
      "2026-09-03T10:00:00Z",
  },
  {
    id: 2,
    first_name: "Bruno",
    last_name: "Contacte",
    email: "bruno@example.com",
    company: "Bruno Events",
    event_type: "Conférence",
    status: "CONTACTED",
    created_at:
      "2026-09-03T10:00:00Z",
  },
  {
    id: 3,
    first_name: "Claire",
    last_name: "Qualifiee",
    email: "claire@example.com",
    company: "Claire Events",
    event_type: "Soirée",
    status: "QUALIFIED",
    created_at:
      "2026-09-03T10:00:00Z",
  },
  {
    id: 4,
    first_name: "David",
    last_name: "Archive",
    email: "david@example.com",
    company: "David Events",
    event_type: "Anniversaire",
    status: "ARCHIVED",
    created_at:
      "2026-09-03T10:00:00Z",
  },
];


describe(
  "EmployeePage - pipeline Demandes",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects
        .mockResolvedValue({
          results: REQUESTS,
        });

      updateProspectStatus
        .mockImplementation(
          async (
            id,
            status
          ) => ({
            ...REQUESTS.find(
              request =>
                request.id === id
            ),
            status,
          })
        );
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    it(
      "affiche les sous-onglets avec leurs compteurs",
      async () => {
        render(
          <EmployeePage />
        );

        expect(
          await screen.findByRole(
            "button",
            {
              name:
                "À traiter (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Contactées (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Qualifiées (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Archivées (1)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "filtre les demandes selon le sous-onglet actif",
      async () => {
        render(
          <EmployeePage />
        );

        expect(
          await screen.findByText(
            "Alice Nouveau"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Bruno Contacte"
          )
        ).toBeNull();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Contactées (1)",
            }
          )
        );

        expect(
          await screen.findByText(
            "Bruno Contacte"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Alice Nouveau"
          )
        ).toBeNull();
      }
    );


    it(
      "deplace une demande vers Contactees après changement de statut",
      async () => {
        render(
          <EmployeePage />
        );

        await screen.findByText(
          "Alice Nouveau"
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Marquer contactée",
            }
          )
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

        expect(
          screen.queryByText(
            "Alice Nouveau"
          )
        ).toBeNull();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Contactées (2)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "permet de restaurer une demande archivée sans proposer de suppression définitive",
      async () => {
        render(
          <EmployeePage />
        );

        await screen.findByRole(
          "button",
          {
            name:
              "Archivées (1)",
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Archivées (1)",
            }
          )
        );

        expect(
          await screen.findByText(
            "David Archive"
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Restaurer",
            }
          )
        ).toBeTruthy();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Supprimer définitivement",
            }
          )
        ).toBeNull();
      }
    );
  }
);
