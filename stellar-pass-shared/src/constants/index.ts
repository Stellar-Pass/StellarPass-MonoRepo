// ============================================================
// Stellar Pass — Constants
// ============================================================

// --- API ---
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// --- Stellar Network ---
export const STELLAR_NETWORK = {
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
} as const;

export const HORIZON_URL = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
} as const;

export const SOROBAN_RPC_URL = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://soroban.stellar.org',
} as const;

export const NETWORK_PASSPHRASE = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
} as const;

// --- Stellar USDC ---
export const USDC_ISSUER = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  mainnet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJWWX3GZKFG3GR6V',
} as const;

export const USDC_ASSET_CODE = 'USDC';

// --- Stellar EURC ---
export const EURC_ISSUER = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  mainnet: 'GDHU6RQKMI4GCPMNOVYJVAMJTDIBU6W5HVKVH5GNPCGY5YQ4UGV3L66S',
} as const;

export const EURC_ASSET_CODE = 'EURC';

// --- NFT Asset Code Prefix ---
export const NFT_ASSET_PREFIX = 'SPAS'; // Stellar Pass asset prefix

// --- QR Code ---
export const QR_TTL_SECONDS = 15 * 60; // 15 minutes

// --- Rate Limiting ---
export const RATE_LIMITS = {
  AUTH_CHALLENGE: { max: 10, window: '1 minute' },
  AUTH_TOKEN: { max: 5, window: '1 minute' },
  TICKET_PURCHASE: { max: 3, window: '1 minute' },
  CHECK_IN_VERIFY: { max: 30, window: '1 minute' },
  EVENT_DETAIL: { max: 60, window: '1 minute' },
} as const;

// --- JWT ---
export const JWT_EXPIRY = '24h';
export const JWT_ALGORITHM = 'HS256';

// --- Purchase Session ---
export const PURCHASE_SESSION_TTL_MINUTES = 15;

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// --- Webhook Events ---
export const WEBHOOK_EVENTS = [
  'ticket.purchased',
  'ticket.checked_in',
  'ticket.frozen',
  'ticket.clawed_back',
  'poap.minted',
  'event.sold_out',
] as const;

// --- Soroban Contract Names ---
export const CONTRACT_NAMES = {
  TICKET: 'stellar_pass_ticket',
  POAP: 'stellar_pass_poap',
  ESCROW: 'stellar_pass_escrow',
} as const;

// --- Ticket Status ---
export const TICKET_STATUSES = ['active', 'used', 'frozen', 'clawed_back'] as const;

// --- Event Status ---
export const EVENT_STATUSES = ['draft', 'on_sale', 'sold_out', 'cancelled', 'past'] as const;

// --- Supported Currencies ---
export const SUPPORTED_CURRENCIES = ['USDC', 'XLM', 'EURC'] as const;

// --- Purchase Session Status ---
export const PURCHASE_SESSION_STATUSES = ['pending', 'confirmed', 'expired', 'failed'] as const;

// --- Webhook Delivery Status ---
export const WEBHOOK_DELIVERY_STATUSES = ['pending', 'delivered', 'failed'] as const;

// --- Royalty ---
export const DEFAULT_ROYALTY_BPS = 500; // 5%
export const MAX_ROYALTY_BPS = 2000; // 20%
