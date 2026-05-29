import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageSquareMore, Phone } from 'lucide-react';
import { FEATURED_CATEGORY_NAMES, STOREFRONT_CATEGORIES, getCategoryHref } from '../data/storefrontData';

const featuredLinks = STOREFRONT_CATEGORIES.filter((category) => FEATURED_CATEGORY_NAMES.includes(category.name));

const Footer = () => {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/10 bg-black pb-8 pt-14 sm:mt-20 sm:pb-10 sm:pt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="sr-only">Stopka VitaZone</h2>
        <div className="mb-12 grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-4">
          <div className="max-w-md">
            <Link to="/" className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tighter">
              <span className="text-white">VITA</span>
              <span className="text-primary">ZONE</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Sklep dla odpowiedzialnych opiekunów: zwierzęta egzotyczne, terraria, ogrzewanie,
              dekoracje, pokarm i wsparcie przed pierwszym zakupem.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a href="mailto:kontakt@animalsshop.pl" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-gray-300 transition-colors hover:border-primary/40 hover:text-white sm:w-auto">
                <Mail size={14} className="text-primary" /> Napisz do sklepu
              </a>
              <Link to="/faq" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-gray-300 transition-colors hover:border-primary/40 hover:text-white sm:w-auto">
                <MessageSquareMore size={14} className="text-primary" /> FAQ i wysyłka
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-6 font-bold text-white">Kategorie</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              {featuredLinks.map((category) => (
                <li key={category.slug}>
                  <Link to={getCategoryHref(category.name)} className="transition-colors hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-bold text-white">Informacje</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/about" className="transition-colors hover:text-primary">O sklepie</Link></li>
              <li><Link to="/faq" className="transition-colors hover:text-primary">FAQ i wysyłka</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-primary">Kontakt</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-primary">Polityka prywatności</Link></li>
              <li><Link to="/terms" className="transition-colors hover:text-primary">Regulamin</Link></li>
              <li><Link to="/cookies" className="transition-colors hover:text-primary">Cookies</Link></li>
              <li><Link to="/withdrawal" className="transition-colors hover:text-primary">Odstąpienie od umowy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-bold text-white">Kontakt</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-primary" />
                <span>ul. Terrarystyczna 10, 00-001 Warszawa</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 text-primary" />
                <span>+48 123 456 789</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-primary" />
                <a href="mailto:kontakt@animalsshop.pl" className="transition-colors hover:text-primary">
                  Napisz do sklepu
                </a>
              </li>
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-gray-500">
              Zwierzęta wysyłamy wyłącznie w bezpiecznych oknach logistycznych. Akcesoria i pokarm nadajemy szybciej, zwykle w 24-48 h.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} VitaZone. Sklep terrarystyczny online.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
