import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const TermsAndConditions = () => {
  return (
    <>
      <Helmet>
        <title>Regulamin sklepu | VitaZone</title>
        <meta
          name="description"
          content="Regulamin sklepu internetowego VitaZone: zasady składania zamówień, płatności, dostawy oraz reklamacji."
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
              Regulamin sklepu
            </h1>
            <p className="text-neutral-400">Wersja obowiązująca od {new Date().toLocaleDateString('pl-PL')}</p>
          </div>

          <div className="space-y-6 rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                <Scale className="h-6 w-6" /> 1. Postanowienia ogólne
              </h2>
              <p className="leading-relaxed text-neutral-300">
                Niniejszy regulamin określa zasady korzystania ze sklepu internetowego VitaZone, składania zamówień,
                realizacji płatności oraz obsługi reklamacji i zwrotów.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-emerald-400">2. Składanie zamówień</h2>
              <p className="leading-relaxed text-neutral-300">
                Zamówienia można składać przez stronę internetową przez całą dobę. Warunkiem realizacji jest poprawne wypełnienie danych,
                akceptacja regulaminu oraz skuteczne ukończenie procesu płatności, jeśli wybrana metoda tego wymaga.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-emerald-400">3. Płatności</h2>
              <p className="leading-relaxed text-neutral-300">
                Płatności elektroniczne obsługiwane są przez Stripe Checkout. Zamówienie uznaje się za opłacone po potwierdzeniu płatności przez operatora.
                Nieukończona lub nieudana płatność może skutkować anulowaniem zamówienia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-emerald-400">4. Dostawa</h2>
              <p className="leading-relaxed text-neutral-300">
                Akcesoria, terraria, pokarm i suplementy wysyłamy standardowo w czasie wskazanym przy realizacji zamówienia.
                Żywe zwierzęta przekazujemy wyłącznie w bezpiecznych oknach logistycznych, po uwzględnieniu warunków transportu i dobrostanu.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-emerald-400">5. Reklamacje i zwroty</h2>
              <p className="leading-relaxed text-neutral-300">
                Reklamacje można zgłaszać drogą mailową. Dla zwykłych produktów obowiązują standardowe zasady odstąpienia od umowy,
                natomiast w przypadku żywych zwierząt stosuje się ograniczenia wynikające z charakteru świadczenia i dobrostanu zwierzęcia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                <FileText className="h-6 w-6" /> 6. Kontakt
              </h2>
              <p className="leading-relaxed text-neutral-300">
              W sprawach dotyczących sklepu, zamówień i dokumentów prosimy o kontakt mailowy
                lub telefonicznie pod numerem +48 123 456 789.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TermsAndConditions;
