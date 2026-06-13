'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Anno } from './types';

export function useAnni() {
  const [anni, setAnni] = useState<Anno[]>([]);
  const [anno, setAnno] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const list = await api<Anno[]>('/anni');
    setAnni(list);
    setAnno(prev => prev ?? (list.find(a => a.attivo)?.anno ?? list[0]?.anno ?? null));
    return list;
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const aggiungiAnno = useCallback(async (nuovo: number) => {
    await api('/anni', { method: 'POST', body: JSON.stringify({ anno: nuovo }) });
    const list = await api<Anno[]>('/anni');
    setAnni(list);
    setAnno(nuovo);
  }, []);

  const attivo = anni.find(a => a.attivo)?.anno ?? null;
  const isStorico = anno !== null && attivo !== null && anno !== attivo;

  return { anni, anno, setAnno, reload, aggiungiAnno, attivo, isStorico };
}
