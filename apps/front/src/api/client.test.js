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

import { apiFetch } from "./client";


describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();

    vi.restoreAllMocks();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => (
          JSON.stringify({
            success: true,
          })
        ),
      })
    );
  });


  it(
    "conserve application/json pour une requête JSON",
    async () => {
      localStorage.setItem(
        "access_token",
        "token-test"
      );

      await apiFetch(
        "/api/test/",
        {
          method: "POST",
          body: JSON.stringify({
            name: "InnovEvents",
          }),
        }
      );

      expect(
        fetch
      ).toHaveBeenCalledTimes(1);

      const [
        url,
        options,
      ] = fetch.mock.calls[0];

      expect(
        url
      ).toContain(
        "/api/test/"
      );

      expect(
        options.headers.get(
          "Content-Type"
        )
      ).toBe(
        "application/json"
      );

      expect(
        options.headers.get(
          "Authorization"
        )
      ).toBe(
        "Bearer token-test"
      );
    }
  );


  it(
    "ne force pas Content-Type avec FormData",
    async () => {
      localStorage.setItem(
        "access_token",
        "token-upload"
      );

      const formData =
        new FormData();

      formData.append(
        "alt_text",
        "Photo événement InnovEvents"
      );

      formData.append(
        "image",
        new File(
          ["fake-image"],
          "photo.jpg",
          {
            type: "image/jpeg",
          }
        )
      );

      await apiFetch(
        "/api/home-photos/1/upload/",
        {
          method: "POST",
          body: formData,
        }
      );

      expect(
        fetch
      ).toHaveBeenCalledTimes(1);

      const [
        url,
        options,
      ] = fetch.mock.calls[0];

      expect(
        url
      ).toContain(
        "/api/home-photos/1/upload/"
      );

      expect(
        options.body
      ).toBe(
        formData
      );

      expect(
        options.headers.has(
          "Content-Type"
        )
      ).toBe(false);

      expect(
        options.headers.get(
          "Authorization"
        )
      ).toBe(
        "Bearer token-upload"
      );
    }
  );


  it(
    "affiche les erreurs de validation DRF par champ",
    async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => (
          JSON.stringify({
            password: [
              "Ce mot de passe est trop court.",
              "Il doit contenir au moins 8 caractères.",
            ],
          })
        ),
      });

      await expect(
        apiFetch(
          "/api/activate/",
          {
            method: "POST",
            body: JSON.stringify({
              password: "123",
            }),
          }
        )
      ).rejects.toThrow(
        "password : " +
        "Ce mot de passe est trop court. " +
        "Il doit contenir au moins 8 caractères."
      );
    }
  );
});