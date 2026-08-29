import {
  describe,
  expect,
  it,
} from "vitest";

import {
  selectUpcomingClientEvents,
} from "./selectUpcomingClientEvents.js";


describe(
  "selectUpcomingClientEvents",
  () => {
    it(
      "selectionne uniquement les 3 prochains evenements prives ACCEPTED",
      () => {
        const now = new Date(
          "2026-08-27T10:00:00Z"
        );

        const events = [
          {
            id: 1,
            title: "Terminé",
            status: "DONE",
            start_at:
              "2026-08-20T10:00:00Z",
          },
          {
            id: 2,
            title: "Accepté passé",
            status: "ACCEPTED",
            start_at:
              "2026-08-25T10:00:00Z",
          },
          {
            id: 3,
            title: "Brouillon futur",
            status: "DRAFT",
            start_at:
              "2026-08-28T10:00:00Z",
          },
          {
            id: 4,
            title: "Accepté troisième",
            status: "ACCEPTED",
            start_at:
              "2026-09-15T10:00:00Z",
          },
          {
            id: 5,
            title: "Accepté premier",
            status: "ACCEPTED",
            start_at:
              "2026-08-30T10:00:00Z",
          },
          {
            id: 6,
            title: "En cours",
            status: "IN_PROGRESS",
            start_at:
              "2026-08-27T08:00:00Z",
          },
          {
            id: 7,
            title: "Accepté quatrième",
            status: "ACCEPTED",
            start_at:
              "2026-10-01T10:00:00Z",
          },
          {
            id: 8,
            title: "Accepté deuxième",
            status: "ACCEPTED",
            start_at:
              "2026-09-05T10:00:00Z",
          },
          {
            id: 9,
            title: "Annulé",
            status: "CANCELLED",
            start_at:
              "2026-09-01T10:00:00Z",
          },
        ];

        const result =
          selectUpcomingClientEvents(
            events,
            now
          );

        expect(
          result.map(
            (event) => event.id
          )
        ).toEqual([
          5,
          8,
          4,
        ]);
      }
    );
  }
);