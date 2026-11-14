import { describe, expect, it } from 'vitest';
import {
    assertDemoDataDatabaseAccess,
    assertDestructiveSchemaResetAccess
} from '../../server/scripts/demoDataSafety.js';

const baseEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgres://localhost:5432/vitazone_demo'
};

describe('demo database safety gate', () => {
    it('blocks scripts unless the specific operation is explicitly enabled', () => {
        expect(() => assertDemoDataDatabaseAccess('seed', baseEnv)).toThrow('ALLOW_DEMO_SEED=true');
        expect(() => assertDemoDataDatabaseAccess('catalog sync', baseEnv)).toThrow('ALLOW_DEMO_CATALOG_SYNC=true');
    });

    it('blocks demo seed and catalog sync in production or on Vercel', () => {
        expect(() => assertDemoDataDatabaseAccess('seed', {
            ...baseEnv,
            NODE_ENV: 'production',
            ALLOW_DEMO_SEED: 'true'
        })).toThrow('production/Vercel');
        expect(() => assertDemoDataDatabaseAccess('catalog sync', {
            ...baseEnv,
            VERCEL: '1',
            ALLOW_DEMO_CATALOG_SYNC: 'true'
        })).toThrow('production/Vercel');
    });

    it('requires separate opt-in before targeting any remote database', () => {
        expect(() => assertDemoDataDatabaseAccess('catalog sync', {
            ...baseEnv,
            DATABASE_URL: 'postgres://demo.example.test:5432/demo',
            ALLOW_DEMO_CATALOG_SYNC: 'true'
        })).toThrow('ALLOW_REMOTE_DEMO_DATABASE=true');
    });

    it('allows an explicit local demo database operation', () => {
        expect(() => assertDemoDataDatabaseAccess('seed', {
            ...baseEnv,
            ALLOW_DEMO_SEED: 'true'
        })).not.toThrow();
    });
});

describe('destructive schema reset safety gate', () => {
    it('blocks local schema reset unless it has a separate explicit opt-in', () => {
        expect(() => assertDestructiveSchemaResetAccess(baseEnv)).toThrow('ALLOW_DESTRUCTIVE_SCHEMA_RESET=true');
        expect(() => assertDestructiveSchemaResetAccess({
            ...baseEnv,
            ALLOW_DESTRUCTIVE_SCHEMA_RESET: 'true'
        })).not.toThrow();
    });

    it('always blocks production and Vercel schema resets', () => {
        expect(() => assertDestructiveSchemaResetAccess({
            ...baseEnv,
            NODE_ENV: 'production',
            ALLOW_DESTRUCTIVE_SCHEMA_RESET: 'true'
        })).toThrow('production/Vercel');
        expect(() => assertDestructiveSchemaResetAccess({
            ...baseEnv,
            VERCEL: '1',
            ALLOW_DESTRUCTIVE_SCHEMA_RESET: 'true'
        })).toThrow('production/Vercel');
    });

    it('requires a second opt-in for a remote schema reset target', () => {
        expect(() => assertDestructiveSchemaResetAccess({
            ...baseEnv,
            DATABASE_URL: 'postgres://demo.example.test:5432/demo',
            ALLOW_DESTRUCTIVE_SCHEMA_RESET: 'true'
        })).toThrow('ALLOW_REMOTE_DESTRUCTIVE_SCHEMA_RESET=true');
        expect(() => assertDestructiveSchemaResetAccess({
            ...baseEnv,
            DATABASE_URL: 'postgres://demo.example.test:5432/demo',
            ALLOW_DESTRUCTIVE_SCHEMA_RESET: 'true',
            ALLOW_REMOTE_DESTRUCTIVE_SCHEMA_RESET: 'true'
        })).not.toThrow();
    });
});
