export type Categoria = 'turismo' | 'pista' | 'istituzionale';
export type Scope = 'turismo' | 'pista' | 'istituzionale' | 'totale';

export interface Anno { anno: number; attivo: boolean; }

export interface Socio { id: number; numero_tessera: number; nome: string; cognome: string; modello_auto?: string | null; _count?: { partecipazioni: number }; }

export interface Evento {
  id: number;
  titolo: string;
  anno: number;
  data_evento: string;
  data_fine?: string | null;
  categoria: Categoria;
  punteggio_base: number;
  immagine?: string | null;
  prova_abilita: boolean;
  scala_prova: number[] | null;
  _count?: { partecipazioni: number };
}

export interface DashboardEvento {
  id: number;
  titolo: string;
  data_evento: string;
  data_fine?: string | null;
  categoria: Categoria;
  immagine?: string | null;
  base: number;
  partecipanti: number;
}

export interface DashboardResponse {
  anno: number;
  stats: {
    soci: number;
    eventi: number;
    puntiAssegnati: number;
    leader: { nome: string; cognome: string; punti: number } | null;
  };
  podio: {
    posizione: number;
    nome: string;
    cognome: string;
    numero_tessera: number;
    modello_auto?: string | null;
    punti: number;
  }[];
  prossimiEventi: DashboardEvento[];
  ultimoEvento: DashboardEvento | null;
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
    socio: Socio & { modello_auto?: string | null };
    totale: number;
    punti_per_evento: Record<string, number>;
  }[];
}
