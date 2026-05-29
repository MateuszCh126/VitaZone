import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/analytics';

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    trackEvent('open_checkout_from_cart', {
      itemCount: cart.length,
      cartTotal: Number(cartTotal) || 0
    });
    setIsCartOpen(false);
    navigate('/checkout');
  };

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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[70] flex h-full w-full flex-col border-l border-white/10 bg-bg-secondary shadow-2xl md:w-[450px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                Twój koszyk <span className="text-sm font-normal text-primary">({cart.length})</span>
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-white/10"
                aria-label="Zamknij koszyk"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                  <p className="mb-4 text-lg">Twój koszyk jest pusty.</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-primary hover:underline">
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
                            className="p-1 transition-colors hover:text-primary disabled:opacity-50"
                            aria-label={`Zmniejsz ilość produktu ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-4 text-center font-mono text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 transition-colors hover:text-primary"
                            aria-label={`Zwiększ ilość produktu ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-primary">{(item.price * item.quantity).toFixed(2)} zł</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-400"
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
                <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-[10px] leading-tight text-orange-200">
                  <strong>Art. 38:</strong> dla żywych zwierząt nie obowiązuje standardowy zwrot jak dla zwykłych akcesoriów.
                </div>
                <button
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Przejdź do płatności
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
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
