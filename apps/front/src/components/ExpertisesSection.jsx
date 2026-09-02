import "./ExpertisesSection.css";


const expertises = [
  {
    number: "01",
    title: "Événements corporate",
    text:
      "Des formats professionnels pensés pour réunir, fédérer et faire vivre votre marque.",
  },
  {
    number: "02",
    title: "Séminaires & conventions",
    text:
      "Des expériences conçues pour favoriser les échanges, transmettre vos messages et renforcer vos équipes.",
  },
  {
    number: "03",
    title: "Team building",
    text:
      "Des moments collectifs imaginés pour créer du lien et faire vivre une expérience mémorable.",
  },
  {
    number: "04",
    title: "Lancements & soirées",
    text:
      "Des mises en scène fortes pour présenter un produit, célébrer une réussite ou marquer un temps fort.",
  },
];


export default function ExpertisesSection() {
  return (
    <section
      className="expertises"
      aria-labelledby="expertises-title"
    >
      <div className="expertisesIntro">
        <div>
          <p className="expertisesEyebrow">
            Nos expertises
          </p>

          <h2
            id="expertises-title"
            className="expertisesTitle"
          >
            De l&apos;idée
            <br />
            à l&apos;expérience.
          </h2>
        </div>

        <p className="expertisesIntroText">
          Nous imaginons des événements professionnels sur mesure,
          depuis les premières idées jusqu&apos;à leur réalisation.
        </p>
      </div>


      <div className="expertisesGrid">
        {expertises.map(
          (expertise) => (
            <article
              key={expertise.number}
              className="expertiseCard"
            >
              <span className="expertiseNumber">
                {expertise.number}
              </span>

              <div className="expertiseContent">
                <h3>
                  {expertise.title}
                </h3>

                <p>
                  {expertise.text}
                </p>
              </div>

              <span
                className="expertiseArrow"
                aria-hidden="true"
              >
                ↗
              </span>
            </article>
          )
        )}
      </div>
    </section>
  );
}