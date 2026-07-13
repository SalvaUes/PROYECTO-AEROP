import type { Agente } from './Agente';

export type TipoPermiso = 'VACACIONES' | 'INCAPACIDAD' | 'FALTA_INJUSTIFICADA' | 'PERMISO_ESPECIAL';
export type EstadoPermiso = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Permiso {
  id: string;
  agenteId: string;
  tipo: TipoPermiso;
  fechaInicio: string; // Formato YYYY-MM-DD
  fechaFin: string;    // Formato YYYY-MM-DD
  estado: EstadoPermiso;
  agente?: Agente;     // Entidad anidada opcional al hacer Join
}