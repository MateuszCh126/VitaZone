import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Search, ShoppingBag, Truck, Warehouse } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const pillars = [
  {
    title: 'Czytelny podział katalogu',
    description: 'Osobne działy obejmują zwierzęta, terraria, ogrzewanie, oświetlenie, podłoża, dekoracje i pokarm.',
    icon: Warehouse
  },
  {
    title: 'Informacje przy produkcie',
    description: 'Na karcie pozycji możesz sprawdzić opis, cenę i bieżącą dostępność.',
    icon: Search
  },
  {
    title: 'Zakup bez zakładania konta',
    description: 'Zamówienie złożysz jako gość. Zalogowani klienci mogą powiązać je ze swoim kontem.',
    icon: ShoppingBag
  }
];

const process = [
  'Otwierasz kategorię, wyszukujesz produkt lub wybierasz jedną z dwóch ścieżek zakupowych.',
  'Na karcie sprawdzasz opis, cenę i dostępność konkretnej pozycji.',
  'Podajesz dane dostawy i przechodzisz do płatności obsługiwanej przez Stripe Checkout.'
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>O sklepie | VitaZone</title>
        <meta
          name="description"
            content="Informacje o katalogu VitaZone: zwierzęta egzotyczne, terraria, ogrzewanie, oświetlenie, podłoża, dekoracje i pokarm."
        />
      </Helmet>

      <section className="relative overflow-hidden py-24">
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-5xl font-bold md:text-7xl"
          >
            O sklepie
          </motion.h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-400">
            Katalog VitaZone obejmuje zwierzęta egzotyczne, terraria, ogrzewanie, oświetlenie, podłoża, dekoracje oraz pokarm.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={32} />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white">{pillar.title}</h2>
                <p className="text-sm leading-relaxed text-gray-400">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/5 py-20">
        <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Jak kupować</p>
            <h2 className="mb-4 text-4xl font-bold text-white">Od wyszukiwania do płatności</h2>
            <p className="max-w-2xl text-gray-400">
              Opis, cena i dostępność są przypisane do konkretnej karty produktu. Sprawdź je przed dodaniem pozycji do koszyka.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8">
            <ol className="space-y-4">
              {process.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-black">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 sm:py-20">
        <div className="grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Przed płatnością</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Sprawdź szczegóły i sumę zamówienia</h2>
            <p className="mt-4 max-w-md leading-relaxed text-gray-400">Zobacz opis na karcie produktu, a koszt dostawy i łączną kwotę przed przekierowaniem do płatności.</p>
          </div>
          <div className="divide-y divide-white/10">
            {[
              { icon: Search, title: 'Karta produktu', description: 'Opis, cena i stan magazynowy wybranej pozycji.' },
              { icon: Truck, title: 'Podsumowanie', description: 'Koszt dostawy i łączna kwota przed płatnością.' },
              { icon: CreditCard, title: 'Płatność', description: 'Finalizacja zamówienia przez Stripe Checkout.' }
            ].map((step) => (
              <div key={step.title} className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-5">
                {React.createElement(step.icon, { size: 21, 'aria-hidden': true, className: 'mt-1 text-primary' })}
                <div><h3 className="text-lg font-semibold text-white">{step.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-gray-400">{step.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
