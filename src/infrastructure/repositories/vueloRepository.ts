import { supabase } from '../supabase/client';
import type { Vuelo, EstadoVuelo } from '../../domain/models/Vuelo';

type VueloRow = {
  id: string;
  aerolinea_id: string;
  numero_vuelo: string;
  hora_programada: string;
  hora_real: string | null;
  estado: EstadoVuelo;
  aerolineas?: {
    id: string;
    nombre: string;
    codigo_iata: string;
  } | null;
};

const mapToDomain = (data: VueloRow): Vuelo => ({
  id: data.id,
  aerolineaId: data.aerolinea_id,
  numeroVuelo: data.numero_vuelo,
  horaProgramada: data.hora_programada,
  horaReal: data.hora_real ?? undefined,
  estado: data.estado,
  aerolinea: data.aerolineas
    ? {
        id: data.aerolineas.id,
        nombre: data.aerolineas.nombre,
        codigoIata: data.aerolineas.codigo_iata,
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
export const vueloRepository = {


  async getByFecha(fecha: string): Promise<Vuelo[]> {
    const { inicio, fin } = rangoDiaIso(fecha);

    const { data, error } = await supabase
      .from('vuelos')
      .select('*, aerolineas(*)')
      .gte('hora_programada', inicio)
      .lte('hora_programada', fin)
      .order('hora_programada', { ascending: true });

    if (error) throw new Error(`Error al obtener vuelos por fecha: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByMes(mes: string): Promise<Vuelo[]> {
    const { inicio, fin } = rangoMesIso(mes);

    const { data, error } = await supabase
      .from('vuelos')
      .select('*, aerolineas(*)')
      .gte('hora_programada', inicio)
      .lte('hora_programada', fin)
      .order('hora_programada', { ascending: true });

    if (error) throw new Error(`Error al obtener vuelos por mes: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getAll(): Promise<Vuelo[]> {
    const { data, error } = await supabase
      .from('vuelos')
      .select('*, aerolineas(*)')
      .order('hora_programada', { ascending: true });

    if (error) throw new Error(`Error al obtener vuelos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getById(id: string): Promise<Vuelo | null> {
    const { data, error } = await supabase
      .from('vuelos')
      .select('*, aerolineas(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener vuelo: ${error.message}`);
    return data ? mapToDomain(data) : null;
  },

  async create(vuelo: Omit<Vuelo, 'id' | 'aerolinea'>): Promise<Vuelo> {
    const { data, error } = await supabase
      .from('vuelos')
      .insert([{
        aerolinea_id: vuelo.aerolineaId,
        numero_vuelo: vuelo.numeroVuelo,
        hora_programada: vuelo.horaProgramada,
        hora_real: vuelo.horaReal ?? null,
        estado: vuelo.estado,
      }])
      .select('*, aerolineas(*)')
      .single();

    if (error) throw new Error(`Error al crear vuelo: ${error.message}`);
    return mapToDomain(data);
  },

  async update(id: string, vuelo: Partial<Omit<Vuelo, 'id' | 'aerolinea'>>): Promise<Vuelo> {
    const updateData: Partial<Pick<VueloRow, 'aerolinea_id' | 'numero_vuelo' | 'hora_programada' | 'hora_real' | 'estado'>> = {};
    if (vuelo.aerolineaId !== undefined) updateData.aerolinea_id = vuelo.aerolineaId;
    if (vuelo.numeroVuelo !== undefined) updateData.numero_vuelo = vuelo.numeroVuelo;
    if (vuelo.horaProgramada !== undefined) updateData.hora_programada = vuelo.horaProgramada;
    if (vuelo.horaReal !== undefined) updateData.hora_real = vuelo.horaReal;
    if (vuelo.estado !== undefined) updateData.estado = vuelo.estado;

    const { data, error } = await supabase
      .from('vuelos')
      .update(updateData)
      .eq('id', id)
      .select('*, aerolineas(*)')
      .single();

    if (error) throw new Error(`Error al actualizar vuelo: ${error.message}`);
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vuelos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar vuelo: ${error.message}`);
  },
};