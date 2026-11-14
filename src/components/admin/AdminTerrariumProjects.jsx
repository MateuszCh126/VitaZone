import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircleCheck, Clock3, LoaderCircle, Send } from 'lucide-react';
import { API_BASE } from '../../utils/config';

const TerrariumScene = lazy(() => import('../terrarium/TerrariumScene.jsx'));
const money = (cents) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format((cents || 0) / 100);

export default function AdminTerrariumProjects() {
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('project');
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedId);
  const [project, setProject] = useState(null);
  const [unitPrices, setUnitPrices] = useState({});
  const [validForDays, setValidForDays] = useState(7);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    const response = await fetch(`${API_BASE}/api/admin/terrarium/projects`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać zgłoszeń.');
    setProjects(data);
    return data;
  };

  const loadProject = async (id) => {
    setSelectedId(id);
    setProject(null);
    setIsDetailLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/terrarium/projects/${id}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się wczytać projektu.');
      setProject(data);
      const savedPrices = Object.fromEntries((data.quote?.items || []).map((item) => [item.productId, (item.unitPriceCents / 100).toFixed(2)]));
      const estimatePrices = Object.fromEntries((data.estimate?.items || []).map((item) => [item.productId, (item.unitPriceCents / 100).toFixed(2)]));
      setUnitPrices({ ...estimatePrices, ...savedPrices });
      setValidForDays(7);
      setMessage(data.quote_message || '');
    } catch (fetchError) {
      setError(fetchError.message || 'Nie udało się wczytać projektu.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadProjects()
      .then(async (data) => {
        if (!active) return;
        const nextId = requestedId && data.some((item) => item.id === requestedId)
          ? requestedId
          : (data.find((item) => item.status === 'submitted') || data[0])?.id;
        if (nextId) await loadProject(nextId);
      })
      .catch((fetchError) => { if (active) setError(fetchError.message || 'Nie udało się pobrać zgłoszeń.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [requestedId]);

  const submitQuote = async (event) => {
    event.preventDefault();
    if (!project) return;
    setIsSaving(true);
    setError('');
    try {
      const items = (project.estimate?.items || []).map((item) => ({
        productId: item.productId,
        unitPriceCents: Math.round(Number(unitPrices[item.productId]) * 100)
      }));
      const response = await fetch(`${API_BASE}/api/admin/terrarium/projects/${project.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, validForDays: Number(validForDays), message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się zapisać oferty.');
      await loadProject(data.id);
      await loadProjects();
    } catch (saveError) {
      setError(saveError.message || 'Nie udało się zapisać oferty.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex min-h-[300px] items-center justify-center text-sm text-white/50"><LoaderCircle className="mr-2 animate-spin" size={17} /> Ładujemy zgłoszenia…</div>;

  return (
    <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border border-white/10 bg-black/20">
        <div className="border-b border-white/10 p-4">
          <h2 className="font-semibold">Projekty klientów</h2>
          <p className="mt-1 text-xs text-white/45">{projects.filter((item) => item.status === 'submitted').length} czeka na sprawdzenie</p>
        </div>
        {projects.length === 0 ? <p className="p-4 text-sm text-white/45">Brak zgłoszeń.</p> : projects.map((item) => (
          <button key={item.id} type="button" onClick={() => loadProject(item.id)} className={`block w-full border-b border-white/[0.07] p-4 text-left transition-colors ${selectedId === item.id ? 'bg-primary/10' : 'hover:bg-white/[0.035]'}`}>
            <span className="block truncate text-sm font-medium text-white">{item.customer_name || item.customer_email || 'Klient'}</span>
            <span className="mt-1 block text-[11px] text-white/45">#{item.id.slice(0, 8).toUpperCase()} · {new Date(item.created_at).toLocaleDateString('pl-PL')}</span>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[11px] ${item.status === 'submitted' ? 'text-amber-200' : item.status === 'quoted' ? 'text-primary' : 'text-white/45'}`}>
              {item.status === 'submitted' ? <Clock3 size={13} /> : <CircleCheck size={13} />}
              {item.status === 'submitted' ? 'Do sprawdzenia' : item.status === 'quoted' ? 'Oferta wysłana' : item.status}
            </span>
          </button>
        ))}
      </aside>

      <div className="min-w-0">
        {error && <p role="alert" className="mb-4 border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
        {isDetailLoading ? (
          <div className="flex min-h-[420px] items-center justify-center text-sm text-white/50"><LoaderCircle className="mr-2 animate-spin" size={17} /> Ładujemy projekt…</div>
        ) : !project ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center border border-dashed border-white/10 text-center text-white/45"><Box size={22} /><p className="mt-3 text-sm">Wybierz projekt do sprawdzenia.</p></div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-white/45">#{project.id.slice(0, 8).toUpperCase()} · {project.customer_email}</p>
                <h2 className="mt-1 text-2xl font-semibold">{project.customer_name || 'Projekt terrarium'}</h2>
              </div>
              <span className="text-xs text-white/50">Wysłano {new Date(project.created_at).toLocaleString('pl-PL')}</span>
            </div>

            <Suspense fallback={<div className="flex h-[440px] items-center justify-center border border-white/10 text-sm text-white/45"><LoaderCircle className="mr-2 animate-spin" size={17} /> Ładujemy scenę 3D…</div>}>
              <TerrariumScene
                enclosure={project.products.find((item) => item.id === project.configuration.enclosureProductId)}
                products={project.products}
                objects={project.configuration.objects}
                readOnly
                className="h-[440px] min-h-[340px]"
              />
            </Suspense>

            <form onSubmit={submitQuote} className="border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end">
                <div>
                  <h3 className="font-semibold">Oferta końcowa</h3>
                  <p className="mt-1 text-xs text-white/45">Zmieniaj ceny pozycji SKU. Suma jest liczona z produktów; nie ma osobnej dopłaty za wykonanie.</p>
                </div>
                <label className="text-xs text-white/55">Ważna przez
                  <select value={validForDays} onChange={(event) => setValidForDays(event.target.value)} className="ml-2 rounded border border-white/10 bg-[#111a14] px-2 py-2 text-white">
                    {[3, 7, 14, 30].map((days) => <option key={days} value={days}>{days} dni</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-3">
                {(project.estimate?.items || []).map((item) => (
                  <label key={item.productId} className="grid grid-cols-[minmax(0,1fr)_70px_125px] items-center gap-3 border-b border-white/[0.06] py-3 text-xs">
                    <span className="min-w-0"><span className="block truncate text-white/80">{item.name}</span><span className="mt-1 block text-white/40">{item.quantity} szt. · cena orientacyjna {money(item.unitPriceCents)}</span></span>
                    <span className="text-right text-white/40">Cena / szt.</span>
                    <span className="relative"><input aria-label={`Cena końcowa za sztukę: ${item.name}`} type="number" min="0.01" step="0.01" required value={unitPrices[item.productId] ?? ''} onChange={(event) => setUnitPrices((current) => ({ ...current, [item.productId]: event.target.value }))} className="w-full rounded border border-white/10 bg-[#111a14] py-2 pl-2 pr-8 text-right text-white outline-none focus:border-primary" /><span className="absolute right-2 top-2 text-white/40">zł</span></span>
                  </label>
                ))}
              </div>

              <label className="mt-4 block text-xs text-white/55">Wiadomość do klienta (opcjonalnie)
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full resize-y rounded border border-white/10 bg-[#111a14] p-3 text-sm text-white outline-none focus:border-primary" placeholder="Uwagi do realizacji lub oferty" />
              </label>

              {(() => {
                const total = (project.estimate?.items || []).reduce((sum, item) => sum + Math.round(Number(unitPrices[item.productId]) * 100) * item.quantity, 0);
                return <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-white/55">Suma produktów <strong className="ml-2 text-xl text-primary">{money(total)}</strong></p><button type="submit" disabled={isSaving || !['submitted', 'quoted'].includes(project.status)} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-black hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">{isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={15} />}{project.status === 'quoted' ? 'Zaktualizuj ofertę' : 'Wyślij ofertę klientowi'}</button></div>;
              })()}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
