// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  downloadQuotePdf,
} from "./quotes";


describe("downloadQuotePdf", () => {
  let clickSpy;

  beforeEach(() => {
    localStorage.setItem(
      "access_token",
      "pdf-test-token"
    );

    vi.stubGlobal(
      "fetch",
      vi.fn()
    );

    Object.defineProperty(
      URL,
      "createObjectURL",
      {
        configurable: true,
        value: vi.fn(
          () => "blob:quote-test"
        ),
      }
    );

    Object.defineProperty(
      URL,
      "revokeObjectURL",
      {
        configurable: true,
        value: vi.fn(),
      }
    );

    clickSpy = vi
      .spyOn(
        HTMLAnchorElement.prototype,
        "click"
      )
      .mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("telecharge le PDF avec le JWT", async () => {
    const blob = new Blob(
      ["fake-pdf"],
      {
        type: "application/pdf",
      }
    );

    fetch.mockResolvedValue({
      ok: true,
      blob: vi.fn()
        .mockResolvedValue(blob),
    });

    await downloadQuotePdf(
      42,
      "42-100926"
    );

    expect(fetch)
      .toHaveBeenCalledWith(
        "http://localhost:8000/api/quotes/42/pdf/",
        {
          headers: {
            Authorization:
              "Bearer pdf-test-token",
          },
        }
      );

    expect(
      URL.createObjectURL
    ).toHaveBeenCalledWith(
      blob
    );

    expect(
      clickSpy
    ).toHaveBeenCalled();

    expect(
      URL.revokeObjectURL
    ).toHaveBeenCalledWith(
      "blob:quote-test"
    );
  });
});