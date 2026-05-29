import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, HelpCircle, Mail, RefreshCcw, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const sections = [
  {
    title: 'Dostawa i logistyka',
    icon: Truck,
    items: [
      {
        question: 'Jak wygląda wysyłka żywych zwierząt?',
        answer:
          'Żywe zwierzęta wysyłamy wyłącznie w bezpiecznych oknach logistycznych, po wcześniejszym potwierdzeniu warunków i terminu. Chodzi o ograniczenie ryzyka w transporcie i utrzymanie właściwej temperatury.'
      },
      {
        question: 'Jak szybko wysyłacie akcesoria i pokarm?',
        answer:
          'Akcesoria, terraria, pokarm i suplementy nadajemy standardowo w 24-48 godzin roboczych, o ile produkt jest dostępny od ręki.'
      },
      {
        question: 'Czy mogę zamówić kilka kategorii w jednym koszyku?',
        answer:
          'Tak. Katalog jest właśnie po to uporządkowany, żeby łatwo połączyć zwierzę, terrarium, ogrzewanie i wyposażenie w jednym zamówieniu.'
      }
    ]
  },
  {
    title: 'Płatności i finalizacja zamówienia',
    icon: CreditCard,
    items: [
      {
        question: 'Jakie metody płatności są dostępne?',
        answer:
          'Zamówienia finalizujemy przez Stripe Checkout. W zależności od konfiguracji konta Stripe mogą być dostępne karty, Link oraz inne metody aktywne dla rynku polskiego.'
      },
      {
        question: 'Kiedy zamówienie trafia do realizacji?',
        answer:
          'Po potwierdzeniu płatności przez Stripe. Jeśli płatność nie zostanie ukończona albo się nie powiedzie, zamówienie nie przechodzi dalej do realizacji.'
      }
    ]
  },
  {
    title: 'Zwroty i reklamacje',
    icon: RefreshCcw,
    items: [
      {
        question: 'Czy mogę zwrócić akcesoria?',
        answer:
          'Tak, dla zwykłych produktów obowiązują standardowe zasady odstąpienia od umowy. Szczegóły znajdziesz na stronie odstąpienia od umowy oraz w regulaminie.'
      },
      {
        question: 'Czy żywe zwierzęta podlegają standardowemu zwrotowi?',
        answer:
          'Nie w taki sam sposób jak zwykłe akcesoria. Przy żywych zwierzętach obowiązują ograniczenia wynikające z charakteru świadczenia i dobrostanu zwierzęcia.'
      },
      {
        question: 'Jak zgłosić problem z zamówieniem?',
        answer:
          'Najlepiej napisać do sklepu i podać numer zamówienia, opis sytuacji oraz zdjęcia, jeśli sprawa dotyczy stanu przesyłki lub produktu.'
      }
    ]
  }
];

const FAQ = () => {
  return (
    <>
      <Helmet>
        <title>FAQ | VitaZone</title>
        <meta
          name="description"
          content="Najczęściej zadawane pytania dotyczące wysyłki, płatności, zwrotów i obsługi zamówień w VitaZone."
        />
      </Helmet>

      <div className="min-h-screen px-4 py-12 text-neutral-100 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl space-y-8"
        >
          <div className="space-y-4 text-center">
            <h1 className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              <HelpCircle className="text-emerald-500" size={40} />
              FAQ
            </h1>
            <p className="mx-auto max-w-3xl text-neutral-400">
              Zebraliśmy najważniejsze informacje o dostawie, płatnościach i realizacji zamówień.
              Dzięki temu szybciej znajdziesz odpowiedź jeszcze przed zakupem.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="rounded-[2rem] border border-neutral-700/50 bg-neutral-800/50 p-6 shadow-xl backdrop-blur-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-emerald-400">
                    <Icon size={24} /> {section.title}
                  </h2>
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <details key={item.question} className="group rounded-2xl bg-neutral-900/50 p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-neutral-200">
                          {item.question}
                          <span className="transition-transform group-open:rotate-180">⌄</span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-neutral-400">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-10 text-center">
            <p className="mb-4 text-neutral-400">Nie ma tu odpowiedzi na Twoją sytuację?</p>
            <a
              href="mailto:kontakt@animalsshop.pl"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3 font-bold text-white transition-all hover:bg-emerald-500"
            >
              <Mail size={20} /> Napisz do sklepu
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FAQ;
