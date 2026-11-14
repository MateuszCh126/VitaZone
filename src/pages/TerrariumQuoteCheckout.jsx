import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';

const emptyAddress = {
  fullName: '', email: '', country: 'Polska', city: '', postal_code: '',
  street: '', house_number: '', apartment_number: ''
};

const money = (cents) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format((cents || 0) / 100);

export default function TerrariumQuoteCheckout() {
  const { projectId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: `/terrarium/checkout/${projectId}` } });
      return;
    }

    let active = true;
    const loadProject = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/terrarium/projects/${projectId}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać oferty.');
        if (active) setProject(data);
      } catch (error) {
        if (active) {
          setMessage(error.message || 'Nie udało się pobrać oferty.');
          setHasError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadProject();
    return () => { active = false; };
  }, [authLoading, navigate, projectId, user]);

  useEffect(() => {
    if (!user) return;
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || user.full_name || user.name || '',
      email: current.email || user.email || '',
      country: current.country || user.country || 'Polska',
      city: current.city || user.city || '',
      postal_code: current.postal_code || user.postalCode || '',
      street: current.street || user.street || '',
      house_number: current.house_number || user.houseNumber || '',
      apartment_number: current.apartment_number || user.apartmentNumber || ''
    }));
  }, [user]);

  const quote = project?.quote || project?.quote_json;
  const isExpired = project?.quote_expires_at && new Date(project.quote_expires_at) <= new Date();
  const productTotal = quote?.totalCents || project?.quote_total_cents || 0;
  const shippingTotal = project?.shippingAmountCents || 0;
  const paymentTotal = productTotal + shippingTotal;
  const canPay = ['quoted', 'accepted', 'payment_pending'].includes(project?.status) && !isExpired;

  const statusLabel = useMemo(() => ({
    quoted: 'Oferta czeka na akceptację',
    accepted: 'Oferta zaakceptowana',
    payment_pending: 'Płatność rozpoczęta',
    paid: 'Opłacony',
    expired: 'Oferta wygasła',
    closed: 'Projekt zamknięty'
  }[project?.status] || 'Projekt sprawdzany przez sklep'), [project?.status]);

  const updateAddress = (event) => setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));

  const startPayment = async (event) => {
    event.preventDefault();
    setMessage('');
    setHasError(false);
    if (!canPay) return;
    if (project.status === 'quoted' && !accepted) {
      setMessage('Zaznacz akceptację oferty, aby przejść do płatności.');
      setHasError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (project.status === 'quoted') {
        const acceptResponse = await fetch(`${API_BASE}/api/terrarium/projects/${project.id}/accept`, {
          method: 'POST',
          credentials: 'include'
        });
        const acceptedProject = await acceptResponse.json();
        if (!acceptResponse.ok) throw new Error(acceptedProject.error || 'Nie udało się zaakceptować oferty.');
        setProject(acceptedProject);
      }

      const response = await fetch(`${API_BASE}/api/stripe/terrarium/projects/${project.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(address)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się rozpocząć płatności.');
      if (!data.url) throw new Error('Stripe nie zwrócił adresu płatności.');
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error.message || 'Nie udało się rozpocząć płatności.');
      setHasError(true);
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-white/60"><LoaderCircle className="mr-3 animate-spin" size={18} /> Ładujemy ofertę…</div>;
  }

  if (!project) {
    return <div className="mx-auto min-h-[70vh] max-w-3xl px-6 py-24 text-center"><h1 className="text-3xl font-semibold">Nie znaleziono oferty</h1><p role="alert" className="mt-3 text-sm text-red-300">{message}</p><Link className="mt-6 inline-block text-primary hover:text-white" to="/dashboard">Wróć do panelu klienta</Link></div>;
  }

  const wasCancelled = searchParams.get('checkout') === 'cancelled';

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#080e0a] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs text-white/50 hover:text-primary"><ArrowLeft size={14} /> Projekty terrarium</Link>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <section>
            <p className="text-xs text-primary">{statusLabel}</p>
            <h1 className="mt-2 text-3xl font-semibold">Oferta na terrarium</h1>
            <p className="mt-2 text-sm text-white/55">Projekt #{project.id.slice(0, 8).toUpperCase()} · oferta ważna do {project.quote_expires_at ? new Date(project.quote_expires_at).toLocaleDateString('pl-PL') : 'odwołania'}.</p>

            {wasCancelled && <div className="mt-5 border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Płatność została przerwana. Oferta nadal jest dostępna do opłacenia.</div>}
            {isExpired && <div className="mt-5 border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Oferta wygasła. Skontaktuj się ze sklepem, aby przygotować aktualną.</div>}
            {project.quote_message && <div className="mt-5 border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/70">{project.quote_message}</div>}

            <form onSubmit={startPayment} className="mt-8 space-y-4">
              <h2 className="text-lg font-medium">Adres dostawy</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <AddressField label="Imię i nazwisko" name="fullName" value={address.fullName} onChange={updateAddress} autoComplete="name" required />
                <AddressField label="E-mail" name="email" type="email" value={address.email} onChange={updateAddress} autoComplete="email" required />
                <AddressField label="Kraj" name="country" value={address.country} onChange={updateAddress} autoComplete="country-name" required />
                <AddressField label="Miasto" name="city" value={address.city} onChange={updateAddress} autoComplete="address-level2" required />
                <AddressField label="Kod pocztowy" name="postal_code" value={address.postal_code} onChange={updateAddress} autoComplete="postal-code" required />
                <AddressField label="Ulica" name="street" value={address.street} onChange={updateAddress} autoComplete="address-line1" required />
                <AddressField label="Numer domu" name="house_number" value={address.house_number} onChange={updateAddress} required />
                <AddressField label="Numer lokalu (opcjonalnie)" name="apartment_number" value={address.apartment_number} onChange={updateAddress} />
              </div>

              {project.status === 'quoted' && (
                <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-white/[0.03] p-4 text-sm leading-5 text-white/75">
                  <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-emerald-400" />
                  <span>Akceptuję przedstawioną ofertę oraz ceny poszczególnych produktów.</span>
                </label>
              )}
              {message && <p role={hasError ? 'alert' : 'status'} className={`text-sm ${hasError ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p>}
              <button type="submit" disabled={!canPay || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                {isSubmitting ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                {project.status === 'payment_pending' ? 'Wróć do bezpiecznej płatności' : 'Akceptuję ofertę i przechodzę do płatności'}
              </button>
            </form>
          </section>

          <aside className="h-fit border border-white/[0.08] bg-[#0d1510] p-5 lg:sticky lg:top-24">
            <h2 className="font-semibold">Podsumowanie oferty</h2>
            <div className="mt-4 space-y-3">
              {quote?.items?.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <span className="text-white/65">{item.quantity} × {item.name}</span>
                  <span className="shrink-0">{money(item.lineTotalCents)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-white/55">Produkty</span><span>{money(productTotal)}</span></div>
              <div className="flex justify-between"><span className="inline-flex items-center gap-2 text-white/55"><Truck size={15} /> Dostawa</span><span>{money(shippingTotal)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold"><span>Razem do zapłaty</span><span className="text-primary">{money(paymentTotal)}</span></div>
            </div>
            <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-white/40"><Check size={14} className="mt-0.5 shrink-0 text-primary" /> Ceny zaakceptowanej oferty są zapisane dla tego zamówienia. Płatność obsługuje Stripe.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function AddressField({ label, type = 'text', ...props }) {
  return (
    <label className="block text-xs text-white/55">
      {label}
      <input {...props} type={type} className="mt-1.5 w-full rounded border border-white/10 bg-[#111a14] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary/70" />
    </label>
  );
}
