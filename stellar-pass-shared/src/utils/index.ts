// ============================================================
// Stellar Pass — Shared Utilities
// ============================================================

/**
 * Truncate a Stellar address (G-address or M-address) for display.
 * Shows first 6 and last 4 characters with ellipsis in between.
 *
 * @example
 * truncateAddress('GABC1234567890XYZ') → 'GABC12...90XYZ'
 */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a currency amount with proper decimal places.
 *
 * @example
 * formatCurrency(50.5, 'USDC') → '50.50 USDC'
 * formatCurrency(1000, 'XLM') → '1,000.00 XLM'
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Format a date string for display.
 *
 * @example
 * formatDate('2025-06-01T09:00:00Z') → 'Jun 1, 2025'
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string with time for display.
 *
 * @example
 * formatDateTime('2025-06-01T09:00:00Z') → 'Jun 1, 2025, 9:00 AM'
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate a URL-safe slug from a string.
 *
 * @example
 * slugify('Stellar Summit 2025!') → 'stellar-summit-2025'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate time remaining until a deadline.
 *
 * @example
 * getTimeRemaining('2025-06-01T09:00:00Z') → { days: 5, hours: 3, minutes: 30, expired: false }
 */
export function getTimeRemaining(deadline: string): {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
} {
  const total = new Date(deadline).getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, expired: false };
}

/**
 * Generate a random ID string.
 *
 * @example
 * generateId() → 'a1b2c3d4e5'
 */
export function generateId(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sleep for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await sleep(jitter);
    }
  }

  throw new Error('Max retries exceeded');
}
