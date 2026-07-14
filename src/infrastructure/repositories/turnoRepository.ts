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

const rangoDiaIso = (fecha: string): { inicio: string; fin: string } => {
  const inicio = new Date(`${fecha}T00:00:00.000Z`);
  const fin = new Date(`${fecha}T23:59:59.999Z`);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error(`Formato de fecha inválido: ${fecha}`);
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
  };
};

const rangoMesIso = (mes: string): { inicio: string; fin: string } => {
  const inicio = new Date(`${mes}-01T00:00:00.000Z`);
  const fin = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error(`Formato de mes inválido: ${mes}`);
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
  };
};

const consultarPorRango = async (inicioIso: string, finIso: string): Promise<Turno[]> => {
  const { data, error } = await supabase
    .from('turnos')
    .select('*, agentes(*), posiciones(*), vuelos(*)')
    .gte('hora_inicio', inicioIso)
    .lte('hora_fin', finIso)
    .order('hora_inicio', { ascending: true });

  if (error) throw new Error(`Error al obtener turnos por rango: ${error.message}`);
  return (data || []).map(mapToDomain);
};

export const turnoRepository = {
  async getAll(): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .order('hora_inicio', { ascending: true });

    if (error) throw new Error(`Error al obtener turnos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByFecha(fecha: string): Promise<Turno[]> {
    const { inicio, fin } = rangoDiaIso(fecha);
    return consultarPorRango(inicio, fin);
  },

  async getByAgenteYMes(agenteId: string, mes: string): Promise<Turno[]> {
    const { inicio, fin } = rangoMesIso(mes);

    const { data, error } = await supabase
      .from('turnos')
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .eq('agente_id', agenteId)
      .gte('hora_inicio', inicio)
      .lte('hora_fin', fin)
      .order('hora_inicio', { ascending: true });

    if (error) throw new Error(`Error al obtener turnos del agente por mes: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByMes(mes: string): Promise<Turno[]> {
    const { inicio, fin } = rangoMesIso(mes);
    return consultarPorRango(inicio, fin);
  },

  async getByRangoFecha(inicioIso: string, finIso: string): Promise<Turno[]> {
    return consultarPorRango(inicioIso, finIso);
  },

  async getById(id: string): Promise<Turno | null> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener turno: ${error.message}`);
    return data ? mapToDomain(data) : null;
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

  async createBulk(turnos: Omit<Turno, 'id' | 'agente' | 'posicion' | 'vuelo'>[]): Promise<Turno[]> {
    const insertData = turnos.map((turno) => ({
      agente_id: turno.agenteId,
      posicion_id: turno.posicionId ?? null,
      vuelo_id: turno.vueloId ?? null,
      hora_inicio: turno.horaInicio,
      hora_fin: turno.horaFin,
    }));

    const { data, error } = await supabase
      .from('turnos')
      .insert(insertData)
      .select('*, agentes(*), posiciones(*), vuelos(*)');

    if (error) throw new Error(`Error en creación masiva de turnos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async update(id: string, turno: Partial<Omit<Turno, 'id' | 'agente' | 'posicion' | 'vuelo'>>): Promise<Turno> {
    const updateData: Partial<Pick<TurnoRow, 'agente_id' | 'posicion_id' | 'vuelo_id' | 'hora_inicio' | 'hora_fin'>> = {};

    if (turno.agenteId !== undefined) updateData.agente_id = turno.agenteId;
    if (turno.posicionId !== undefined) updateData.posicion_id = turno.posicionId;
    if (turno.vueloId !== undefined) updateData.vuelo_id = turno.vueloId;
    if (turno.horaInicio !== undefined) updateData.hora_inicio = turno.horaInicio;
    if (turno.horaFin !== undefined) updateData.hora_fin = turno.horaFin;

    const { data, error } = await supabase
      .from('turnos')
      .update(updateData)
      .eq('id', id)
      .select('*, agentes(*), posiciones(*), vuelos(*)')
      .single();

    if (error) throw new Error(`Error al actualizar turno: ${error.message}`);
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar turno: ${error.message}`);
  },
};
