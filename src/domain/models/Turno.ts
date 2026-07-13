import type { Agente } from './Agente';
import type { Posicion } from './Posicion';
import type { Vuelo } from './Vuelo';

export interface Turno {
  id: string;
  agenteId: string;
  posicionId?: string;
  vueloId?: string;
  horaInicio: string; // Formato ISO 8601
  horaFin: string;    // Formato ISO 8601
  agente?: Agente;
  posicion?: Posicion;
  vuelo?: Vuelo;
}