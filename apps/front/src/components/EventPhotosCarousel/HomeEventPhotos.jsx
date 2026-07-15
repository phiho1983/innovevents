import EventPhotosCarousel from "./EventPhotosCarousel";

export default function HomeEventPhotos() {
  const photos = [
    { id: 1, url: null, title: "Event - 01", placeholder: "p1" },
    { id: 2, url: null, title: "Event - 02", placeholder: "p2" },
    { id: 3, url: null, title: "Event - 03", placeholder: "p3" },
    { id: 4, url: null, title: "Event - 04", placeholder: "p4" },
    { id: 5, url: null, title: "Event - 05", placeholder: "p5" },
    { id: 6, url: null, title: "Event - 06", placeholder: "p6" },
    { id: 7, url: null, title: "Event - 07", placeholder: "p1" },
    { id: 8, url: null, title: "Event - 08", placeholder: "p2" },
    { id: 9, url: null, title: "Event - 09", placeholder: "p3" },
    { id: 10, url: null, title: "Event - 10", placeholder: "p4" },
    { id: 11, url: null, title: "Event - 11", placeholder: "p5" },
    { id: 12, url: null, title: "Event - 12", placeholder: "p6" },
  ];

  return (
    <section style={{ padding: "0 16px" }}>
      <h2 style={{ margin: "16px 0" }}>Photos d’évènements</h2>
      <EventPhotosCarousel photos={photos} speed={18} />
    </section>
  );
}
