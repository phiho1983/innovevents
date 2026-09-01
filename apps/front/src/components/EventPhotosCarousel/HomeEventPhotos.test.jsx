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
  getHomePhotos,
} from "../../api/homePhotos";

import HomeEventPhotos from "./HomeEventPhotos";


vi.mock(
  "../../api/homePhotos",
  () => ({
    getHomePhotos: vi.fn(),
  })
);


vi.mock(
  "./EventPhotosCarousel",
  () => ({
    default: ({
      photos,
      speed,
    }) => (
      <div data-testid="carousel">
        <span data-testid="speed">
          {speed}
        </span>

        <span data-testid="count">
          {photos.length}
        </span>

        {photos.map(
          (photo) => (
            <div
              key={photo.id}
              data-testid={
                `photo-${photo.id}`
              }
            >
              <span>
                {photo.url || "placeholder"}
              </span>

              <span>
                {photo.title}
              </span>

              <span>
                {photo.placeholder}
              </span>
            </div>
          )
        )}
      </div>
    ),
  })
);


function makePhotos() {
  return Array.from(
    {
      length: 12,
    },
    (_, index) => ({
      id: index + 1,
      slot: index + 1,

      image_url:
        index === 0
          ? (
              "http://localhost:8000/"
              + "media/home/carousel/photo-1.jpg"
            )
          : "",

      cloudinary_public_id: "",

      alt_text:
        index === 0
          ? "Séminaire professionnel"
          : "",

      updated_at:
        "2026-08-31T19:00:00Z",
    })
  );
}


describe(
  "HomeEventPhotos",
  () => {
    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    it(
      "charge les photos administrées et les transmet au carrousel",
      async () => {
        getHomePhotos.mockResolvedValue(
          makePhotos()
        );

        render(
          <HomeEventPhotos />
        );

        await waitFor(
          () => {
            expect(
              getHomePhotos
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          screen.getByTestId(
            "count"
          ).textContent
        ).toBe(
          "12"
        );

        expect(
          screen.getByTestId(
            "speed"
          ).textContent
        ).toBe(
          "18"
        );

        const firstPhoto =
          screen.getByTestId(
            "photo-1"
          );

        expect(
          firstPhoto.textContent
        ).toContain(
          "http://localhost:8000/media/home/carousel/photo-1.jpg"
        );

        expect(
          firstPhoto.textContent
        ).toContain(
          "Séminaire professionnel"
        );

        const secondPhoto =
          screen.getByTestId(
            "photo-2"
          );

        expect(
          secondPhoto.textContent
        ).toContain(
          "placeholder"
        );
      }
    );


    it(
      "conserve les 12 placeholders si l API échoue",
      async () => {
        getHomePhotos.mockRejectedValue(
          new Error(
            "API indisponible"
          )
        );

        render(
          <HomeEventPhotos />
        );

        await waitFor(
          () => {
            expect(
              getHomePhotos
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          screen.getByTestId(
            "count"
          ).textContent
        ).toBe(
          "12"
        );

        expect(
          screen.getByTestId(
            "photo-1"
          ).textContent
        ).toContain(
          "placeholder"
        );

        expect(
          screen.getByTestId(
            "photo-12"
          ).textContent
        ).toContain(
          "placeholder"
        );
      }
    );
  }
);