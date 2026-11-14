import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const categories = [
  'Zwierzęta egzotyczne',
  'Terraria i zestawy',
  'Ogrzewanie i oświetlenie',
  'Podłoża i dekoracje',
  'Pokarm i suplementy'
];

const steps = [
  {
    number: '01',
    title: 'Znajdź dział',
    description: 'Wybierz kategorię albo zacznij od wyszukiwarki.'
  },
  {
    number: '02',
    title: 'Sprawdź pozycję',
    description: 'Na karcie produktu zobaczysz opis, cenę i podaną dostępność.'
  },
  {
    number: '03',
    title: 'Zobacz podsumowanie',
    description: 'Przed przejściem do płatności sprawdź produkty, dostawę i łączną kwotę.'
  }
];

const About = () => (
  <div className="min-h-screen bg-bg text-text">
    <Helmet>
      <title>O sklepie | VitaZone</title>
      <meta
        name="description"
        content="Poznaj działy katalogu VitaZone i zobacz, jak przejść od wybranej kategorii do podsumowania zamówienia."
      />
    </Helmet>

    <section className="relative isolate overflow-hidden border-b border-white/10">
      <div className="container relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20 lg:pb-24">
        <div className="max-w-3xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 bg-primary" />
            VitaZone · katalog
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Terrarystyka i zwierzęta <span className="text-primary">egzotyczne.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
            Katalog VitaZone obejmuje zwierzęta egzotyczne, terraria, ogrzewanie, oświetlenie, podłoża, dekoracje oraz pokarm.
          </p>
        </div>

        <div className="border-l border-primary/40 pl-5 sm:pl-7 lg:mb-1">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Działy katalogu</p>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {categories.map((category, index) => (
              <li key={category} className="flex items-center gap-5 py-3.5 sm:py-4">
                <span className="w-7 font-mono text-xs text-primary/80">0{index + 1}</span>
                <span className="text-sm font-medium text-gray-100 sm:text-base">{category}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    <section aria-labelledby="shopping-steps" className="container mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Jak kupować</p>
          <h2 id="shopping-steps" className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
            Od wyboru do podsumowania.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
            Możesz przeglądać katalog bez zakładania konta. Przed płatnością sprawdź szczegóły pozycji oraz kwotę zamówienia.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex min-h-11 items-center gap-3 border-b border-primary/70 pb-1 text-sm font-semibold text-primary transition-colors hover:border-primary hover:text-white focus-visible:outline-offset-4"
          >
            Przejdź do katalogu <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <ol className="border-t border-white/10">
          {steps.map((step) => (
            <li key={step.number} className="grid gap-3 border-b border-white/10 py-5 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:py-6">
              <span className="font-mono text-xs tracking-wide text-primary">{step.number}</span>
              <div>
                <h3 className="text-base font-semibold text-white sm:text-lg">{step.title}</h3>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-gray-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  </div>
);

export default About;
