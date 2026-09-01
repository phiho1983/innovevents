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

import HomePhotosAdminTab from "./HomePhotosAdminTab";


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
        `Photo accueil ${index + 1}`,
      updated_at:
        "2026-08-31T19:00:00Z",
    })
  );
}


function jsonResponse(
  data,
  status = 200
) {
  return {
    ok:
      status >= 200
      && status < 300,

    status,

    text: async () =>
      JSON.stringify(data),
  };
}


describe(
  "HomePhotosAdminTab",
  () => {
    beforeEach(() => {
      localStorage.clear();

      localStorage.setItem(
        "access_token",
        "admin-token-test"
      );

      vi.restoreAllMocks();
    });


    afterEach(() => {
      cleanup();

      vi.unstubAllGlobals();
    });


    it(
      "charge et affiche les 12 emplacements Home",
      async () => {
        const photos =
          makePhotos();

        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue(
            jsonResponse(
              photos
            )
          )
        );

        render(
          <HomePhotosAdminTab />
        );

        expect(
          screen.getByText(
            /chargement/i
          )
        ).toBeTruthy();

        expect(
          await screen.findByText(
            "Emplacement 1"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Emplacement 12"
          )
        ).toBeTruthy();

        expect(
          screen.getAllByRole(
            "button",
            {
              name:
                /enregistrer/i,
            }
          )
        ).toHaveLength(
          12
        );

        expect(
          fetch
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          url,
          options,
        ] = fetch.mock.calls[0];

        expect(
          url
        ).toContain(
          "/api/home-photos/"
        );

        expect(
          options.headers.get(
            "Authorization"
          )
        ).toBe(
          "Bearer admin-token-test"
        );
      }
    );


    it(
      "permet de remplacer une photo avec son alt text",
      async () => {
        const photos =
          makePhotos();

        const updatedPhoto = {
          ...photos[0],

          image_url:
            "http://localhost:8000/"
            + "media/home/carousel/"
            + "nouvelle-photo.jpg",

          alt_text:
            "Nouvelle photo séminaire",
        };

        const fetchMock =
          vi.fn();

        fetchMock
          .mockResolvedValueOnce(
            jsonResponse(
              photos
            )
          )
          .mockResolvedValueOnce(
            jsonResponse(
              updatedPhoto
            )
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        render(
          <HomePhotosAdminTab />
        );

        await screen.findByText(
          "Emplacement 1"
        );

        const fileInput =
          screen.getByLabelText(
            "Image du slot 1"
          );

        const altInput =
          screen.getByLabelText(
            "Texte alternatif du slot 1"
          );

        const imageFile =
          new File(
            [
              "fake-image-content",
            ],
            "nouvelle-photo.jpg",
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
                "Nouvelle photo séminaire",
            },
          }
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enregistrer le slot 1",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              fetchMock
            ).toHaveBeenCalledTimes(
              2
            );
          }
        );

        const [
          uploadUrl,
          uploadOptions,
        ] = fetchMock.mock.calls[1];

        expect(
          uploadUrl
        ).toContain(
          "/api/home-photos/1/upload/"
        );

        expect(
          uploadOptions.method
        ).toBe(
          "POST"
        );

        expect(
          uploadOptions.body
        ).toBeInstanceOf(
          FormData
        );

        expect(
          uploadOptions.body.get(
            "alt_text"
          )
        ).toBe(
          "Nouvelle photo séminaire"
        );

        expect(
          uploadOptions.body.get(
            "image"
          )
        ).toBe(
          imageFile
        );

        expect(
          uploadOptions.headers.has(
            "Content-Type"
          )
        ).toBe(false);

        expect(
          uploadOptions.headers.get(
            "Authorization"
          )
        ).toBe(
          "Bearer admin-token-test"
        );

        await waitFor(
          () => {
            expect(
              altInput.value
            ).toBe(
              "Nouvelle photo séminaire"
            );
          }
        );
      }
    );
  }
);