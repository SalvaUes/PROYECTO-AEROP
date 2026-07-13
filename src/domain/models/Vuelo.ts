import type { Aerolinea } from './Aerolinea';

export type EstadoVuelo = 'ON_TIME' | 'DELAYED' | 'EARLY' | 'CANCELLED';

export interface Vuelo {
  id: string;
  aerolineaId: string;
  numeroVuelo: string;
  horaProgramada: string; // Formato ISO 8601
  horaReal?: string;      // Formato ISO 8601
  estado: EstadoVuelo;
  aerolinea?: Aerolinea;   // Entidad anidada opcional al hacer Join
}