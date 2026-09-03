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
  updateProspectStatus,
} from "../api/prospects";


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
    getProspects: vi.fn(),
    updateProspectStatus: vi.fn(),
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
    default: () => (
      <div>HOME PHOTOS</div>
    ),
  })
);


const requests = [
  {
    id: 1,
    first_name: "Alice",
    last_name: "Nouveau",
    email: "alice@example.com",
    phone: "",
    company: "",
    city: "",
    event_type: "Mariage",
    desired_date: "2026-10-10",
    participant_count: 50,
    message: "Demande à traiter.",
    status: "TO_CONTACT",
    created_at: "2026-09-03T10:00:00Z",
  },

  {
    id: 2,
    first_name: "Bruno",
    last_name: "Contacte",
    email: "bruno@example.com",
    phone: "",
    company: "",
    city: "",
    event_type: "Séminaire",
    desired_date: "2026-11-10",
    participant_count: 80,
    message: "Demande déjà contactée.",
    status: "CONTACTED",
    created_at: "2026-09-03T10:00:00Z",
  },

  {
    id: 3,
    first_name: "Claire",
    last_name: "Qualifiee",
    email: "claire@example.com",
    phone: "",
    company: "",
    city: "",
    event_type: "Conférence",
    desired_date: "2026-12-10",
    participant_count: 120,
    message: "Demande qualifiée.",
    status: "QUALIFIED",
    created_at: "2026-09-03T10:00:00Z",
  },

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
    created_at: "2026-09-03T10:00:00Z",
  },
];


describe(
  "AdminPage - pipeline Demandes",
  () => {
    beforeEach(() => {
      getProspects.mockResolvedValue(
        requests
      );

      updateProspectStatus
        .mockImplementation(
          async (id, status) => ({
            ...requests.find(
              request =>
                request.id === id
            ),
            status,
          })
        );
    });


    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "affiche les sous-onglets avec leurs compteurs",
      async () => {
        render(<AdminPage />);

        expect(
          await screen.findByRole(
            "button",
            {
              name: "À traiter (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name: "Contactées (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name: "Qualifiées (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name: "Archivées (1)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "filtre les demandes selon le sous-onglet actif",
      async () => {
        render(<AdminPage />);

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
              name: "Contactées (1)",
            }
          )
        );

        expect(
          screen.getByText(
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
      "deplace une demande vers Contactees apres changement de statut",
      async () => {
        render(<AdminPage />);

        expect(
          await screen.findByText(
            "Alice Nouveau"
          )
        ).toBeTruthy();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Marquer contactée",
            }
          )
        );

        await waitFor(() => {
          expect(
            updateProspectStatus
          ).toHaveBeenCalledWith(
            1,
            "CONTACTED"
          );
        });

        expect(
          screen.queryByText(
            "Alice Nouveau"
          )
        ).toBeNull();

        expect(
          screen.getByRole(
            "button",
            {
              name: "Contactées (2)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "affiche Restaurer dans les demandes archivees",
      async () => {
        render(<AdminPage />);

        await screen.findByText(
          "Alice Nouveau"
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

        expect(
          screen.getByRole(
            "button",
            {
              name: "Restaurer",
            }
          )
        ).toBeTruthy();
      }
    );
  }
);
