import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../utils/config';
import { Cookie, X, Check, Shield, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONSENT_STORAGE_KEY } from '../utils/consent';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false
    });

    useEffect(() => {
        const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!consent) {
            // Simulate delay for smoother UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const allConsent = { necessary: true, analytics: true, marketing: true };
        saveConsent(allConsent);
    };

    const handleSavePreferences = () => {
        saveConsent(preferences);
    };

    const saveConsent = async (settings) => {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
            ...settings,
            timestamp: new Date().toISOString()
        }));
        window.dispatchEvent(new Event('cookie_consent_updated'));
        setIsVisible(false);

        try {
            // Send to backend
            // Send to backend
            const API_URL = `${API_BASE}/api`;
            await fetch(`${API_URL}/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Failed to log consent:', error);
        }
    };

    const togglePreference = (key) => {
        if (key === 'necessary') return; // Cannot toggle necessary
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4"
                >
                    <div className="max-w-6xl mx-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-700 rounded-2xl shadow-2xl p-6 md:p-8">
                        {!showDetails ? (
                            // Simple View
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500/10 p-3 rounded-xl hidden sm:block">
                                        <Cookie className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Szanujemy Twoją prywatność</h3>
                                        <p className="text-neutral-400 text-sm max-w-2xl">
                                            Używamy plików cookies, aby zapewnić najlepszą jakość naszej strony.
                                            Możesz zaakceptować wszystkie lub dostosować ustawienia do swoich potrzeb.
                                            Dowiedz się więcej w naszej <Link to="/cookies" className="text-emerald-400 hover:underline">Polityce Cookies</Link>.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => setShowDetails(true)}
                                        className="px-6 py-2.5 rounded-lg border border-neutral-600 text-neutral-300 hover:bg-neutral-800 transition-colors font-medium text-sm"
                                    >
                                        Dostosuj
                                    </button>
                                    <button
                                        onClick={handleAcceptAll}
                                        className="px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-105"
                                    >
                                        Akceptuj wszystkie
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Detailed View
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-emerald-400" />
                                        Ustawienia prywatności
                                    </h3>
                                    <button onClick={() => setShowDetails(false)} className="text-neutral-400 hover:text-white p-1">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Necessary */}
                                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-white flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-emerald-400" /> Niezbędne
                                            </span>
                                            <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Wymagane</div>
                                        </div>
                                        <p className="text-xs text-neutral-400">Kluczowe dla działania strony i bezpieczeństwa.</p>
                                    </div>

                                    {/* Analytics */}
                                    <div
                                        onClick={() => togglePreference('analytics')}
                                        className={`bg-neutral-800/50 p-4 rounded-xl border cursor-pointer transition-all ${preferences.analytics ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-700/50 hover:border-neutral-600'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-white">Analityczne</span>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${preferences.analytics ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`}>
                                                {preferences.analytics && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-400">Pomagają nam ulepszać stronę poprzez statystyki.</p>
                                    </div>

                                    {/* Marketing */}
                                    <div
                                        onClick={() => togglePreference('marketing')}
                                        className={`bg-neutral-800/50 p-4 rounded-xl border cursor-pointer transition-all ${preferences.marketing ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-700/50 hover:border-neutral-600'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-white">Marketingowe</span>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${preferences.marketing ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`}>
                                                {preferences.marketing && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-400">Dopasowanie reklam do Twoich zainteresowań.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                                    <button
                                        onClick={handleAcceptAll}
                                        className="px-6 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        Zaakceptuj wszystkie
                                    </button>
                                    <button
                                        onClick={handleSavePreferences}
                                        className="px-8 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/20"
                                    >
                                        Zapisz wybrane
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
