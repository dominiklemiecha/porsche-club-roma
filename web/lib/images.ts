const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Resolve an event image path to a full URL. Uploaded files are served by the API under /api/uploads. */
export function imageUrl(p?: string | null): string | null {
  if (!p) return null;
  if (/^https?:\/\//.test(p)) return p;
  return `${BASE}/api${p.startsWith('/') ? '' : '/'}${p}`;
}
