import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const cookieTypes = [
  {
    title: 'Niezbędne',
    description: 'Służą do prawidłowego działania sklepu, logowania, koszyka i obsługi sesji użytkownika.'
  },
  {
    title: 'Analityczne',
    description: 'Pomagają zrozumieć, jak użytkownicy korzystają ze strony i które elementy warto dalej rozwijać.'
  },
  {
    title: 'Funkcjonalne',
    description: 'Pozwalają zapamiętać wybrane ustawienia i poprawić wygodę korzystania ze sklepu.'
  }
];

const CookiesPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Polityka cookies | VitaZone</title>
        <meta
          name="description"
          content="Informacje o plikach cookies używanych w VitaZone i sposobie zarządzania zgodami użytkownika."
        />
      </Helmet>

      <div className="min-h-screen px-4 py-12 text-neutral-100 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl space-y-8"
        >
          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent">
              Polityka cookies
            </h1>
            <p className="text-neutral-400">Wyjaśniamy, jakich plików cookies używamy i po co są potrzebne.</p>
          </div>

          <div className="space-y-6 rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                <Cookie className="h-6 w-6" /> Czym są cookies?
              </h2>
              <p className="leading-relaxed text-neutral-300">
                Cookies to niewielkie pliki zapisywane w urządzeniu użytkownika, które pomagają stronie działać poprawnie,
                zapamiętywać ustawienia i mierzyć podstawowe informacje o korzystaniu z serwisu.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-emerald-400">Jakie cookies wykorzystujemy?</h2>
              <div className="space-y-4">
                {cookieTypes.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-2xl bg-neutral-900/50 p-4">
                    <div className="h-fit rounded-lg bg-emerald-500/10 p-2">
                      <Info className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <strong className="block text-emerald-300">{item.title}</strong>
                      <p className="mt-1 text-neutral-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-emerald-400">Zarządzanie zgodą</h2>
              <p className="leading-relaxed text-neutral-300">
                Ustawienia cookies można zmieniać z poziomu przeglądarki oraz banera zgód dostępnego na stronie.
                Wyłączenie części plików może wpłynąć na wygodę korzystania z wybranych funkcji sklepu.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CookiesPolicy;
