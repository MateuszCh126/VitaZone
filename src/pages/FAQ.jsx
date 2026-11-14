import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, HelpCircle, Info, RefreshCcw, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Dostawa i logistyka',
    icon: Truck,
    items: [
      {
        question: 'Jak wygląda wysyłka żywych zwierząt?',
        answer:
          'Warunki i dostępność dostawy żywych zwierząt wymagają potwierdzenia dla konkretnej oferty przed zamówieniem. Ogólna informacja na stronie nie potwierdza terminu realizacji.'
      },
      {
        question: 'Jak szybko wysyłacie akcesoria i pokarm?',
        answer:
          'Nie podajemy jednego potwierdzonego terminu dla wszystkich produktów. Aktualne informacje o realizacji należy sprawdzić dla wybranej oferty przed płatnością.'
      },
      {
        question: 'Czy mogę zamówić kilka kategorii w jednym koszyku?',
        answer:
          'Produkty z różnych kategorii możesz dodać do jednego koszyka i złożyć jako jedno zamówienie. Nie oznacza to jednej przesyłki: produkty mogą być wysyłane osobno, zależnie od oferty. Przed płatnością sprawdź podsumowanie dostawy; jeśli sposób lub koszt wysyłki nie są jasne, wstrzymaj finalizację do czasu potwierdzenia ich przez sklep.'
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
          'Dostępne metody zobaczysz na stronie Stripe Checkout przed potwierdzeniem płatności. To, które z nich będą aktywne, zależy od konfiguracji konta sklepu.'
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
        question: 'Jakie zasady odstąpienia dotyczą zamówienia?',
        answer:
          'Prawo odstąpienia przy zakupie online wynosi co do zasady 14 dni. Ustawa przewiduje wyjątki dla określonych sytuacji i towarów; nie potwierdzono jeszcze ich zastosowania dla wszystkich produktów w katalogu.'
      },
      {
        question: 'Czy żywe zwierzęta podlegają standardowemu zwrotowi?',
        answer:
          'Nie zakładamy automatycznego wyłączenia dla całej kategorii. Zastosowanie ustawowych wyjątków trzeba potwierdzić dla konkretnego produktu; ta informacja wymaga jeszcze akceptacji sprzedawcy i prawnika.'
      },
      {
        question: 'Jak zgłosić problem z zamówieniem?',
        answer:
          'Zachowaj numer zamówienia, krótki opis sytuacji oraz zdjęcia, jeśli dotyczą stanu przesyłki lub produktu. Kanał zgłoszenia zostanie podany po potwierdzeniu danych kontaktowych sklepu.'
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
          content="Informacje o dostawie, płatnościach, zwrotach i obsłudze zamówień w VitaZone."
        />
      </Helmet>

      <div className="min-h-screen px-4 py-12 text-neutral-100 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl space-y-10"
        >
          <div className="space-y-3 text-center">
            <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-primary md:text-5xl">
              <HelpCircle aria-hidden="true" className="text-primary/80" size={36} />
              FAQ
            </h1>
            <p className="mx-auto max-w-2xl text-neutral-400">
              Odpowiedzi o zamówieniach, dostawie i zwrotach. Wybierz temat albo rozwiń pytanie.
            </p>
          </div>

          <nav aria-label="Przejdź do tematu" className="flex flex-wrap justify-center gap-2">
            {sections.map((section, index) => (
              <a
                key={section.title}
                href={`#faq-section-${index + 1}`}
                className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {section.title}
              </a>
            ))}
          </nav>

          <div className="space-y-9">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <section key={section.title} id={`faq-section-${index + 1}`} className="scroll-mt-8">
                  <h2 className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-3 text-xl font-semibold text-primary">
                    <Icon aria-hidden="true" size={21} /> {section.title}
                  </h2>
                  <div className="divide-y divide-neutral-800">
                    {section.items.map((item) => (
                      <details key={item.question} className="group py-1">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded px-1 py-3 font-medium text-neutral-200 marker:hidden hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                          {item.question}
                          <span aria-hidden="true" className="shrink-0 text-lg text-primary/80 transition-transform group-open:rotate-180">⌄</span>
                        </summary>
                        <p className="max-w-3xl px-1 pb-4 text-sm leading-relaxed text-neutral-400">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="border-t border-neutral-800 pt-7 text-center">
            <p className="mb-4 text-neutral-400">Potrzebujesz potwierdzić szczegóły zamówienia?</p>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/50 px-6 py-2.5 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Info aria-hidden="true" size={20} /> Dane kontaktowe
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FAQ;
