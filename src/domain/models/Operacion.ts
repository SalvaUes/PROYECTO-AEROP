import type { Vuelo } from './Vuelo';
import type { Agente } from './Agente';
import type { Posicion } from './Posicion';

export type EstadoOperacion = 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';

export interface Operacion {
  id: string;
  fecha: string; // Formato YYYY-MM-DD
  vueloId: string;
  agenteId?: string; // Opcional por si la operación se crea antes de asignar agente
  posicionId: string;
  estado: EstadoOperacion;
  observaciones?: string;
  vuelo?: Vuelo;
  agente?: Agente;
  posicion?: Posicion;
}