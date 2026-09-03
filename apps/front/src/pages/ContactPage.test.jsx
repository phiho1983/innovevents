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
  waitFor,
} from "@testing-library/react";

import ContactPage from "./ContactPage";

import {
  createContactMessage,
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
  "../components/Footer/Footer",
  () => ({
    default: () => (
      <div>
        FOOTER
      </div>
    ),
  })
);


vi.mock(
  "../auth/useAuth",
  () => ({
    useAuth: () => ({
      user: null,
    }),
  })
);


vi.mock(
  "../api/contactMessages",
  () => ({
    createContactMessage:
      vi.fn(),
  })
);


describe(
  "ContactPage",
  () => {
    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "envoie un vrai message vers l API",
      async () => {
        createContactMessage
          .mockResolvedValue({
            id: 1,
            status: "NEW",
          });


        render(
          <ContactPage />
        );


        fireEvent.change(
          screen.getByLabelText(
            "Nom"
          ),
          {
            target: {
              value:
                "Jean Dupont",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "E-mail"
          ),
          {
            target: {
              value:
                "jean@example.com",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Objet"
          ),
          {
            target: {
              value:
                "Question générale",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Message"
          ),
          {
            target: {
              value:
                "Bonjour, je souhaite "
                + "avoir un renseignement.",
            },
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /envoyer mon message/i,
            }
          )
        );


        await waitFor(
          () => {
            expect(
              createContactMessage
            ).toHaveBeenCalledWith({
              name:
                "Jean Dupont",
              email:
                "jean@example.com",
              subject:
                "Question générale",
              message:
                "Bonjour, je souhaite "
                + "avoir un renseignement.",
            });
          }
        );


        expect(
          await screen.findByText(
            /merci pour votre message/i
          )
        ).toBeTruthy();
      }
    );


    it(
      "n affiche pas un faux succès si l API échoue",
      async () => {
        createContactMessage
          .mockRejectedValue({
            subject: [
              "Ce champ est invalide.",
            ],
          });


        render(
          <ContactPage />
        );


        fireEvent.change(
          screen.getByLabelText(
            "Nom"
          ),
          {
            target: {
              value: "Jean",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "E-mail"
          ),
          {
            target: {
              value:
                "jean@example.com",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Objet"
          ),
          {
            target: {
              value: "Test",
            },
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Message"
          ),
          {
            target: {
              value:
                "Message de test",
            },
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /envoyer mon message/i,
            }
          )
        );


        expect(
          await screen.findByRole(
            "alert"
          )
        ).toBeTruthy();


        expect(
          screen.queryByText(
            /merci pour votre message/i
          )
        ).toBeNull();
      }
    );
  }
);