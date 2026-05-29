import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { CONSENT_STORAGE_KEY, readConsent } from './utils/consent';
import { lazyWithRetry } from './utils/lazyWithRetry';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

const MouseGlow = lazyWithRetry(() => import('./components/MouseGlow'));
const Particles = lazyWithRetry(() => import('./components/Particles'));
const CookieBanner = lazyWithRetry(() => import('./components/CookieBanner'));
const ChatWidget = lazyWithRetry(() => import('./components/ChatWidget'));
const VercelInsights = lazyWithRetry(() => import('./components/VercelInsights'));

const Home = lazyWithRetry(() => import('./pages/Home'));
const Shop = lazyWithRetry(() => import('./pages/Shop'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/legal/TermsAndConditions'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/legal/PrivacyPolicy'));
const CookiesPolicy = lazyWithRetry(() => import('./pages/legal/CookiesPolicy'));
const Withdrawal = lazyWithRetry(() => import('./pages/legal/Withdrawal'));
const FAQ = lazyWithRetry(() => import('./pages/FAQ'));

const scheduleIdleTask = (callback, timeout = 1200) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if ('requestIdleCallback' in window) {
    const taskId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(taskId);
  }

  const timeoutId = window.setTimeout(callback, Math.min(timeout, 800));
  return () => window.clearTimeout(timeoutId);
};

function App() {
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false);
  const [deferredUi, setDeferredUi] = React.useState({
    ambientEffects: false,
    chatWidget: false,
    cookieBanner: false
  });

  React.useEffect(() => {
    const getEnabled = () => readConsent()?.analytics === true;

    setAnalyticsEnabled(getEnabled());

    const onUpdated = () => setAnalyticsEnabled(getEnabled());
    const onStorage = (event) => {
      if (event?.key === CONSENT_STORAGE_KEY) onUpdated();
    };

    window.addEventListener('cookie_consent_updated', onUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('cookie_consent_updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  React.useEffect(() => {
    const loadDeferredUi = (key) => {
      React.startTransition(() => {
        setDeferredUi((current) => (current[key] ? current : { ...current, [key]: true }));
      });
    };

    const cookieTimerId = window.setTimeout(() => loadDeferredUi('cookieBanner'), 250);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsAmbientEffects = window.matchMedia('(min-width: 768px)').matches && !prefersReducedMotion;

    const clearAmbientTask = supportsAmbientEffects
      ? scheduleIdleTask(() => loadDeferredUi('ambientEffects'), 1400)
      : () => {};

    const clearChatIdleTask = scheduleIdleTask(() => loadDeferredUi('chatWidget'), 1800);

    const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'focusin'];
    const triggerChatLoad = () => {
      loadDeferredUi('chatWidget');
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, triggerChatLoad);
      });
    };

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, triggerChatLoad, { passive: true, once: true });
    });

    return () => {
      window.clearTimeout(cookieTimerId);
      clearAmbientTask();
      clearChatIdleTask();
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, triggerChatLoad);
      });
    };
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen overflow-x-hidden bg-bg text-text selection:bg-primary selection:text-black">
              <Helmet>
                <title>VitaZone | Zwierzęta egzotyczne, terraria i akcesoria terrarystyczne</title>
                <meta
                  name="description"
                  content="VitaZone to sklep terrarystyczny ze zwierzętami egzotycznymi, terrariami i akcesoriami do kompletnej aranżacji terrarium."
                />
              </Helmet>
              <ScrollToTop />
              {analyticsEnabled && (
                <React.Suspense fallback={null}>
                  <VercelInsights />
                </React.Suspense>
              )}
              <Navbar />
              {deferredUi.ambientEffects && (
                <React.Suspense fallback={null}>
                  <MouseGlow />
                  <Particles />
                </React.Suspense>
              )}
              {deferredUi.cookieBanner && (
                <React.Suspense fallback={null}>
                  <CookieBanner />
                </React.Suspense>
              )}
              {deferredUi.chatWidget && (
                <React.Suspense fallback={null}>
                  <ChatWidget />
                </React.Suspense>
              )}
              <main className="relative z-10 min-h-screen pt-16 sm:pt-20">
                <React.Suspense
                  fallback={
                    <div className="flex min-h-screen items-center justify-center">
                      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiesPolicy />} />
                    <Route path="/withdrawal" element={<Withdrawal />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </React.Suspense>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
