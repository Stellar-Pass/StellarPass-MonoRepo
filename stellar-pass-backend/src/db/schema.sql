-- ============================================================
-- Stellar Pass — PostgreSQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stellar_account VARCHAR(56) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    date_start TIMESTAMPTZ NOT NULL,
    date_end TIMESTAMPTZ NOT NULL,
    venue_name TEXT,
    venue_address TEXT,
    venue_lat DECIMAL,
    venue_lng DECIMAL,
    image_url TEXT,
    status TEXT DEFAULT 'draft',
    poap_enabled BOOLEAN DEFAULT false,
    poap_badge_url TEXT,
    poap_contract_id TEXT,
    webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USDC',
    supply INT NOT NULL,
    minted INT DEFAULT 0,
    transferable BOOLEAN DEFAULT true,
    resale_price_cap DECIMAL,
    nft_contract_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id UUID REFERENCES ticket_tiers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    owner_wallet VARCHAR(56) NOT NULL,
    nft_asset_code TEXT NOT NULL UNIQUE,
    nft_asset_issuer VARCHAR(56),
    status TEXT DEFAULT 'active',
    purchase_tx_hash TEXT,
    purchase_price DECIMAL,
    purchase_currency TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by VARCHAR(56),
    qr_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES ticket_tiers(id) ON DELETE CASCADE,
    buyer_wallet VARCHAR(56) NOT NULL,
    muxed_account VARCHAR(69) NOT NULL,
    muxed_id BIGINT NOT NULL,
    amount DECIMAL NOT NULL,
    asset TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_tx_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poap_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    attendee_wallet VARCHAR(56) NOT NULL,
    nft_asset_code TEXT NOT NULL UNIQUE,
    mint_tx_hash TEXT,
    metadata_uri TEXT,
    minted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_code INT,
    response_body TEXT,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_poap_attendee ON poap_badges(attendee_wallet);
CREATE INDEX IF NOT EXISTS idx_sessions_muxed ON purchase_sessions(muxed_account);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON purchase_sessions(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tiers_event ON ticket_tiers(event_id);
