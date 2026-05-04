'use client';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClassificaTable } from '@/components/classifica-table';
import { api, apiPdf } from '@/lib/api';
import type { Categoria, ClassificaResponse } from '@/lib/types';

export default function ClassificaPage() {
  const [cat, setCat] = useState<Categoria>('turismo');
  const [data, setData] = useState<ClassificaResponse | null>(null);

  useEffect(() => {
    api<ClassificaResponse>(`/classifica?categoria=${cat}`).then(setData);
  }, [cat]);

  async function pdf() {
    const blob = await apiPdf(`/pdf/classifica?categoria=${cat}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `classifica-${cat}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Classifica</h1>
        <Button variant="outline" onClick={pdf}>Scarica PDF</Button>
      </div>
      <Tabs value={cat} onValueChange={v => setCat(v as Categoria)}>
        <TabsList>
          <TabsTrigger value="turismo">Turismo</TabsTrigger>
          <TabsTrigger value="pista">Pista</TabsTrigger>
        </TabsList>
        <TabsContent value="turismo">{data && cat === 'turismo' && <ClassificaTable data={data} />}</TabsContent>
        <TabsContent value="pista">{data && cat === 'pista' && <ClassificaTable data={data} />}</TabsContent>
      </Tabs>
    </div>
  );
}
