export type Categoria = 'turismo' | 'pista';
export type Scope = Categoria | 'generale';

export interface Socio { id: number; numero_tessera: number; nome: string; cognome: string; modello_auto?: string | null; }

export interface Evento {
  id: number;
  titolo: string;
  data_evento: string;
  categoria: Categoria;
  punteggio_base: number;
  prova_abilita: boolean;
  scala_prova: number[] | null;
  _count?: { partecipazioni: number };
}

export interface Partecipazione {
  id: number; evento_id: number; socio_id: number;
  posizione_prova: number | null; punteggio_totale: number;
  socio?: Socio;
}

export interface ClassificaResponse {
  categoria: Scope;
  eventi: { id: string; titolo: string; data_evento: string }[];
  righe: {
    posizione: number;
    socio: Socio;
    totale: number;
    punti_per_evento: Record<string, number>;
  }[];
}
