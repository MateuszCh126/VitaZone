import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Leaf, ShieldCheck, Thermometer } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const pillars = [
  {
    title: 'Dobór oparty na realnej opiece',
    description: 'Stawiamy na gatunki i produkty, które da się prowadzić stabilnie w codziennej opiece.',
    icon: ShieldCheck
  },
  {
    title: 'Kompletna oferta w jednym miejscu',
    description: 'Od wyboru gatunku po terrarium, źródło ciepła, UVB i pokarm.',
    icon: Thermometer
  },
  {
    title: 'Oferta budowana pod jakość',
    description: 'Katalog ma pomagać w wyborze i wspierać dobre warunki utrzymania.',
    icon: BadgeCheck
  }
];

const process = [
  'Wybierasz gatunek lub wyposażenie dopasowane do planowanego terrarium.',
  'Porównujesz produkty pod kątem warunków utrzymania, dostępności i budżetu.',
  'Finalizujesz zamówienie w bezpiecznej bramce płatności i domykasz spójny zestaw.'
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>O sklepie | VitaZone</title>
        <meta
          name="description"
          content="Poznaj VitaZone, sklep terrarystyczny online ze zwierzętami egzotycznymi, terrariami i akcesoriami do kompletnej aranżacji terrarium."
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
            VitaZone to sklep terrarystyczny dla osób, które chcą dobrać zwierzę, terrarium i wyposażenie w jednym, czytelnym miejscu.
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
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Jak to działa</p>
            <h2 className="mb-4 text-4xl font-bold text-white">Od wyboru gatunku do gotowego zestawu</h2>
            <p className="max-w-2xl text-gray-400">
              Dzielimy ofertę na czytelne obszary: zwierzęta, terraria, ogrzewanie, dekoracje i pokarm. Dzięki temu szybciej dobierzesz wszystko do jednego terrarium.
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

      <section className="container mx-auto px-6 py-20">
        <div className="rounded-[2rem] border border-primary/20 bg-primary/8 px-8 py-10 md:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200">
                <Leaf size={16} className="text-primary" />
                Jakość, przejrzystość i odpowiedzialny dobór
              </div>
              <h2 className="mb-4 text-4xl font-bold text-white">Oferta zbudowana pod odpowiedzialną opiekę</h2>
              <p className="text-gray-300">
                W VitaZone stawiamy na ofertę, która pomaga dobrać odpowiednie warunki dla gatunku i spokojnie skompletować cały zestaw.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 text-sm leading-relaxed text-gray-300">
              <p className="mb-4 font-semibold text-white">Co wyróżnia naszą ofertę:</p>
              <ul className="space-y-3">
                <li>Czytelny podział na zwierzęta, terraria, ogrzewanie, dekoracje i pokarm.</li>
                <li>Opisy skupione na praktyce i warunkach utrzymania.</li>
                <li>Produkty dobrane tak, by tworzyć spójne zestawy zakupowe.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
