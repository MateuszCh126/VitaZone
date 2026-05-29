import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, MessageSquareMore, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const contactCards = [
  {
    title: 'Email do sklepu',
    value: 'Napisz do obsługi VitaZone',
    description: 'Najlepsza opcja przy pytaniach o asortyment, dostępność i większe zamówienia.',
    href: 'mailto:kontakt@animalsshop.pl',
    icon: Mail
  },
  {
    title: 'Telefon',
    value: '+48 123 456 789',
    description: 'Kontakt w sprawie zamówień, dostawy i obsługi posprzedażowej w dni robocze.',
    href: 'tel:+48123456789',
    icon: Phone
  },
  {
    title: 'Adres korespondencyjny',
    value: 'ul. Terrarystyczna 10, 00-001 Warszawa',
    description: 'Dane kontaktowe do korespondencji oraz formalnej obsługi sklepu.',
    href: null,
    icon: MapPin
  }
];

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Kontakt | VitaZone</title>
        <meta
          name="description"
          content="Skontaktuj się z VitaZone. Znajdziesz tu dane kontaktowe, godziny obsługi oraz wskazówki, jak najszybciej uzyskać odpowiedź."
        />
      </Helmet>

      <div className="min-h-screen px-4 py-12 text-neutral-100 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Kontakt
            </h1>
            <p className="mx-auto max-w-3xl text-neutral-400">
              Jeśli potrzebujesz pomocy z wyborem gatunku, terrarium albo wyposażenia, napisz lub zadzwoń.
              Odpowiadamy konkretnie i pomagamy dobrać rozwiązanie do planowanego terrarium.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              {contactCards.map((card) => {
                const Icon = card.icon;
                const content = (
                  <div className="rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm transition-colors hover:border-emerald-500/30">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">{card.title}</p>
                        <p className="mt-2 text-xl font-semibold text-emerald-200">{card.value}</p>
                        <p className="mt-3 text-sm leading-relaxed text-neutral-400">{card.description}</p>
                      </div>
                    </div>
                  </div>
                );

                return card.href ? (
                  <a key={card.title} href={card.href} className="block">
                    {content}
                  </a>
                ) : (
                  <div key={card.title}>{content}</div>
                );
              })}
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                  <Clock className="h-5 w-5" /> Godziny kontaktu
                </h2>
                <ul className="space-y-3 text-neutral-300">
                  <li className="flex justify-between border-b border-neutral-700 pb-3">
                    <span>Poniedziałek - piątek</span>
                    <span>09:00 - 18:00</span>
                  </li>
                  <li className="flex justify-between border-b border-neutral-700 pb-3">
                    <span>Sobota</span>
                    <span>10:00 - 14:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Niedziela</span>
                    <span className="text-neutral-500">Odpowiadamy mailowo</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-8 shadow-xl backdrop-blur-sm">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                  <MessageSquareMore className="h-5 w-5" /> Co warto podać w wiadomości
                </h2>
                <ul className="space-y-3 text-sm leading-relaxed text-neutral-300">
                  <li>Nazwę gatunku lub produktu, którego dotyczy pytanie.</li>
                  <li>Planowaną wielkość terrarium albo obecny układ, jeśli pytasz o rozbudowę.</li>
                  <li>Informację, czy chodzi o pierwszy zakup, czy o rozwinięcie istniejącej hodowli.</li>
                  <li>Numer zamówienia, jeśli wiadomość dotyczy realizacji lub dostawy.</li>
                </ul>
              </div>

              <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-8">
                <h2 className="mb-3 text-2xl font-semibold text-white">Szybka ścieżka pomocy</h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-200">
                  Jeśli chcesz od razu zobaczyć zasady dostawy, płatności i zwrotów, przejdź do FAQ lub dokumentów sklepu.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/faq" className="rounded-full bg-white px-6 py-3 text-center font-semibold text-black transition-colors hover:bg-emerald-100">
                    Otwórz FAQ
                  </Link>
                  <Link to="/terms" className="rounded-full border border-white/20 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/5">
                    Zobacz regulamin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Contact;
