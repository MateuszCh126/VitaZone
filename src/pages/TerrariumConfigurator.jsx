import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  Info,
  Leaf,
  LoaderCircle,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';
import { normalizePlacement } from '../../shared/terrarium.js';
import { terrariumDemoCatalog } from '../data/terrariumDemoCatalog.js';
import TerrariumScene from '../components/terrarium/TerrariumScene.jsx';

const currency = (cents) => new Intl.NumberFormat('pl-PL', {
  style: 'currency', currency: 'PLN'
}).format(cents / 100);

const productConfig = (product) => product?.specs?.terrariumDesigner;
const vector = (x = 0, y = 0, z = 0) => ({ x, y, z });

const makeConfiguration = (enclosure, objects) => ({
  version: 1,
  enclosureProductId: enclosure?.id || '',
  objects
});

const getSavedDraft = () => {
  try {
    const stored = window.sessionStorage.getItem('terrarium-builder-draft');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const formatDimensions = (dimensions) => `${dimensions.width} × ${dimensions.height} × ${dimensions.depth} mm`;

function ProductRow({ product, onAdd, disabled }) {
  const dimensions = productConfig(product).dimensionsMm;
  return (
    <div className="group flex items-center gap-3 border-b border-white/[0.07] py-3 last:border-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#18241b] text-[#92b89a]">
        {product.demoKind === 'fern' ? <Leaf size={20} /> : <Box size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-[#e7ede7]">{product.name}</h3>
        <p className="mt-1 text-[11px] text-white/45">{formatDimensions(dimensions)}</p>
        <p className="mt-1 text-xs font-semibold text-[#9fd7b0]">{currency(product.price_cents)}</p>
      </div>
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/70 transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Dodaj ${product.name}`}
      >
        <Plus size={17} />
      </button>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="flex gap-3 border border-[#ac8a52]/30 bg-[#4a3a20]/20 px-4 py-3 text-sm text-[#e9d9b6]">
      <Info className="mt-0.5 shrink-0 text-[#d4b276]" size={17} />
      <p><strong className="font-semibold">Podgląd demonstracyjny.</strong> Nazwy, modele i ceny są przykładowe. Nie są ofertą sklepu ani nie można wysłać z nich zamówienia.</p>
    </div>
  );
}

export default function TerrariumConfigurator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const savedDraft = useMemo(getSavedDraft, []);
  const [catalog, setCatalog] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [catalogState, setCatalogState] = useState('loading');
  const [catalogMessage, setCatalogMessage] = useState('');
  const [enclosureId, setEnclosureId] = useState(savedDraft?.enclosureProductId || '');
  const [objects, setObjects] = useState(savedDraft?.objects || []);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('translate');
  const [activeGroup, setActiveGroup] = useState('plants');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectMessage, setProjectMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/terrarium/catalog`);
        if (!response.ok) throw new Error('Nie udało się wczytać produktów konfiguratora.');
        const data = await response.json();
        if (!active) return;
        if (Array.isArray(data.products) && data.products.length > 0) {
          setCatalog(data.products);
          setIsDemo(false);
          setCatalogState('ready');
          return;
        }
        if (import.meta.env.DEV) {
          setCatalog(terrariumDemoCatalog);
          setIsDemo(true);
          setCatalogMessage('W sklepie nie ma jeszcze skonfigurowanych modeli SKU. Pokazujemy lokalny katalog demonstracyjny.');
          setCatalogState('ready');
          return;
        }
        setCatalog([]);
        setCatalogState('empty');
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) {
          setCatalog(terrariumDemoCatalog);
          setIsDemo(true);
          setCatalogMessage(error.message || 'Katalog jest niedostępny. Pokazujemy lokalny katalog demonstracyjny.');
          setCatalogState('ready');
          return;
        }
        setCatalogState('error');
        setCatalogMessage(error.message || 'Nie udało się połączyć z katalogiem.');
      }
    };
    loadCatalog();
    return () => { active = false; };
  }, []);

  const enclosures = useMemo(() => catalog.filter((product) => productConfig(product)?.role === 'enclosure'), [catalog]);
  const elements = useMemo(() => catalog.filter((product) => productConfig(product)?.role === 'element'), [catalog]);
  const enclosure = enclosures.find((product) => product.id === enclosureId) || enclosures[0] || null;
  const productsById = useMemo(() => new Map(catalog.map((product) => [product.id, product])), [catalog]);
  const selectedObject = objects.find((item) => item.instanceId === selectedId) || null;
  const selectedProduct = selectedObject ? productsById.get(selectedObject.productId) : null;

  useEffect(() => {
    if (enclosure && !enclosures.some((product) => product.id === enclosureId)) {
      setEnclosureId(enclosure.id);
    }
  }, [enclosure, enclosureId, enclosures]);

  useEffect(() => {
    if (!isDemo && enclosure && objects.length > 0) {
      window.sessionStorage.setItem('terrarium-builder-draft', JSON.stringify(makeConfiguration(enclosure, objects)));
    }
  }, [enclosure, isDemo, objects]);

  const estimate = useMemo(() => {
    if (!enclosure) return { items: [], totalCents: 0 };
    const quantities = new Map([[enclosure.id, 1]]);
    objects.forEach((item) => quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity));
    const items = [...quantities.entries()].flatMap(([productId, quantity]) => {
      const product = productsById.get(productId);
      if (!product) return [];
      return [{ productId, name: product.name, quantity, unitPriceCents: product.price_cents, lineTotalCents: product.price_cents * quantity }];
    });
    return { items, totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0) };
  }, [enclosure, objects, productsById]);

  const addProduct = useCallback((product) => {
    if (!enclosure) return;
    const config = productConfig(product);
    const surface = config.allowedMountSurfaces[0];
    try {
      const placement = normalizePlacement({
        positionMm: vector(),
        rotationDeg: vector(),
        surface,
        product: config,
        enclosure: productConfig(enclosure)
      });
      const item = {
        instanceId: window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productId: product.id,
        quantity: 1,
        ...placement
      };
      setObjects((current) => [...current, item]);
      setSelectedId(item.instanceId);
      setProjectMessage({ type: '', text: '' });
    } catch (error) {
      setProjectMessage({ type: 'error', text: `${product.name}: ${error.message}` });
    }
  }, [enclosure]);

  const updateObject = useCallback((instanceId, change) => {
    setObjects((current) => current.map((item) => (
      item.instanceId === instanceId ? { ...item, ...change } : item
    )));
  }, []);

  const updateSelectedPlacement = (change) => {
    if (!selectedObject || !selectedProduct || !enclosure) return;
    const next = {
      positionMm: { ...selectedObject.positionMm, ...(change.positionMm || {}) },
      rotationDeg: { ...selectedObject.rotationDeg, ...(change.rotationDeg || {}) },
      surface: change.surface || selectedObject.surface,
      product: productConfig(selectedProduct),
      enclosure: productConfig(enclosure)
    };
    try {
      updateObject(selectedObject.instanceId, normalizePlacement(next));
    } catch (error) {
      setProjectMessage({ type: 'error', text: error.message });
    }
  };

  const removeSelected = () => {
    setObjects((current) => current.filter((item) => item.instanceId !== selectedId));
    setSelectedId(null);
  };

  const submitProject = async () => {
    if (isDemo) return;
    if (!user) {
      navigate('/login', { state: { from: '/terrarium' } });
      return;
    }
    if (!enclosure || objects.length === 0) {
      setProjectMessage({ type: 'error', text: 'Dodaj przynajmniej jeden element, zanim wyślesz projekt.' });
      return;
    }
    setIsSubmitting(true);
    setProjectMessage({ type: '', text: '' });
    try {
      const response = await fetch(`${API_BASE}/api/terrarium/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(makeConfiguration(enclosure, objects))
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się wysłać projektu.');
      window.sessionStorage.removeItem('terrarium-builder-draft');
      setObjects([]);
      setProjectMessage({ type: 'success', text: 'Projekt zapisany. Znajdziesz go w panelu klienta, gdy sklep przygotuje wycenę.' });
    } catch (error) {
      setProjectMessage({ type: 'error', text: error.message || 'Nie udało się wysłać projektu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (catalogState === 'loading') {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-white/60"><LoaderCircle className="mr-3 animate-spin" size={18} /> Wczytujemy produkty do konfiguratora…</div>;
  }

  if (!enclosure) {
    return (
      <section className="mx-auto min-h-[70vh] max-w-4xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Box /></div>
        <h1 className="mt-6 text-3xl font-semibold text-white">Konfigurator czeka na produkty</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60">
          Gdy terraria i dodatki otrzymają rzeczywiste wymiary, dozwolone powierzchnie i dopasowane modele 3D, będzie można projektować ich układ tutaj.
        </p>
        {catalogState === 'error' && <p role="alert" className="mt-4 text-sm text-red-300">{catalogMessage}</p>}
        {import.meta.env.DEV && <p className="mt-5 text-xs text-white/40">Tryb demonstracyjny jest dostępny automatycznie w lokalnym środowisku deweloperskim.</p>}
      </section>
    );
  }

  const plants = elements.filter((product) => product.demoKind === 'fern' || product.species?.toLowerCase().includes('roślin'));
  const structures = elements.filter((product) => !plants.includes(product));
  const selectedEnclosureConfig = productConfig(enclosure);
  const rotationAxis = selectedObject?.surface === 'floor' || selectedObject?.surface === 'ceiling'
    ? 'y'
    : selectedObject?.surface === 'back' ? 'z' : 'x';
  const canChangeEnclosure = objects.length === 0;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#080e0a] px-4 pb-12 pt-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link to="/shop" className="mb-3 inline-flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-primary"><ArrowLeft size={14} /> Wróć do asortymentu</Link>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Urządź swoje terrarium</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Wybierz bryłę, dodaj elementy i dopasuj ich położenie do wnętrza. Wymiary zachowujemy w skali milimetrowej.</p>
          </div>
          <div className="min-w-[260px] max-w-full">
            <label htmlFor="terrarium-enclosure" className="mb-2 flex items-center gap-2 text-xs font-medium text-white/55"><Ruler size={14} /> Bryła terrarium</label>
            <div className="relative">
              <select
                id="terrarium-enclosure"
                value={enclosure.id}
                onChange={(event) => setEnclosureId(event.target.value)}
                disabled={!canChangeEnclosure}
                className="w-full appearance-none rounded-md border border-white/10 bg-[#111a14] px-3 py-3 pr-9 text-sm text-white outline-none transition-colors focus:border-primary/70 disabled:opacity-55"
              >
                {enclosures.map((option) => <option key={option.id} value={option.id}>{option.name} · {formatDimensions(productConfig(option).dimensionsMm)}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
            {!canChangeEnclosure && <p className="mt-1 text-[11px] text-white/35">Usuń elementy z projektu, aby zmienić terrarium.</p>}
          </div>
        </div>

        {isDemo && <div className="mb-4"><DemoNotice /></div>}
        {isDemo && catalogMessage && <p className="mb-4 text-xs text-[#d7c79e]/70">{catalogMessage}</p>}

        <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_310px]">
          <aside className="order-2 border border-white/[0.08] bg-[#0d1510] px-4 xl:order-1">
            <div className="flex border-b border-white/[0.08]">
              <button type="button" onClick={() => setActiveGroup('plants')} className={`flex-1 border-b-2 px-2 py-4 text-sm transition-colors ${activeGroup === 'plants' ? 'border-primary text-white' : 'border-transparent text-white/45 hover:text-white'}`}>Rośliny</button>
              <button type="button" onClick={() => setActiveGroup('structures')} className={`flex-1 border-b-2 px-2 py-4 text-sm transition-colors ${activeGroup === 'structures' ? 'border-primary text-white' : 'border-transparent text-white/45 hover:text-white'}`}>Dekoracje</button>
            </div>
            <div className="max-h-[530px] overflow-y-auto pr-1">
              {(activeGroup === 'plants' ? plants : structures).length === 0
                ? <p className="py-8 text-sm leading-6 text-white/45">Brak produktów z przypisanym modelem 3D i dozwolonym miejscem montażu.</p>
                : (activeGroup === 'plants' ? plants : structures).map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onAdd={addProduct}
                    disabled={objects.length >= 80 || objects.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0) >= product.stock}
                  />
                ))}
            </div>
            {isDemo && <p className="border-t border-white/[0.08] py-3 text-[11px] leading-5 text-white/40">Przykładowe obiekty służą tylko do sprawdzenia ruchu i skali.</p>}
          </aside>

          <section className="order-1 min-w-0 xl:order-2" aria-label="Podgląd projektu 3D">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-white/50"><Ruler size={14} /> Wnętrze {formatDimensions(selectedEnclosureConfig.innerDimensionsMm)}</div>
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#111a14] p-1">
                <button type="button" onClick={() => setMode('translate')} aria-pressed={mode === 'translate'} className={`rounded px-3 py-1.5 text-xs ${mode === 'translate' ? 'bg-primary text-black' : 'text-white/55 hover:text-white'}`}>Przesuń</button>
                <button type="button" onClick={() => setMode('rotate')} aria-pressed={mode === 'rotate'} className={`rounded px-3 py-1.5 text-xs ${mode === 'rotate' ? 'bg-primary text-black' : 'text-white/55 hover:text-white'}`}>Obróć</button>
              </div>
            </div>

            <div className="h-[390px] border border-white/[0.08] sm:h-[520px] xl:h-[min(66vh,760px)]">
              <TerrariumScene
                enclosure={enclosure}
                products={catalog}
                objects={objects}
                selectedId={selectedId}
                mode={mode}
                onSelect={setSelectedId}
                onTransform={updateObject}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border border-white/10 px-2.5 py-1.5 text-[11px] text-white/45">Podłoże</span>
              <span className="rounded border border-white/10 px-2.5 py-1.5 text-[11px] text-white/45">Tył i boki</span>
              <span className="rounded border border-white/10 px-2.5 py-1.5 text-[11px] text-white/45">Przednie drzwi wyłączone z montażu</span>
            </div>
          </section>

          <aside className="order-3 border border-white/[0.08] bg-[#0d1510] p-4 sm:p-5 xl:sticky xl:top-24 xl:h-fit">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="font-semibold">Elementy projektu</h2>
                <p className="mt-1 text-xs text-white/45">{objects.length} {objects.length === 1 ? 'obiekt' : objects.length > 1 && objects.length < 5 ? 'obiekty' : 'obiektów'}</p>
              </div>
              {selectedObject && <button type="button" onClick={removeSelected} aria-label="Usuń zaznaczony element" className="rounded p-2 text-white/45 hover:bg-red-400/10 hover:text-red-300"><Trash2 size={16} /></button>}
            </div>

            {selectedObject && selectedProduct ? (
              <div className="border-b border-white/[0.08] py-4">
                <p className="text-sm font-medium text-white">{selectedProduct.name}</p>
                <p className="mt-1 text-[11px] text-white/45">{formatDimensions(productConfig(selectedProduct).dimensionsMm)}</p>
                <label htmlFor="terrarium-surface" className="mt-4 block text-[11px] text-white/45">Dozwolona powierzchnia</label>
                <select
                  id="terrarium-surface"
                  value={selectedObject.surface}
                  onChange={(event) => updateSelectedPlacement({ surface: event.target.value })}
                  className="mt-1 w-full rounded border border-white/10 bg-[#111a14] px-2.5 py-2 text-xs text-white outline-none focus:border-primary/70"
                >
                  {productConfig(selectedProduct).allowedMountSurfaces.map((surface) => <option key={surface} value={surface}>{({ floor: 'Podłoże', back: 'Tylna ściana', left: 'Lewa ściana', right: 'Prawa ściana', ceiling: 'Sufit' })[surface]}</option>)}
                </select>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/45">Obrót co 15°</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => updateSelectedPlacement({ rotationDeg: { [rotationAxis]: selectedObject.rotationDeg[rotationAxis] - 15 } })} aria-label="Obróć w lewo" className="rounded border border-white/10 p-2 text-white/60 hover:text-primary"><RotateCcw size={15} /></button>
                    <button type="button" onClick={() => updateSelectedPlacement({ rotationDeg: { [rotationAxis]: selectedObject.rotationDeg[rotationAxis] + 15 } })} aria-label="Obróć w prawo" className="rounded border border-white/10 p-2 text-white/60 hover:text-primary"><RotateCw size={15} /></button>
                  </div>
                </div>
                {mode === 'translate' && (
                  <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Przesuń wybrany element">
                    <span />
                    <MoveButton label="Przesuń do tyłu" icon={<ArrowUp size={15} />} onClick={() => updateSelectedPlacement({ positionMm: { z: selectedObject.positionMm.z - 10 } })} />
                    <span />
                    <MoveButton label="Przesuń w lewo" icon={<ArrowLeft size={15} />} onClick={() => updateSelectedPlacement({ positionMm: { x: selectedObject.positionMm.x - 10 } })} />
                    <MoveButton label="Przesuń w dół" icon={<ArrowDown size={15} />} onClick={() => updateSelectedPlacement({ positionMm: { z: selectedObject.positionMm.z + 10 } })} />
                    <MoveButton label="Przesuń w prawo" icon={<ArrowRight size={15} />} onClick={() => updateSelectedPlacement({ positionMm: { x: selectedObject.positionMm.x + 10 } })} />
                  </div>
                )}
                <p className="mt-3 text-[10px] leading-4 text-white/35">Położenie jest blokowane przy wybranej powierzchni. Element nie może wyjść poza wnętrze.</p>
              </div>
            ) : (
              <p className="border-b border-white/[0.08] py-4 text-xs leading-5 text-white/40">Wybierz obiekt w scenie, aby zmienić jego położenie lub obrót.</p>
            )}

            <div className="py-4">
              <div className="mb-3 flex items-center justify-between text-xs text-white/50"><span>Wycena orientacyjna</span><span className="inline-flex items-center gap-1"><Check size={13} className="text-primary" /> produkty</span></div>
              {estimate.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3 py-1.5 text-xs">
                  <span className="min-w-0 text-white/60">{item.quantity} × {item.name}</span>
                  <span className="shrink-0 text-white/70">{currency(item.lineTotalCents)}</span>
                </div>
              ))}
              <div className="mt-3 flex items-end justify-between border-t border-white/[0.08] pt-3">
                <span className="text-sm font-medium">Suma produktów</span>
                <span className="text-xl font-semibold text-primary">{currency(estimate.totalCents)}</span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-white/35">To wstępne podsumowanie cen SKU. Sklep sprawdzi projekt i przedstawi ofertę końcową. Koszt dostawy jest rozliczany osobno.</p>
            </div>

            {projectMessage.text && <p role={projectMessage.type === 'error' ? 'alert' : 'status'} className={`mb-3 text-xs leading-5 ${projectMessage.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{projectMessage.text}</p>}
            {projectMessage.type === 'success' ? (
              <Link to="/dashboard" className="block w-full rounded bg-primary px-4 py-3 text-center text-sm font-semibold text-black hover:bg-white">Przejdź do panelu klienta</Link>
            ) : user ? (
              <button type="button" onClick={submitProject} disabled={isDemo || isSubmitting || objects.length === 0} className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                {isDemo ? 'Wysyłka wyłączona w demo' : isSubmitting ? 'Wysyłamy projekt…' : 'Wyślij do wyceny'}
              </button>
            ) : (
              <Link to="/login" state={{ from: '/terrarium' }} className={`block w-full rounded px-4 py-3 text-center text-sm font-semibold ${isDemo ? 'bg-white/10 text-white/45' : 'bg-primary text-black hover:bg-white'}`} aria-disabled={isDemo} onClick={(event) => { if (isDemo) event.preventDefault(); }}>
                {isDemo ? 'Wysyłka wyłączona w demo' : 'Zaloguj się, aby wysłać projekt'}
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function MoveButton({ label, icon, onClick }) {
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-9 items-center justify-center rounded border border-white/10 text-white/60 hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{icon}</button>;
}
