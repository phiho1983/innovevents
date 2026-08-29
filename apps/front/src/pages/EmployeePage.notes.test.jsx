// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import EmployeePage from "./EmployeePage";

import {
  apiFetch,
} from "../api/client";

import {
  getProspects,
} from "../api/prospects";

import {
  getQuotes,
} from "../api/quotes";


vi.mock(
  "../components/Navbar",
  () => ({
    default: () => <div>Navbar</div>,
  })
);

vi.mock(
  "../auth/useAuth",
  () => ({
    useAuth: () => ({
      user: {
        username: "employee_test",
        role: "EMPLOYEE",
      },
    }),
  })
);

vi.mock(
  "../api/client",
  () => ({
    apiFetch: vi.fn(),
  })
);

vi.mock(
  "../api/prospects",
  () => ({
    getProspects: vi.fn(),
    updateProspectStatus: vi.fn(),
    convertProspect: vi.fn(),
  })
);

vi.mock(
  "../api/quotes",
  () => ({
    getQuotes: vi.fn(),
    createQuote: vi.fn(),
  })
);


const NOTES = [
  {
    id: 12,
    author: 2,
    client: 31,
    content:
      "Prévoir relance client lundi.",
    pinned: false,
    created_at:
      "2026-08-29T13:00:00Z",
  },
];


describe(
  "EmployeePage - notes collaboratives",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getProspects.mockResolvedValue({
        results: [],
      });

      getQuotes.mockResolvedValue({
        results: [],
      });

      apiFetch.mockImplementation(
        (
          path,
          options = {},
        ) => {
          if (
            path === "/api/notes/"
            && !options.method
          ) {
            return Promise.resolve({
              results: NOTES,
            });
          }

          if (
            path === "/api/notes/"
            && options.method === "POST"
          ) {
            return Promise.resolve({
              id: 20,
              author: 5,
              client: 31,
              content:
                "Appeler le client demain.",
              pinned: true,
              created_at:
                "2026-08-29T14:00:00Z",
            });
          }

          if (
            path === "/api/notes/12/"
            && options.method === "PATCH"
          ) {
            return Promise.resolve({
              ...NOTES[0],
              content:
                "Relance effectuée.",
              pinned: true,
            });
          }

          return Promise.reject(
            new Error(
              `Appel API inattendu : ${path}`
            )
          );
        }
      );
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    async function openNotesTab() {
      render(<EmployeePage />);

      const notesTab =
        await screen.findByRole(
          "button",
          {
            name: "Notes",
          }
        );

      fireEvent.click(
        notesTab
      );
    }


    it(
      "affiche les notes internes sans proposer de suppression",
      async () => {
        await openNotesTab();

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/notes/"
          );
        });

        const note =
          await screen.findByRole(
            "article",
            {
              name: "Note #12",
            }
          );

        expect(
          within(
            note
          ).getByText(
            "Prévoir relance client lundi."
          )
        ).toBeTruthy();

        expect(
          note.textContent
        ).toContain(
          "Client #31"
        );

        expect(
          within(
            note
          ).queryByRole(
            "button",
            {
              name: /supprimer/i,
            }
          )
        ).toBeNull();
      }
    );


    it(
      "permet a l employe de creer une note",
      async () => {
        await openNotesTab();

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name: /nouvelle note/i,
            }
          )
        );

        fireEvent.change(
          screen.getByLabelText(
            "Client ID"
          ),
          {
            target: {
              value: "31",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "Contenu"
          ),
          {
            target: {
              value:
                "Appeler le client demain.",
            },
          }
        );

        fireEvent.click(
          screen.getByLabelText(
            "Épingler la note"
          )
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Créer la note",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/notes/",
            {
              method: "POST",
              body: JSON.stringify({
                client: 31,
                content:
                  "Appeler le client demain.",
                pinned: true,
              }),
            }
          );
        });

        expect(
          await screen.findByText(
            "Appeler le client demain."
          )
        ).toBeTruthy();
      }
    );


    it(
      "permet a l employe de modifier une note existante",
      async () => {
        await openNotesTab();

        const note =
          await screen.findByRole(
            "article",
            {
              name: "Note #12",
            }
          );

        fireEvent.click(
          within(
            note
          ).getByRole(
            "button",
            {
              name: "Modifier",
            }
          )
        );

        fireEvent.change(
          within(
            note
          ).getByLabelText(
            "Contenu"
          ),
          {
            target: {
              value:
                "Relance effectuée.",
            },
          }
        );

        fireEvent.click(
          within(
            note
          ).getByLabelText(
            "Épingler la note"
          )
        );

        fireEvent.click(
          within(
            note
          ).getByRole(
            "button",
            {
              name: "Enregistrer",
            }
          )
        );

        await waitFor(() => {
          expect(
            apiFetch
          ).toHaveBeenCalledWith(
            "/api/notes/12/",
            {
              method: "PATCH",
              body: JSON.stringify({
                content:
                  "Relance effectuée.",
                pinned: true,
              }),
            }
          );
        });

        expect(
          await screen.findByText(
            "Relance effectuée."
          )
        ).toBeTruthy();
      }
    );
  }
);