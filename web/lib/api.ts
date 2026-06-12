const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message ?? msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiUpload<T = any>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/api${path}`, { method: 'POST', credentials: 'include', body: fd });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiPdf(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}
