import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Withdrawal = () => {
  return (
    <>
      <Helmet>
        <title>Odstąpienie od umowy | VitaZone</title>
        <meta
          name="description"
          content="Informacje o prawie odstąpienia od umowy w VitaZone oraz wzór formularza zwrotu dla zwykłych produktów."
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
              Odstąpienie od umowy
            </h1>
            <p className="text-neutral-400">Zasady zwrotu dla zwykłych produktów oraz wyjątki dotyczące żywych zwierząt.</p>
          </div>

          <div className="space-y-8 rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-emerald-400">Prawo do odstąpienia</h2>
              <p className="leading-relaxed text-neutral-300">
                W przypadku zwykłych produktów konsument ma prawo odstąpić od umowy w terminie 14 dni od otrzymania przesyłki,
                bez podawania przyczyny. Aby skorzystać z tego prawa, wystarczy przesłać jednoznaczne oświadczenie mailowo lub pisemnie.
              </p>
            </section>

            <section className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-red-400">
                <AlertTriangle className="h-6 w-6" /> Wyjątek: żywe zwierzęta
              </h3>
              <p className="leading-relaxed text-red-100/85">
                Dla żywych zwierząt nie stosuje się standardowego zwrotu jak dla zwykłych akcesoriów. Wynika to z charakteru świadczenia,
                logistyki transportu oraz dobrostanu zwierzęcia. Przed zakupem warto zapoznać się z FAQ i warunkami dostawy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-emerald-400">Jak zgłosić odstąpienie</h2>
              <p className="leading-relaxed text-neutral-300">
            Napisz do sklepu, podając numer zamówienia, dane kontaktowe i informację, którego produktu dotyczy zwrot.
                Po przyjęciu zgłoszenia przekażemy dalsze instrukcje dotyczące odesłania produktu.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-700 bg-neutral-900/50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-300">
                <Download className="h-5 w-5" /> Wzór oświadczenia o odstąpieniu
              </h3>
              <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-400">
              {`Adresat: VitaZone, adres kontaktowy sklepu

Ja/My niniejszym informuję/informujemy o odstąpieniu od umowy sprzedaży następujących produktów:

Numer zamówienia:
Data odbioru:
Imię i nazwisko:
Adres:
Numer telefonu lub email:
Data sporządzenia oświadczenia:`}
              </pre>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Withdrawal;
