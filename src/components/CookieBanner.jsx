import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE } from '../utils/config';
import { Cookie, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONSENT_STORAGE_KEY } from '../utils/consent';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const openerRef = useRef(null);
  const detailsHeadingRef = useRef(null);
  const rejectButtonRef = useRef(null);
  const focusViewRef = useRef(false);

  useEffect(() => {
    if (!isVisible || !focusViewRef.current) return;
    focusViewRef.current = false;
    window.requestAnimationFrame(() => {
      (showDetails ? detailsHeadingRef.current : rejectButtonRef.current)?.focus();
    });
  }, [isVisible, showDetails]);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_STORAGE_KEY)) {
      const timer = setTimeout(() => setIsVisible(true), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const openSettings = () => {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      let savedConsent = null;
      try {
        savedConsent = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || 'null');
      } catch {
        savedConsent = null;
      }
      setAnalytics(savedConsent?.analytics === true);
      focusViewRef.current = true;
      setShowDetails(true);
      setIsVisible(true);
    };
    window.addEventListener('open_cookie_settings', openSettings);
    return () => window.removeEventListener('open_cookie_settings', openSettings);
  }, []);

  const saveConsent = async (analyticsChoice) => {
    const settings = { necessary: true, analytics: analyticsChoice };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...settings, timestamp: new Date().toISOString() }));
    window.dispatchEvent(new Event('cookie_consent_updated'));
    setIsVisible(false);
    const focusReturnTarget = openerRef.current;
    openerRef.current = null;
    if (focusReturnTarget?.isConnected) {
      window.requestAnimationFrame(() => focusReturnTarget.focus());
    }
    try {
      await fetch(`${API_BASE}/api/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Failed to log consent:', error);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          role="region" aria-label="Ustawienia cookies" aria-describedby={showDetails ? undefined : "cookie-description"}
          className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="mx-auto max-w-6xl rounded-2xl border border-neutral-700 bg-neutral-950 p-5 shadow-2xl md:p-7">
            {!showDetails ? (
              <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                  <Cookie aria-hidden="true" className="mt-1 hidden h-7 w-7 text-emerald-400 sm:block" />
                  <div>
                    <h2 id="cookie-title" className="text-xl font-bold text-white">Ustawienia prywatności</h2>
                    <p id="cookie-description" className="mt-2 max-w-2xl text-sm text-neutral-300">
                      Niezbędne elementy działają zawsze. Narzędzia analityczne Vercel uruchamiają się tylko po zgodzie. Możesz ją zaakceptować lub odrzucić.{' '}
                      <Link to="/cookies" className="text-emerald-300 underline underline-offset-4">Szczegóły w polityce cookies</Link>.
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button ref={rejectButtonRef} type="button" onClick={() => saveConsent(false)} className="min-h-11 rounded-lg border border-neutral-600 px-5 py-2.5 font-semibold text-white hover:bg-neutral-800">Odrzuć analitykę</button>
                  <button type="button" onClick={() => { focusViewRef.current = true; setShowDetails(true); }} className="min-h-11 rounded-lg border border-neutral-600 px-5 py-2.5 font-medium text-neutral-200 hover:bg-neutral-800">Dostosuj</button>
                  <button type="button" onClick={() => saveConsent(true)} className="min-h-11 rounded-lg border border-neutral-600 px-5 py-2.5 font-semibold text-white hover:bg-neutral-800">Akceptuj analitykę</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 ref={detailsHeadingRef} id="cookie-title" tabIndex={-1} className="flex items-center gap-2 text-xl font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><Settings aria-hidden="true" className="h-5 w-5 text-emerald-400" /> Ustawienia prywatności</h2>
                    <p className="mt-2 text-sm text-neutral-300">Wybierz, czy zezwalasz na analitykę. Niezbędne elementy są zawsze aktywne.</p>
                  </div>
                  <button type="button" onClick={() => { focusViewRef.current = true; setShowDetails(false); }} aria-label="Wróć do wyboru zgody" className="rounded p-2 text-neutral-300 hover:text-white"><X aria-hidden="true" /></button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-700 p-4"><h3 className="font-semibold text-white">Niezbędne</h3><p className="mt-1 text-sm text-neutral-300">Wymagane do działania strony, koszyka i sesji.</p><p className="mt-3 text-sm text-emerald-300">Zawsze aktywne</p></div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-700 p-4 text-white">
                    <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500" />
                    <span><span className="font-semibold">Analityka Vercel</span><span className="mt-1 block text-sm text-neutral-300">Pomiar wydajności i sposobu korzystania ze sklepu.</span></span>
                  </label>
                </div>
                <div className="mt-5 flex flex-col justify-end gap-2 border-t border-neutral-800 pt-4 sm:flex-row">
                  <button type="button" onClick={() => saveConsent(false)} className="min-h-11 rounded-lg border border-neutral-600 px-5 py-2 font-semibold text-white hover:bg-neutral-800">Odrzuć analitykę</button>
                  <button type="button" onClick={() => saveConsent(analytics)} className="min-h-11 rounded-lg border border-neutral-600 px-5 py-2 font-semibold text-white hover:bg-neutral-800">Zapisz wybór</button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
