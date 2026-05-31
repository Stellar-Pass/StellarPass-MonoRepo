import { nanoid } from 'nanoid';

/**
 * Generate a URL-safe slug from an event name.
 * Example: "My Awesome Event!" -> "my-awesome-event-a1b2c3"
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  const suffix = nanoid(6).toLowerCase();
  return `${base}-${suffix}`;
}
