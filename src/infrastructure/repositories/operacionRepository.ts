import { supabase } from '../supabase/client';
import type { Operacion, EstadoOperacion } from '../../domain/models/Operacion';

type OperacionRow = {
  id: string;
  fecha: string;
  vuelo_id: string;
  agente_id: string | null;
  posicion_id: string;
  estado: EstadoOperacion;
  observaciones: string | null;
  vuelos?: {
    id: string;
    aerolinea_id: string;
    numero_vuelo: string;
    hora_programada: string;
    hora_real: string | null;
    estado: 'ON_TIME' | 'DELAYED' | 'EARLY' | 'CANCELLED';
  } | null;
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
};

const mapToDomain = (data: OperacionRow): Operacion => ({
  id: data.id,
  fecha: data.fecha,
  vueloId: data.vuelo_id,
  agenteId: data.agente_id ?? undefined,
  posicionId: data.posicion_id,
  estado: data.estado,
  observaciones: data.observaciones ?? undefined,
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
});

const rangoMes = (mes: string): { inicio: string; fin: string } => {
  const inicio = new Date(`${mes}-01T00:00:00.000Z`);
  const fin = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error(`Formato de mes inválido: ${mes}`);
  }

  return {
    inicio: inicio.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
};

export const operacionRepository = {
  async getAll(): Promise<Operacion[]> {
    const { data, error } = await supabase
      .from('operaciones')
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener operaciones: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByFecha(fecha: string): Promise<Operacion[]> {
    const { data, error } = await supabase
      .from('operaciones')
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .eq('fecha', fecha)
      .order('vuelo_id', { ascending: true });

    if (error) throw new Error(`Error al obtener operaciones de la fecha ${fecha}: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByMes(mes: string): Promise<Operacion[]> {
    const { inicio, fin } = rangoMes(mes);

    const { data, error } = await supabase
      .from('operaciones')
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener operaciones del mes ${mes}: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getById(id: string): Promise<Operacion | null> {
    const { data, error } = await supabase
      .from('operaciones')
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener la operación: ${error.message}`);
    return data ? mapToDomain(data) : null;
  },

  async create(operacion: Omit<Operacion, 'id' | 'vuelo' | 'agente' | 'posicion'>): Promise<Operacion> {
    const { data, error } = await supabase
      .from('operaciones')
      .insert([{
        fecha: operacion.fecha,
        vuelo_id: operacion.vueloId,
        agente_id: operacion.agenteId ?? null,
        posicion_id: operacion.posicionId,
        estado: operacion.estado,
        observaciones: operacion.observaciones ?? null,
      }])
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .single();

    if (error) throw new Error(`Error al crear la operación: ${error.message}`);
    return mapToDomain(data);
  },

  async update(id: string, operacion: Partial<Omit<Operacion, 'id' | 'vuelo' | 'agente' | 'posicion'>>): Promise<Operacion> {
    const updateData: Partial<Pick<OperacionRow, 'fecha' | 'vuelo_id' | 'agente_id' | 'posicion_id' | 'estado' | 'observaciones'>> = {};

    if (operacion.fecha !== undefined) updateData.fecha = operacion.fecha;
    if (operacion.vueloId !== undefined) updateData.vuelo_id = operacion.vueloId;
    if (operacion.agenteId !== undefined) updateData.agente_id = operacion.agenteId;
    if (operacion.posicionId !== undefined) updateData.posicion_id = operacion.posicionId;
    if (operacion.estado !== undefined) updateData.estado = operacion.estado;
    if (operacion.observaciones !== undefined) updateData.observaciones = operacion.observaciones;

    const { data, error } = await supabase
      .from('operaciones')
      .update(updateData)
      .eq('id', id)
      .select('*, vuelos(*), agentes(*), posiciones(*)')
      .single();

    if (error) throw new Error(`Error al actualizar la operación: ${error.message}`);
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('operaciones')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar la operación: ${error.message}`);
  },
};
