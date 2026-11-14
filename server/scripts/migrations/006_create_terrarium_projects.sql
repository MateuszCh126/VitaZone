CREATE TABLE IF NOT EXISTS terrarium_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'quoted', 'accepted', 'payment_pending', 'paid', 'closed', 'expired')),
    configuration_version SMALLINT NOT NULL DEFAULT 1 CHECK (configuration_version > 0),
    configuration_json JSONB NOT NULL CHECK (jsonb_typeof(configuration_json) = 'object'),
    estimate_json JSONB NOT NULL CHECK (jsonb_typeof(estimate_json) = 'object'),
    estimate_total_cents INTEGER NOT NULL CHECK (estimate_total_cents > 0),
    quote_json JSONB CHECK (quote_json IS NULL OR jsonb_typeof(quote_json) = 'object'),
    quote_total_cents INTEGER CHECK (quote_total_cents IS NULL OR quote_total_cents > 0),
    quote_version INTEGER NOT NULL DEFAULT 0 CHECK (quote_version >= 0),
    quote_message TEXT NOT NULL DEFAULT '',
    quote_expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    checkout_attempt INTEGER NOT NULL DEFAULT 0 CHECK (checkout_attempt >= 0),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terrarium_projects_user_created
    ON terrarium_projects(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_terrarium_projects_status_created
    ON terrarium_projects(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_terrarium_projects_order
    ON terrarium_projects(order_id)
    WHERE order_id IS NOT NULL;
