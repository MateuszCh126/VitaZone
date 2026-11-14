import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import LegalDraftNotice from '../../components/LegalDraftNotice';

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
            <h1 className="text-4xl font-bold text-white">
              Polityka cookies
            </h1>
            <p className="text-neutral-400">Informacje o ustawieniach zgody i elementach przeglądarki wykorzystywanych przez VitaZone.</p>
          </div>

          <LegalDraftNotice />

          <div className="space-y-6 rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-primary">
                <Cookie className="h-6 w-6" /> Czym są cookies?
              </h2>
              <p className="leading-relaxed text-neutral-300">
                Cookies to niewielkie pliki zapisywane w urządzeniu użytkownika, które pomagają stronie działać poprawnie,
                zapamiętywać ustawienia i mierzyć podstawowe informacje o korzystaniu z serwisu.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Jakie cookies wykorzystujemy?</h2>
              <div className="space-y-4">
                <div className="flex gap-3 rounded-2xl bg-neutral-900/50 p-4">
                  <div className="h-fit rounded-lg bg-primary/10 p-2"><Info className="h-5 w-5 text-primary" /></div>
                  <div><strong className="block text-primary">Zgoda i ustawienia</strong><p className="mt-1 text-neutral-300">Wybór analityki zapisujemy w pamięci lokalnej przeglądarki. Dokładna lista plików lub identyfikatorów używanych przez dostawców zewnętrznych wymaga potwierdzenia po audycie konfiguracji produkcyjnej.</p></div>
                </div>
                <div className="flex gap-3 rounded-2xl bg-neutral-900/50 p-4">
                  <div className="h-fit rounded-lg bg-primary/10 p-2"><Info className="h-5 w-5 text-primary" /></div>
                  <div><strong className="block text-primary">Elementy wymagane do działania</strong><p className="mt-1 text-neutral-300">Sklep korzysta z pamięci przeglądarki do zachowania ustawienia zgody i obsługi wybranych funkcji. Szczegółowa inwentaryzacja storage, sesji i czasu przechowywania jest do potwierdzenia przez właściciela.</p></div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-primary">Zarządzanie zgodą</h2>
              <p className="leading-relaxed text-neutral-300">
                Zgodę na analitykę możesz zmienić w dowolnym momencie, otwierając ustawienia prywatności w stopce. Analityka jest domyślnie wyłączona do czasu wyboru. Niezbędne elementy pozostają aktywne.
              </p>
              <button type="button" onClick={() => window.dispatchEvent(new Event('open_cookie_settings'))} className="rounded-lg border border-primary/40 px-4 py-2 font-semibold text-primary hover:bg-primary/10">Otwórz ustawienia prywatności</button>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CookiesPolicy;
