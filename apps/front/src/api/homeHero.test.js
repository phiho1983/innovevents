/**
 * @vitest-environment jsdom
 */

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  apiFetch,
} from "./client";

import {
  getHomeHero,
  uploadHomeHero,
} from "./homeHero";


vi.mock(
  "./client",
  () => ({
    apiFetch: vi.fn(),
  })
);


describe(
  "homeHero API",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });


    it(
      "charge le Hero public depuis l API",
      async () => {
        const hero = {
          id: 1,
          image_url:
            "http://localhost:8000/"
            + "media/home/hero/hero.jpg",
          alt_text:
            "Événement professionnel",
          updated_at:
            "2026-09-01T12:00:00Z",
        };

        apiFetch.mockResolvedValue(
          hero
        );

        const result =
          await getHomeHero();

        expect(
          apiFetch
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          apiFetch
        ).toHaveBeenCalledWith(
          "/api/home-hero/"
        );

        expect(
          result
        ).toEqual(
          hero
        );
      }
    );


    it(
      "envoie une nouvelle image Hero avec son alt text",
      async () => {
        const image =
          new File(
            [
              "fake-image-content",
            ],
            "hero.jpg",
            {
              type:
                "image/jpeg",
            }
          );

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

        apiFetch.mockResolvedValue(
          updatedHero
        );

        const result =
          await uploadHomeHero({
            image,
            altText:
              "Nouveau Hero",
          });

        expect(
          apiFetch
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          url,
          options,
        ] = apiFetch.mock.calls[0];

        expect(
          url
        ).toBe(
          "/api/home-hero/upload/"
        );

        expect(
          options.method
        ).toBe(
          "POST"
        );

        expect(
          options.body
        ).toBeInstanceOf(
          FormData
        );

        expect(
          options.body.get(
            "image"
          )
        ).toBe(
          image
        );

        expect(
          options.body.get(
            "alt_text"
          )
        ).toBe(
          "Nouveau Hero"
        );

        expect(
          result
        ).toEqual(
          updatedHero
        );
      }
    );
  }
);