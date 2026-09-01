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
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  getHomeHero,
} from "../api/homeHero";

import Hero from "./Hero";


vi.mock(
  "../api/homeHero",
  () => ({
    getHomeHero:
      vi.fn(),
  })
);


vi.mock(
  "react-router-dom",
  () => ({
    Link: ({
      children,
      to,
      className,
    }) => (
      <a
        href={to}
        className={className}
      >
        {children}
      </a>
    ),
  })
);


describe(
  "Hero",
  () => {
    afterEach(() => {
      cleanup();

      vi.clearAllMocks();
    });


    it(
      "charge et affiche l image Hero administrée",
      async () => {
        getHomeHero.mockResolvedValue({
          id: 1,

          image_url:
            "http://localhost:8000/"
            + "media/home/hero/"
            + "hero-public.jpg",

          alt_text:
            "Équipe en séminaire",

          updated_at:
            "2026-09-01T14:00:00Z",
        });

        render(
          <Hero />
        );

        await waitFor(
          () => {
            expect(
              getHomeHero
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        const image =
          await screen.findByRole(
            "img",
            {
              name:
                "Équipe en séminaire",
            }
          );

        expect(
          image.getAttribute(
            "src"
          )
        ).toBe(
          "http://localhost:8000/"
          + "media/home/hero/"
          + "hero-public.jpg"
        );

        expect(
          screen.queryByLabelText(
            "Visuel à venir"
          )
        ).toBeNull();
      }
    );


    it(
      "conserve le placeholder si l API Hero échoue",
      async () => {
        getHomeHero.mockRejectedValue(
          new Error(
            "API indisponible"
          )
        );

        render(
          <Hero />
        );

        await waitFor(
          () => {
            expect(
              getHomeHero
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          screen.getByLabelText(
            "Visuel à venir"
          )
        ).toBeTruthy();

        expect(
          screen.queryByRole(
            "img"
          )
        ).toBeNull();
      }
    );


    it(
      "conserve le placeholder si aucune image Hero n est définie",
      async () => {
        getHomeHero.mockResolvedValue({
          id: null,
          image_url: "",
          alt_text: "",
          updated_at: null,
        });

        render(
          <Hero />
        );

        await waitFor(
          () => {
            expect(
              getHomeHero
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          screen.getByLabelText(
            "Visuel à venir"
          )
        ).toBeTruthy();

        expect(
          screen.queryByRole(
            "img"
          )
        ).toBeNull();
      }
    );
  }
);