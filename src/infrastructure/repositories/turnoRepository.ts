import { supabase } from '../supabase/client';
import type { Turno } from '../../domain/models/Turno';

type TurnoRow = {
  id: string;
  agente_id: string;
  posicion_id: string | null;
  vuelo_id: string | null;
  hora_inicio: string;
  hora_fin: string;
  agentes?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil_url: string | null;
    habilidades: string[] | null;
    esta_activo: boolean;
  } | null;
  posiciones?: {
    id: string;
    nombre: string;
    requiere_certificacion: boolean;
  } | null;
  vuelos?: {
    id: string;
    aerolinea_id: string;
    numero_vuelo: string;
    hora_programada: string;
    hora_real: string | null;
    estado: 'ON_TIME' | 'DELAYED' | 'EARLY' | 'CANCELLED';
  } | null;
};

const mapToDomain = (data: TurnoRow): Turno => ({
  id: data.id,
  agenteId: data.agente_id,
  posicionId: data.posicion_id ?? undefined,
  vueloId: data.vuelo_id ?? undefined,
  horaInicio: data.hora_inicio,
  horaFin: data.hora_fin,
  agente: data.agentes
    ? {
        id: data.agentes.id,
        nombre: data.agentes.nombre,
        apellidos: data.agentes.apellidos,
        fotoPerfilUrl: data.agentes.foto_perfil_url ?? undefined,
        habilidades: data.agentes.habilidades ?? [],
        estaActivo: data.agentes.esta_activo,
      }
    : undefined,
  posicion: data.posiciones
    ? {
        id: data.posiciones.id,
        nombre: data.posiciones.nombre,
        requiereCertificacion: data.posiciones.requiere_certificacion,
      }
    : undefined,
  vuelo: data.vuelos
    ? {
        id: data.vuelos.id,
        aerolineaId: data.vuelos.aerolinea_id,
        numeroVuelo: data.vuelos.numero_vuelo,
        horaProgramada: data.vuelos.hora_programada,
        horaReal: data.vuelos.hora_real ?? undefined,
        estado: data.vuelos.estado,
      }
    : undefined,
});

export const turnoRepository = {

  async getAll(): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .order('hora_inicio', { ascending: true });

    if (error) throw new Error(`Error al obtener turnos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByRangoFecha(inicioIso: string, finIso: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .gte('hora_inicio', inicioIso)
      .lte('hora_fin', finIso)
      .order('hora_inicio', { ascending: true });

    if (error) throw new Error(`Error al obtener turnos por rango: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async create(turno: Omit<Turno, 'id' | 'agente' | 'posicion' | 'vuelo'>): Promise<Turno> {
    const { data, error } = await supabase
      .from('turnos')
      .insert([{
        agente_id: turno.agenteId,
        posicion_id: turno.posicionId ?? null,
        vuelo_id: turno.vueloId ?? null,
        hora_inicio: turno.horaInicio,
        hora_fin: turno.horaFin,
      }])
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .single();

    if (error) throw new Error(`Error al crear turno: ${error.message}`);
    return mapToDomain(data);
  },

  // Creación masiva para el algoritmo de auto-asignación
  async createBulk(turnos: Omit<Turno, 'id' | 'agente' | 'posicion' | 'vuelo'>[]): Promise<Turno[]> {
    const insertData = turnos.map((t) => ({
      agente_id: t.agenteId,
      posicion_id: t.posicionId ?? null,
      vuelo_id: t.vueloId ?? null,
      hora_inicio: t.horaInicio,
      hora_fin: t.horaFin,
    }));

    const { data, error } = await supabase
      .from('turnos')
      .insert(insertData)
      .select('*, agentes(*), posiciones(*), vuelos(*)');

    if (error) throw new Error(`Error en creación masiva de turnos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar turno: ${error.message}`);
  },
};