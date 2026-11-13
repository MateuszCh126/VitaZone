import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/analytics';

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const hasLiveAnimal = cart.some((item) => [
    'Jaszczurki i gekony',
    'Węże',
    'Żółwie',
    'Płazy',
    'Ptaszniki i skorpiony'
  ].includes(item.category_name));

  const handleCheckout = () => {
    trackEvent('open_checkout_from_cart', {
      itemCount: cart.reduce((count, item) => count + item.quantity, 0)
    });
    setIsCartOpen(false);
    navigate('/checkout');
  };

  useEffect(() => {
    if (!isCartOpen) return undefined;
    openerRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsCartOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = document.getElementById('cart-dialog');
      const focusable = dialog?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (openerRef.current instanceof HTMLElement && openerRef.current.isConnected) openerRef.current.focus();
    };
  }, [isCartOpen, setIsCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            id="cart-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-dialog-title"
            tabIndex={-1}
            className="fixed top-0 right-0 z-[70] flex h-full w-full flex-col border-l border-white/10 bg-bg-secondary shadow-2xl md:w-[450px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 id="cart-dialog-title" className="flex items-center gap-2 text-2xl font-bold">
                Twój koszyk <span className="text-sm font-normal text-primary">({cart.length})</span>
              </h2>
              <button
                ref={closeButtonRef}
                onClick={() => setIsCartOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 transition-colors hover:bg-white/10"
                aria-label="Zamknij koszyk"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <p className="mb-4 text-lg">Twój koszyk jest pusty.</p>
                  <button onClick={() => setIsCartOpen(false)} className="min-h-11 text-primary hover:underline">
                    Wróć do przeglądania
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                      <img
                        src={item.image_urls?.[0] || item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="mb-1 text-sm font-bold leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-400">{item.species}</p>
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-3 rounded-lg bg-black/30 p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 transition-colors hover:text-primary disabled:opacity-50"
                            aria-label={`Zmniejsz ilość produktu ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-4 text-center font-mono text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 transition-colors hover:text-primary"
                            aria-label={`Zwiększ ilość produktu ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-primary">{(item.price * item.quantity).toFixed(2)} zł</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Usuń produkt ${item.name} z koszyka`}
                            className="flex min-h-11 items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-300"
                          >
                            <Trash2 size={12} /> Usuń
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 bg-black/20 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-gray-400">Suma (PLN)</span>
                  <span className="text-3xl font-bold text-white">{cartTotal.toFixed(2)} zł</span>
                </div>
                {hasLiveAnimal && (
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-300">
                    Przed zakupem żywego zwierzęcia zapoznaj się z aktualnymi{' '}
                    <Link to="/withdrawal" className="text-emerald-300 underline underline-offset-4">zasadami odstąpienia od umowy</Link>.
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Przejdź do płatności
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span> Bezpieczna szyfrowana płatność
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
