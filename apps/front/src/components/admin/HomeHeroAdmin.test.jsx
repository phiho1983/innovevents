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

import {
  getHomeHero,
  uploadHomeHero,
} from "../../api/homeHero";

import HomeHeroAdmin from "./HomeHeroAdmin";


vi.mock(
  "../../api/homeHero",
  () => ({
    getHomeHero: vi.fn(),
    uploadHomeHero: vi.fn(),
  })
);


describe(
  "HomeHeroAdmin",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      getHomeHero.mockResolvedValue({
        id: 1,
        image_url:
          "http://localhost:8000/"
          + "media/home/hero/hero.jpg",
        alt_text:
          "Hero actuel",
        updated_at:
          "2026-09-01T12:00:00Z",
      });
    });


    afterEach(() => {
      cleanup();

      vi.unstubAllGlobals();
    });


    it(
      "charge et affiche le Hero actuel",
      async () => {
        render(
          <HomeHeroAdmin />
        );

        expect(
          screen.getByText(
            /chargement/i
          )
        ).toBeTruthy();

        expect(
          await screen.findByRole(
            "heading",
            {
              name:
                /image principale/i,
            }
          )
        ).toBeTruthy();

        expect(
          getHomeHero
        ).toHaveBeenCalledTimes(
          1
        );

        const image =
          screen.getByRole(
            "img",
            {
              name:
                "Hero actuel",
            }
          );

        expect(
          image.getAttribute(
            "src"
          )
        ).toBe(
          "http://localhost:8000/"
          + "media/home/hero/hero.jpg"
        );

        expect(
          screen.getByLabelText(
            "Texte alternatif du Hero"
          ).value
        ).toBe(
          "Hero actuel"
        );
      }
    );


    it(
      "permet de remplacer le Hero avec son alt text",
      async () => {
        const updatedHero = {
          id: 1,
          image_url:
            "http://localhost:8000/"
            + "media/home/hero/"
            + "hero-new.jpg",
          alt_text:
            "Nouveau Hero",
          updated_at:
            "2026-09-01T12:30:00Z",
        };

        uploadHomeHero.mockResolvedValue(
          updatedHero
        );

        render(
          <HomeHeroAdmin />
        );

        await screen.findByRole(
          "heading",
          {
            name:
              /image principale/i,
          }
        );

        const fileInput =
          screen.getByLabelText(
            "Image principale du Hero"
          );

        const altInput =
          screen.getByLabelText(
            "Texte alternatif du Hero"
          );

        const imageFile =
          new File(
            [
              "fake-image-content",
            ],
            "hero-new.jpg",
            {
              type:
                "image/jpeg",
            }
          );

        fireEvent.change(
          fileInput,
          {
            target: {
              files: [
                imageFile,
              ],
            },
          }
        );

        fireEvent.change(
          altInput,
          {
            target: {
              value:
                "Nouveau Hero",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enregistrer le Hero",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              uploadHomeHero
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          uploadHomeHero
        ).toHaveBeenCalledWith({
          image:
            imageFile,
          altText:
            "Nouveau Hero",
        });

        await waitFor(
          () => {
            expect(
              altInput.value
            ).toBe(
              "Nouveau Hero"
            );
          }
        );

        expect(
          screen.getByText(
            /mis à jour avec succès/i
          )
        ).toBeTruthy();
      }
    );


    it(
      "refuse l enregistrement sans nouvelle image",
      async () => {
        render(
          <HomeHeroAdmin />
        );

        await screen.findByRole(
          "heading",
          {
            name:
              /image principale/i,
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enregistrer le Hero",
            }
          )
        );

        expect(
          uploadHomeHero
        ).not.toHaveBeenCalled();

        expect(
          screen.getByRole(
            "alert"
          ).textContent
        ).toMatch(
          /sélectionnez une image/i
        );
      }
    );
  }
);