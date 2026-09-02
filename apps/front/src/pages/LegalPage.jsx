import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";

import "./LegalPage.css";


export default function LegalPage() {
  return (
    <>
      <Navbar />


      <main className="legalPage">
        <div className="container legalLayout">
          <header className="legalHeader">
            <p className="legalEyebrow">
              Informations juridiques
            </p>

            <h1>
              Mentions légales
            </h1>

            <p>
              Cette page recense les informations
              qui devront être validées et complétées
              par l&apos;éditeur avant la mise en
              production publique.
            </p>
          </header>


          <aside
            className="legalNotice"
            aria-label="État des informations légales"
          >
            <strong>
              Document à compléter
            </strong>

            <p>
              Aucune donnée juridique non vérifiée
              n&apos;est présentée comme définitive.
            </p>
          </aside>


          <section
            className="legalContent"
            aria-label="Informations légales à compléter"
          >
            <LegalSection
              number="01"
              title="Éditeur du site"
            >
              À compléter avant publication :
              dénomination sociale, forme juridique,
              capital social, adresse du siège,
              numéro d&apos;immatriculation et numéro
              de TVA intracommunautaire.
            </LegalSection>


            <LegalSection
              number="02"
              title="Direction de la publication"
            >
              Le nom et la qualité du responsable
              de publication doivent être renseignés
              après validation par l&apos;entreprise.
            </LegalSection>


            <LegalSection
              number="03"
              title="Hébergement"
            >
              Les coordonnées légales exactes de
              l&apos;hébergeur de production doivent
              être ajoutées une fois le prestataire
              définitivement confirmé.
            </LegalSection>


            <LegalSection
              number="04"
              title="Propriété intellectuelle et données personnelles"
            >
              Les dispositions applicables aux contenus,
              aux données personnelles et aux droits
              des utilisateurs doivent être finalisées
              avant publication.
            </LegalSection>
          </section>
        </div>
      </main>


      <Footer />
    </>
  );
}


function LegalSection({
  number,
  title,
  children,
}) {
  return (
    <article className="legalSection">
      <p className="legalNumber">
        {number}
      </p>

      <div>
        <h2>
          {title}
        </h2>

        <p>
          {children}
        </p>
      </div>
    </article>
  );
}