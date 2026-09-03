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
  getContactMessages,
  updateContactMessage,
} from "../api/contactMessages";


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
      vi.fn()
        .mockResolvedValue({
          results: [],
        }),

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


vi.mock(
  "../api/contactMessages",
  () => ({
    getContactMessages:
      vi.fn(),

    updateContactMessage:
      vi.fn(),
  })
);


const MESSAGES = [
  {
    id: 1,
    name: "Alice Nouveau",
    email: "alice@example.com",
    subject: "Question Alice",
    message: "Message nouveau.",
    status: "NEW",
  },
  {
    id: 2,
    name: "Bruno Lu",
    email: "bruno@example.com",
    subject: "Question Bruno",
    message: "Message lu.",
    status: "READ",
  },
  {
    id: 3,
    name: "Claire Repondu",
    email: "claire@example.com",
    subject: "Question Claire",
    message: "Message répondu.",
    status: "REPLIED",
  },
  {
    id: 4,
    name: "David Archive",
    email: "david@example.com",
    subject: "Question David",
    message: "Message archivé.",
    status: "ARCHIVED",
  },
];


describe(
  "EmployeePage - pipeline Messages",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getContactMessages
        .mockResolvedValue(
          MESSAGES
        );

      updateContactMessage
        .mockImplementation(
          async (
            id,
            payload
          ) => ({
            ...MESSAGES.find(
              message =>
                message.id === id
            ),
            ...payload,
          })
        );
    });


    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });


    async function openMessages() {
      render(
        <EmployeePage />
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Messages",
          }
        )
      );

      await screen.findByText(
        "Messages (4)"
      );
    }


    it(
      "affiche les sous-onglets avec leurs compteurs",
      async () => {
        await openMessages();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Nouveaux (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Lus (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Répondus (1)",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Archivés (1)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "filtre les messages selon le sous-onglet actif",
      async () => {
        await openMessages();

        expect(
          screen.getByText(
            "Alice Nouveau"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Bruno Lu"
          )
        ).toBeNull();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Lus (1)",
            }
          )
        );

        expect(
          await screen.findByText(
            "Bruno Lu"
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
      "deplace un message vers Lus apres lecture",
      async () => {
        await openMessages();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Marquer comme lu",
            }
          )
        );

        await waitFor(() => {
          expect(
            updateContactMessage
          ).toHaveBeenCalledWith(
            1,
            {
              status: "READ",
            }
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
              name:
                "Lus (2)",
            }
          )
        ).toBeTruthy();
      }
    );


    it(
      "restaure un message archive sans suppression definitive",
      async () => {
        await openMessages();

        fireEvent.click(
          screen.getByRole(
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
