import React from 'react';

const RELOAD_FLAG_KEY = 'vitazone-lazy-reload-attempted';

const buildReloadUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('refresh', Date.now().toString());
    return url.toString();
};

/**
 * Wraps React.lazy and retries once with a hard refresh when a deployment
 * changed chunk filenames while the user still had an older page open.
 */
export const lazyWithRetry = (componentImport) => React.lazy(async () => {
    const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG_KEY) === 'true';

    try {
        const importedModule = await componentImport();
        window.sessionStorage.removeItem(RELOAD_FLAG_KEY);
        return importedModule;
    } catch (error) {
        if (!alreadyReloaded) {
            window.sessionStorage.setItem(RELOAD_FLAG_KEY, 'true');
            window.location.replace(buildReloadUrl());
            return new Promise(() => {});
        }

        throw error;
    }
});
