import { hasAnalyticsConsent } from './consent';

let trackPromise = null;

const getTrack = async () => {
    if (!trackPromise) {
        trackPromise = import('@vercel/analytics/react').then((module) => module.track);
    }

    return trackPromise;
};

export const trackEvent = (name, properties = {}) => {
    if (typeof window === 'undefined') return;
    if (!hasAnalyticsConsent()) return;

    void getTrack()
        .then((track) => {
            track(name, properties);
        })
        .catch((error) => {
            console.error(`Failed to track event "${name}"`, error);
        });
};
