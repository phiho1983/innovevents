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


function jsonResponse(
  status,
  data
) {
  return {
    ok:
      status >= 200 &&
      status < 300,

    status,

    text: async () =>
      data === null
        ? ""
        : JSON.stringify(
            data
          ),
  };
}


describe(
  "sécurité session web",
  () => {
    beforeEach(() => {
      localStorage.clear();

      vi.restoreAllMocks();
    });


    it(
      "renouvelle l access token après un 401 puis rejoue la requête",
      async () => {
        localStorage.setItem(
          "access_token",
          "old-access"
        );

        localStorage.setItem(
          "refresh_token",
          "valid-refresh"
        );

        vi.stubGlobal(
          "fetch",
          vi.fn()
            .mockResolvedValueOnce(
              jsonResponse(
                401,
                {
                  detail:
                    "Token expiré",
                }
              )
            )
            .mockResolvedValueOnce(
              jsonResponse(
                200,
                {
                  access:
                    "new-access",
                }
              )
            )
            .mockResolvedValueOnce(
              jsonResponse(
                200,
                {
                  success: true,
                }
              )
            )
        );

        const data =
          await apiFetch(
            "/api/protected/"
          );

        expect(
          data
        ).toEqual({
          success: true,
        });

        expect(
          fetch
        ).toHaveBeenCalledTimes(
          3
        );

        expect(
          fetch.mock.calls[1][0]
        ).toContain(
          "/api/token/refresh/"
        );

        const retryOptions =
          fetch.mock.calls[2][1];

        expect(
          retryOptions.headers.get(
            "Authorization"
          )
        ).toBe(
          "Bearer new-access"
        );

        expect(
          localStorage.getItem(
            "access_token"
          )
        ).toBe(
          "new-access"
        );
      }
    );


    it(
      "révoque le refresh token au logout puis vide les tokens locaux",
      async () => {
        localStorage.setItem(
          "access_token",
          "access-logout"
        );

        localStorage.setItem(
          "refresh_token",
          "refresh-logout"
        );

        vi.stubGlobal(
          "fetch",
          vi.fn()
            .mockResolvedValue(
              jsonResponse(
                204,
                null
              )
            )
        );

        const authModule =
          await import(
            "./auth"
          );

        expect(
          typeof authModule.logout
        ).toBe(
          "function"
        );

        await authModule.logout();

        expect(
          fetch
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          url,
          options,
        ] =
          fetch.mock.calls[0];

        expect(
          url
        ).toContain(
          "/api/logout/"
        );

        expect(
          options.method
        ).toBe(
          "POST"
        );

        expect(
          JSON.parse(
            options.body
          )
        ).toEqual({
          refresh:
            "refresh-logout",
        });

        expect(
          options.headers.get(
            "Authorization"
          )
        ).toBe(
          "Bearer access-logout"
        );

        expect(
          localStorage.getItem(
            "access_token"
          )
        ).toBeNull();

        expect(
          localStorage.getItem(
            "refresh_token"
          )
        ).toBeNull();
      }
    );
  }
);