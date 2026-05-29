import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    Check,
    CreditCard,
    LoaderCircle,
    ShieldCheck,
    Truck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';
import { DEFAULT_SHIPPING_AMOUNT_CENTS } from '../../shared/commerce.js';
import { trackEvent } from '../utils/analytics';

const SHIPPING_AMOUNT = DEFAULT_SHIPPING_AMOUNT_CENTS / 100;

const Checkout = () => {
    const {
        cart,
        cartTotal,
        clearCart,
        appliedDiscount,
        applyDiscount,
        removeDiscount
    } = useCart();
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState(null);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [errors, setErrors] = useState({});
    const [checkoutState, setCheckoutState] = useState({
        type: 'idle',
        message: ''
    });
    const didClearCartRef = useRef(false);

    const [formData, setFormData] = useState({
        fullName: user?.full_name || user?.name || '',
        email: user?.email || '',
        country: user?.country || '',
        city: user?.city || '',
        postal_code: user?.postalCode || '',
        street: user?.street || '',
        house_number: user?.houseNumber || '',
        apartment_number: user?.apartmentNumber || ''
    });

    useEffect(() => {
        setFormData((current) => ({
            ...current,
            fullName: current.fullName || user?.full_name || user?.name || '',
            email: current.email || user?.email || '',
            country: current.country || user?.country || '',
            city: current.city || user?.city || '',
            postal_code: current.postal_code || user?.postalCode || '',
            street: current.street || user?.street || '',
            house_number: current.house_number || user?.houseNumber || '',
            apartment_number: current.apartment_number || user?.apartmentNumber || ''
        }));
    }, [user]);

    const subtotal = useMemo(() => cartTotal, [cartTotal]);
    const discountValue = useMemo(() => (appliedDiscount ? appliedDiscount.amount / 100 : 0), [appliedDiscount]);
    const total = useMemo(
        () => Math.max(subtotal + SHIPPING_AMOUNT - discountValue, 0),
        [subtotal, discountValue]
    );

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const checkoutCancelled = searchParams.get('checkout') === 'cancelled';

        if (checkoutCancelled) {
            setCheckoutState({
                type: 'cancelled',
                message: 'Płatność została przerwana. Koszyk i dane dostawy nadal czekają na Ciebie.'
            });
            return;
        }

        if (!sessionId || !user) return;

        let isActive = true;
        let pollTimer = null;

        const verifyCheckout = async (attempt = 0) => {
            if (!isActive) return;

            setCheckoutState({
                type: 'verifying',
                message: 'Potwierdzamy płatność i finalizujemy zamówienie.'
            });

            try {
                const response = await fetch(
                    `${API_BASE}/api/stripe/checkout-session/${sessionId}/status`,
                    {
                        credentials: 'include'
                    }
                );

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Nie udało się potwierdzić płatności');
                }

                if (data.paymentStatus === 'paid') {
                    if (!didClearCartRef.current) {
                        didClearCartRef.current = true;
                        const trackedPurchaseKey = `purchase:${sessionId}`;
                        if (!window.sessionStorage.getItem(trackedPurchaseKey)) {
                            trackEvent('purchase', {
                                sessionId,
                                orderId: data.orderId || null,
                                value: total,
                                currency: 'PLN',
                                itemCount: cart.length
                            });
                            window.sessionStorage.setItem(trackedPurchaseKey, '1');
                        }
                        await clearCart();
                    }

                    setCheckoutState({
                        type: 'paid',
                        message: 'Płatność zakończyła się sukcesem. Zamówienie trafiło już do panelu klienta.'
                    });

                    pollTimer = window.setTimeout(() => navigate('/dashboard'), 2500);
                    return;
                }

                if (data.checkoutStatus === 'expired') {
                    setCheckoutState({
                        type: 'expired',
                        message: 'Sesja płatności wygasła. Stock został zwolniony, możesz rozpocząć checkout ponownie.'
                    });
                    return;
                }

                if (attempt < 5) {
                    pollTimer = window.setTimeout(() => verifyCheckout(attempt + 1), 2000);
                    return;
                }

                setCheckoutState({
                    type: 'pending',
                    message: 'Płatność została przyjęta, ale webhook jeszcze kończy synchronizację. Sprawdź panel klienta za kilka sekund.'
                });
            } catch (error) {
                setCheckoutState({
                    type: 'error',
                    message: error.message || 'Nie udało się potwierdzić płatności.'
                });
            }
        };

        verifyCheckout();

        return () => {
            isActive = false;
            if (pollTimer) window.clearTimeout(pollTimer);
        };
    }, [searchParams, user, clearCart, navigate, total, cart.length]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        if (errors[name]) {
            setErrors((current) => ({ ...current, [name]: null }));
        }
    };

    const validateShipping = () => {
        const nextErrors = {};

        if (!formData.fullName.trim()) nextErrors.fullName = 'Imię i nazwisko jest wymagane';
        if (!formData.email.trim()) {
            nextErrors.email = 'Adres e-mail jest wymagany';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nextErrors.email = 'Wpisz poprawny adres e-mail';
        }
        if (!formData.country.trim()) nextErrors.country = 'Kraj jest wymagany';
        if (!formData.city.trim()) nextErrors.city = 'Miasto jest wymagane';
        if (!formData.postal_code.trim()) {
            nextErrors.postal_code = 'Kod pocztowy jest wymagany';
        } else if (!/^\d{2}-\d{3}$/.test(formData.postal_code)) {
            nextErrors.postal_code = 'Użyj formatu 00-000';
        }
        if (!formData.street.trim()) nextErrors.street = 'Ulica jest wymagana';
        if (!formData.house_number.trim()) nextErrors.house_number = 'Numer domu jest wymagany';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNextStep = () => {
        if (!validateShipping()) return;
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartCheckout = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            setCheckoutState({
                type: 'error',
                message: 'Koszyk jest pusty. Dodaj produkty przed przejściem do płatności.'
            });
            return;
        }

        if (!validateShipping()) {
            setStep(1);
            return;
        }

        if (!isAgreed) {
            setCheckoutState({
                type: 'error',
                message: 'Musisz potwierdzić pełnoletność oraz akceptację zasad wydania żywych zwierząt opisanych w regulaminie.'
            });
            return;
        }

        setCheckoutState({ type: 'idle', message: '' });
        setIsSubmitting(true);
        trackEvent('begin_checkout', {
            value: total,
            currency: 'PLN',
            itemCount: cart.length,
            discountApplied: Boolean(appliedDiscount)
        });

        try {
            const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.id,
                    items: cart.map((item) => ({
                        productId: item.id || item.productId,
                        quantity: item.quantity
                    })),
                    shipping: formData,
                    discountCode: appliedDiscount?.code || null
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Nie udało się rozpocząć płatności Stripe');
            }

            if (!data.url) {
                throw new Error('Stripe nie zwrócił adresu sesji płatności');
            }

            window.location.assign(data.url);
        } catch (error) {
            setCheckoutState({
                type: 'error',
                message: error.message || 'Wystąpił błąd podczas uruchamiania płatności.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCheckoutStatus = () => {
        if (checkoutState.type === 'idle') return null;

        const isSuccess = checkoutState.type === 'paid';
        const isWarning = ['cancelled', 'expired', 'pending'].includes(checkoutState.type);
        const icon = isSuccess
            ? <Check className="text-black" size={28} />
            : checkoutState.type === 'verifying'
                ? <LoaderCircle className="animate-spin text-primary" size={28} />
                : <AlertCircle className={isWarning ? 'text-yellow-400' : 'text-red-400'} size={28} />;

        return (
            <div className={`mb-8 rounded-2xl border p-5 ${isSuccess
                ? 'border-green-500/30 bg-green-500/10'
                : isWarning
                    ? 'border-yellow-500/20 bg-yellow-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}>
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isSuccess ? 'bg-green-500 text-black' : 'bg-black/30'}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="mb-1 text-lg font-bold">
                            {isSuccess && 'Płatność zakończona'}
                            {checkoutState.type === 'verifying' && 'Finalizujemy zamówienie'}
                            {checkoutState.type === 'pending' && 'Synchronizacja w toku'}
                            {checkoutState.type === 'cancelled' && 'Płatność przerwana'}
                            {checkoutState.type === 'expired' && 'Sesja wygasła'}
                            {checkoutState.type === 'error' && 'Nie udało się dokończyć checkoutu'}
                        </h2>
                        <p className="text-sm text-gray-200">{checkoutState.message}</p>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        }
    }, [loading, navigate, user]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center px-6 py-12 text-center">
                <div className="text-sm text-gray-400">Ładowanie checkoutu...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen px-6 py-12">
            <div className="mx-auto max-w-5xl">
                {renderCheckoutStatus()}

                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Bezpieczna kasa</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Finalizacja zamówienia odbywa się w Stripe Checkout. Dane karty wpisujesz wyłącznie w infrastrukturze Stripe.
                        </p>
                    </div>
                    <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 md:block">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <ShieldCheck size={16} /> Stripe + HTTPS
                        </div>
                        <div className="mt-1 text-xs text-gray-400">Platnosc przebiega na zabezpieczonej stronie Stripe.</div>
                    </div>
                </div>

                <div className="flex flex-col gap-12 lg:flex-row">
                    <div className="flex-1">
                        <div className="mb-8 flex items-center gap-4">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${step === 1 ? 'bg-primary text-black' : 'bg-gray-800 text-gray-500'}`}>1</div>
                            <h2 className={`text-xl font-bold ${step === 1 ? 'text-white' : 'text-gray-500'}`}>Dane dostawy</h2>
                        </div>

                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InputField name="fullName" placeholder="Imię i nazwisko" formData={formData} handleChange={handleChange} errors={errors} />
                                    <InputField name="email" placeholder="Adres e-mail" formData={formData} handleChange={handleChange} errors={errors} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InputField name="country" placeholder="Kraj" formData={formData} handleChange={handleChange} errors={errors} />
                                    <InputField name="city" placeholder="Miasto" formData={formData} handleChange={handleChange} errors={errors} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InputField name="postal_code" placeholder="Kod pocztowy (00-000)" formData={formData} handleChange={handleChange} errors={errors} />
                                    <InputField name="street" placeholder="Ulica" formData={formData} handleChange={handleChange} errors={errors} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InputField name="house_number" placeholder="Numer domu" formData={formData} handleChange={handleChange} errors={errors} />
                                    <InputField name="apartment_number" placeholder="Numer lokalu (opcjonalnie)" formData={formData} handleChange={handleChange} errors={errors} />
                                </div>

                                <button
                                    onClick={handleNextStep}
                                    className="mt-6 w-full rounded-xl bg-primary py-4 font-bold text-black transition-colors hover:bg-white"
                                >
                                    Przejdź do płatności
                                </button>
                            </motion.div>
                        )}

                        <div className="mb-8 mt-8 flex items-center gap-4">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${step === 2 ? 'bg-primary text-black' : 'bg-gray-800 text-gray-500'}`}>2</div>
                            <h2 className={`text-xl font-bold ${step === 2 ? 'text-white' : 'text-gray-500'}`}>Płatność</h2>
                        </div>

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="rounded-2xl border border-primary/30 bg-white/5 p-5">
                                    <div className="flex items-center gap-3 text-lg font-bold">
                                        <CreditCard className="text-primary" />
                                        Bezpieczna płatność w Stripe Checkout
                                    </div>
                                    <p className="mt-2 text-sm text-gray-400">
                                        Po kliknięciu przycisku przejdziesz do hostowanej strony Stripe, gdzie opłacisz zamówienie kartą lub inną metodą aktywną na koncie.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Kod rabatowy</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={promoCode}
                                            onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                                            disabled={Boolean(appliedDiscount)}
                                            placeholder="Wpisz kod"
                                            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none transition-colors focus:border-primary disabled:opacity-50"
                                        />
                                        {appliedDiscount ? (
                                            <button
                                                onClick={() => {
                                                    removeDiscount();
                                                    setPromoCode('');
                                                }}
                                                className="rounded-lg bg-red-500/20 px-4 font-bold text-red-400 transition-colors hover:bg-red-500/30"
                                            >
                                                Usuń
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    setPromoLoading(true);
                                                    setPromoError(null);
                                                const result = await applyDiscount(promoCode);
                                                setPromoLoading(false);
                                                if (!result.success) {
                                                    setPromoError(result.error);
                                                } else {
                                                    trackEvent('apply_discount_code', {
                                                        code: result.discount.code,
                                                        amount: result.discount.amount / 100
                                                    });
                                                }
                                            }}
                                                disabled={!promoCode || promoLoading}
                                                className="rounded-lg bg-white/10 px-4 font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                                            >
                                                {promoLoading ? '...' : 'Zastosuj'}
                                            </button>
                                        )}
                                    </div>
                                    {promoError && <div className="mt-2 text-xs font-bold text-red-500">{promoError}</div>}
                                    {appliedDiscount && (
                                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-green-500">
                                            <Check size={12} />
                                            Kod {appliedDiscount.code} aktywny (-{discountValue.toFixed(2)} zł)
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <div className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${!isAgreed && isSubmitting ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-black/20'}`}>
                                        <input
                                            type="checkbox"
                                            id="checkoutAge"
                                            checked={isAgreed}
                                            onChange={(event) => setIsAgreed(event.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="checkoutAge" className="cursor-pointer text-sm leading-relaxed text-gray-300">
                                            <span className="font-bold text-red-400">[Wymagane]</span> Oświadczam, że mam ukończone 18 lat oraz że (jeśli zamówienie obejmuje żywe zwierzęta) akceptuję zasady ich wydania i transportu opisane w Regulaminie.
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="rounded-xl border border-white/10 px-6 py-4 font-bold text-gray-300 transition-colors hover:bg-white/5"
                                    >
                                        Wróć do danych
                                    </button>
                                    <button
                                        onClick={handleStartCheckout}
                                        disabled={!isAgreed || isSubmitting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoaderCircle size={18} className="animate-spin" />
                                                Przekierowanie do Stripe...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={18} />
                                                Przejdź do Stripe Checkout
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck size={14} />
                                    Bezpieczne szyfrowane polaczenie
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="w-full lg:w-96">
                        <div className="glass sticky top-24 rounded-2xl border border-white/5 p-6">
                            <h3 className="mb-4 text-lg font-bold">Podsumowanie zamówienia</h3>

                            <div className="max-h-80 space-y-4 overflow-y-auto pr-2">
                                {cart.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-gray-400">
                                        Koszyk jest pusty. Dodaj produkty, aby rozpocząć checkout.
                                    </div>
                                )}

                                {cart.map((item) => (
                                    <div key={item.id || item.productId} className="flex gap-4 text-sm">
                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                                            <img
                                                src={item.image_urls?.[0] || item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-bold">{item.name}</div>
                                            <div className="text-gray-400">Ilość: {item.quantity}</div>
                                        </div>
                                        <div className="font-bold">{(item.price * item.quantity).toFixed(2)} zł</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                                <SummaryRow label="Suma częściowa" value={`${subtotal.toFixed(2)} zł`} />
                                <SummaryRow
                                    label={
                                        <span className="flex items-center gap-2">
                                            <Truck size={14} />
                                            Dostawa kurierska
                                        </span>
                                    }
                                    value={`${SHIPPING_AMOUNT.toFixed(2)} zł`}
                                />
                                {appliedDiscount && (
                                    <SummaryRow
                                        label="Rabat"
                                        value={`-${discountValue.toFixed(2)} zł`}
                                        valueClassName="text-green-500"
                                    />
                                )}
                                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xl font-bold text-primary">
                                    <span>Razem</span>
                                    <span>{total.toFixed(2)} zł</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ name, placeholder, formData, handleChange, errors }) => (
    <div>
        <input
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full rounded-xl border p-3 outline-none transition-colors focus:ring-1 ${errors[name]
                ? 'border-red-500 bg-red-500/5 focus:border-red-500 focus:ring-red-500'
                : 'border-white/10 bg-white/5 focus:border-primary focus:ring-primary'
                }`}
        />
        {errors[name] && (
            <p className="mt-1 ml-1 text-xs font-semibold text-red-500">{errors[name]}</p>
        )}
    </div>
);

const SummaryRow = ({ label, value, valueClassName = '' }) => (
    <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={valueClassName}>{value}</span>
    </div>
);

export default Checkout;
