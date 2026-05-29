import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Polityka prywatności | VitaZone</title>
        <meta
          name="description"
          content="Polityka prywatności VitaZone: informacje o przetwarzaniu danych osobowych, bezpieczeństwie oraz prawach użytkownika."
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
              Polityka prywatności
            </h1>
            <p className="text-neutral-400">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</p>
          </div>

          <div className="space-y-8 rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
            <section className="space-y-3">
              <div className="mb-2 flex items-center gap-3 text-emerald-400">
                <Shield className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Zakres przetwarzania</h2>
              </div>
              <p className="leading-relaxed text-neutral-300">
                Przetwarzamy dane niezbędne do realizacji zamówienia, obsługi płatności, kontaktu z klientem, wystawienia dokumentów sprzedaży
                oraz obsługi zgłoszeń posprzedażowych.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-emerald-400">Cele przetwarzania danych</h2>
              <ul className="ml-4 list-disc space-y-2 text-neutral-300">
                <li>realizacja zamówienia i kontakt związany z zakupem,</li>
                <li>obsługa płatności i rozliczeń,</li>
                <li>realizacja obowiązków prawnych i księgowych,</li>
                <li>obsługa reklamacji, zwrotów i pytań klientów.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-emerald-400">Prawa użytkownika</h2>
              <p className="leading-relaxed text-neutral-300">
                Użytkownik ma prawo do dostępu do swoich danych, ich sprostowania, ograniczenia przetwarzania,
                usunięcia, przeniesienia oraz wniesienia sprzeciwu w przypadkach przewidzianych przepisami.
              </p>
            </section>

            <section className="space-y-3">
              <div className="mb-2 flex items-center gap-3 text-emerald-400">
                <Lock className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Bezpieczeństwo</h2>
              </div>
              <p className="leading-relaxed text-neutral-300">
                Korzystamy z bezpiecznego połączenia HTTPS, ograniczamy dostęp do danych oraz stosujemy mechanizmy ochronne
                po stronie aplikacji i bazy danych. Dane płatnicze są przetwarzane przez zewnętrznego operatora płatności Stripe.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-emerald-400">Kontakt w sprawie danych</h2>
              <p className="leading-relaxed text-neutral-300">
            W sprawach związanych z prywatnością można kontaktować się mailowo przez adres kontaktowy sklepu.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
