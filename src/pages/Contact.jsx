import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Contact = () => (
  <>
    <Helmet>
      <title>Kontakt | VitaZone</title>
      <meta
        name="description"
        content="Informacje kontaktowe VitaZone wymagają potwierdzenia przed uruchomieniem sprzedaży."
      />
    </Helmet>

    <div className="min-h-screen px-4 py-20 text-neutral-100 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-3xl"
      >
        <header className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">Kontakt</h1>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Publikujemy wyłącznie potwierdzone dane kontaktowe sklepu.
          </p>
        </header>

        <section aria-labelledby="contact-status" className="border-y border-neutral-800 py-8">
          <div className="flex items-start gap-4">
            <Info aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 id="contact-status" className="text-xl font-semibold text-white">Dane do potwierdzenia</h2>
              <p className="mt-3 leading-relaxed text-neutral-300">
                Adres e-mail i dane sprzedawcy wymagają potwierdzenia przez właściciela przed uruchomieniem sprzedaży.
                Nie podajemy niezweryfikowanego adresu ani czasu odpowiedzi.
              </p>
            </div>
          </div>
        </section>

        <nav aria-label="Informacje o zamówieniu" className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/faq"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Przejdź do FAQ
          </Link>
          <Link
            to="/terms"
            className="inline-flex min-h-11 items-center rounded-full border border-neutral-700 px-5 py-2 font-semibold text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Zobacz projekt regulaminu
          </Link>
        </nav>
      </motion.div>
    </div>
  </>
);

export default Contact;
