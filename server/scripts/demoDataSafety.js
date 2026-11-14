const isLocalDatabaseHost = (databaseUrl) => {
    try {
        const { hostname } = new URL(databaseUrl);
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch {
        return false;
    }
};

export const assertDemoDataDatabaseAccess = (operation, env = process.env) => {
    if (env.NODE_ENV === 'production' || env.VERCEL) {
        throw new Error(`Refusing to run the demo ${operation} in a production/Vercel environment.`);
    }

    const operationFlag = operation === 'seed' ? 'ALLOW_DEMO_SEED' : 'ALLOW_DEMO_CATALOG_SYNC';
    if (env[operationFlag] !== 'true') {
        throw new Error(`Demo ${operation} is disabled. Set ${operationFlag}=true only for a disposable test database.`);
    }

    if (!isLocalDatabaseHost(env.DATABASE_URL) && env.ALLOW_REMOTE_DEMO_DATABASE !== 'true') {
        throw new Error('Demo data can only target a local database unless ALLOW_REMOTE_DEMO_DATABASE=true is explicitly set.');
    }
};

export const assertDestructiveSchemaResetAccess = (env = process.env) => {
    if (env.NODE_ENV === 'production' || env.VERCEL) {
        throw new Error('Refusing to run a destructive schema reset in a production/Vercel environment.');
    }

    if (env.ALLOW_DESTRUCTIVE_SCHEMA_RESET !== 'true') {
        throw new Error('Schema reset is disabled. Set ALLOW_DESTRUCTIVE_SCHEMA_RESET=true only for a disposable database.');
    }

    if (!isLocalDatabaseHost(env.DATABASE_URL) && env.ALLOW_REMOTE_DESTRUCTIVE_SCHEMA_RESET !== 'true') {
        throw new Error('A remote schema reset requires a separate ALLOW_REMOTE_DESTRUCTIVE_SCHEMA_RESET=true opt-in.');
    }
};
