import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, ChevronDown, ChevronUp, CircleCheck, Clock3, Eye, LoaderCircle } from 'lucide-react';
import { API_BASE } from '../../utils/config';

const TerrariumScene = lazy(() => import('./TerrariumScene.jsx'));
const money = (cents) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format((cents || 0) / 100);

const statusInfo = {
  submitted: { label: 'Oczekuje na weryfikację', tone: 'text-amber-200', icon: <Clock3 size={15} /> },
  quoted: { label: 'Oferta do akceptacji', tone: 'text-primary', icon: <CircleCheck size={15} /> },
  accepted: { label: 'Oferta zaakceptowana', tone: 'text-sky-200', icon: <CircleCheck size={15} /> },
  payment_pending: { label: 'Oczekuje na płatność', tone: 'text-amber-200', icon: <Clock3 size={15} /> },
  paid: { label: 'Opłacony', tone: 'text-emerald-300', icon: <CircleCheck size={15} /> },
  expired: { label: 'Oferta wygasła', tone: 'text-white/45', icon: <Clock3 size={15} /> },
  closed: { label: 'Zamknięty', tone: 'text-white/45', icon: <Box size={15} /> }
};

export default function TerrariumProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/terrarium/projects`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać projektów.');
        return data;
      })
      .then((data) => { if (active) setProjects(data); })
      .catch((fetchError) => { if (active) setError(fetchError.message || 'Nie udało się pobrać projektów.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggleDetails = async (projectId) => {
    if (selectedId === projectId) {
      setSelectedId(null);
      setDetails(null);
      return;
    }
    setSelectedId(projectId);
    setDetails(null);
    try {
      const response = await fetch(`${API_BASE}/api/terrarium/projects/${projectId}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się wczytać podglądu.');
      setDetails(data);
    } catch (fetchError) {
      setError(fetchError.message || 'Nie udało się wczytać podglądu.');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-white/55"><LoaderCircle className="mr-3 animate-spin" size={18} /> Ładujemy projekty…</div>;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white">Projekty terrarium</h2>
          <p className="mt-1 text-sm text-white/50">Wysłane konfiguracje, status weryfikacji i zaakceptowane oferty.</p>
        </div>
        <Link to="/terrarium" className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-black hover:bg-white"><Box size={16} /> Stwórz projekt</Link>
      </div>

      {error && <p role="alert" className="border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
      {projects.length === 0 ? (
        <div className="border border-dashed border-white/15 px-6 py-14 text-center">
          <Box className="mx-auto text-primary/80" size={25} />
          <h3 className="mt-4 font-medium">Nie masz jeszcze projektu terrarium</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Ułóż produkty w konfiguratorze i wyślij projekt do sprawdzenia przez sklep.</p>
          <Link to="/terrarium" className="mt-5 inline-block text-sm font-medium text-primary hover:text-white">Otwórz konfigurator</Link>
        </div>
      ) : projects.map((project) => {
        const info = statusInfo[project.status] || statusInfo.submitted;
        const total = project.quote_total_cents || project.estimate_total_cents;
        const canCheckout = ['quoted', 'accepted', 'payment_pending'].includes(project.status);
        return (
          <article key={project.id} className="border border-white/[0.08] bg-white/[0.02]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] text-white/40">Projekt #{project.id.slice(0, 8).toUpperCase()} · {new Date(project.created_at).toLocaleDateString('pl-PL')}</p>
                <p className={`mt-2 flex items-center gap-2 text-sm font-medium ${info.tone}`}>{info.icon}{info.label}</p>
                <p className="mt-1 text-xs text-white/45">{project.quote_total_cents ? 'Oferta końcowa' : 'Wycena orientacyjna'}: {money(total)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => toggleDetails(project.id)} className="inline-flex items-center gap-2 rounded border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-primary/40 hover:text-white">
                  <Eye size={14} /> Podgląd projektu {selectedId === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {canCheckout && <Link to={`/terrarium/checkout/${project.id}`} className="rounded bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-white">{project.status === 'quoted' ? 'Sprawdź ofertę' : 'Przejdź do płatności'}</Link>}
              </div>
            </div>

            {selectedId === project.id && (
              <div className="grid gap-4 border-t border-white/[0.08] p-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                {details ? (
                  <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center text-sm text-white/50"><LoaderCircle className="mr-2 animate-spin" size={16} /> Ładujemy scenę…</div>}>
                    <TerrariumScene
                      enclosure={details.products.find((item) => item.id === details.configuration.enclosureProductId)}
                      products={details.products}
                      objects={details.configuration.objects}
                      readOnly
                      className="min-h-[300px]"
                    />
                  </Suspense>
                ) : <div className="flex min-h-[300px] items-center justify-center text-sm text-white/50"><LoaderCircle className="mr-2 animate-spin" size={16} /> Wczytujemy projekt…</div>}
                <div>
                  <h3 className="font-medium">Pozycje w projekcie</h3>
                  {(details?.estimate?.items || project.estimate?.items || []).map((item) => (
                    <div key={item.productId} className="flex justify-between gap-3 border-b border-white/[0.07] py-2 text-xs">
                      <span className="text-white/55">{item.quantity} × {item.name}</span>
                      <span>{money(item.lineTotalCents)}</span>
                    </div>
                  ))}
                  <p className="mt-4 text-[11px] leading-5 text-white/40">Projekt przechowuje rozmieszczenie w milimetrach oraz identyfikatory produktów.</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
