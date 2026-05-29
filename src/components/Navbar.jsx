import React from 'react';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const CartDrawer = lazyWithRetry(() => import('./CartDrawer'));

const navigationLinks = [
  { to: '/', label: 'Start', end: true },
  { to: '/shop', label: 'Asortyment' },
  { to: '/about', label: 'O nas' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Kontakt' }
];

const navLinkClassName = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-white/80 hover:text-primary'}`;

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [shouldLoadCartDrawer, setShouldLoadCartDrawer] = React.useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  const handleOpenCart = () => {
    setShouldLoadCartDrawer(true);
    setIsCartOpen(true);
  };

  return (
    <nav className="fixed left-0 top-0 z-50 w-full transition-all duration-300">
      <div className="glass border-none bg-black/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter sm:text-2xl">
            <span className="text-white">VITA</span>
            <span className="text-primary">ZONE</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            {navigationLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClassName}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="relative rounded-full p-2 text-white/80 transition-colors duration-200 hover:scale-110 hover:text-primary active:scale-95"
              onClick={handleOpenCart}
              onMouseEnter={() => setShouldLoadCartDrawer(true)}
              onFocus={() => setShouldLoadCartDrawer(true)}
              aria-label={`Otwórz koszyk, liczba produktów: ${cartCount}`}
              type="button"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full p-1 text-sm font-medium text-white/80 transition-colors hover:text-primary"
                aria-label="Przejdź do panelu klienta"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 bg-primary/20 text-primary sm:h-9 sm:w-9">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full p-2 text-white/80 transition-colors hover:text-primary"
                aria-label="Przejdź do logowania"
              >
                <User size={20} />
              </Link>
            )}

            <button
              className="rounded-full border border-white/10 p-2 text-white transition-colors hover:border-primary/40 hover:text-primary md:hidden"
              onClick={() => setIsOpen((current) => !current)}
              aria-label={isOpen ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={isOpen}
              type="button"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 flex h-[100svh] flex-col overflow-y-auto bg-black/95 px-6 pb-10 pt-24 backdrop-blur-xl transition-all duration-300 md:hidden ${
          isOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-6 top-6 p-2 text-white/50 transition-colors hover:text-white"
          aria-label="Zamknij menu mobilne"
          type="button"
        >
          <X size={32} />
        </button>

        <div className="flex flex-col gap-6">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `border-b border-white/10 pb-4 text-2xl font-bold tracking-tight transition-colors ${
                  isActive ? 'text-primary' : 'text-white hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <Link
              to="/dashboard"
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/25 px-5 py-3 text-lg font-medium text-white/80 transition-colors hover:border-primary hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              <User size={20} />
              Panel klienta
            </Link>
          ) : (
            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-primary/25 px-5 py-3 text-lg font-medium text-white/80 transition-colors hover:border-primary hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Logowanie
            </Link>
          )}
        </div>
      </div>

      {shouldLoadCartDrawer && (
        <React.Suspense fallback={null}>
          <CartDrawer />
        </React.Suspense>
      )}
    </nav>
  );
};

export default Navbar;
