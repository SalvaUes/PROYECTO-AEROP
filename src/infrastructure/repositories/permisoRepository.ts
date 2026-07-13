import { supabase } from '../supabase/client';
import type { Permiso, TipoPermiso, EstadoPermiso } from '../../domain/models/Permiso';

type PermisoRow = {
  id: string;
  agente_id: string;
  tipo: TipoPermiso;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPermiso;
  agentes?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil_url: string | null;
    habilidades: string[] | null;
    esta_activo: boolean;
  } | null;
};

const mapToDomain = (data: PermisoRow): Permiso => ({
  id: data.id,
  agenteId: data.agente_id,
  tipo: data.tipo,
  fechaInicio: data.fecha_inicio,
  fechaFin: data.fecha_fin,
  estado: data.estado,
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
});

export const permisoRepository = {

  async getAll(): Promise<Permiso[]> {
    const { data, error } = await supabase
      .from('permisos')
      .select('*, agentes(*)')
      .order('fecha_inicio', { ascending: false });

    if (error) throw new Error(`Error al obtener permisos: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async getByAgenteId(agenteId: string): Promise<Permiso[]> {
    const { data, error } = await supabase
      .from('permisos')
      .select('*, agentes(*)')
      .eq('agente_id', agenteId)
      .order('fecha_inicio', { ascending: false });

    if (error) throw new Error(`Error al obtener permisos del agente: ${error.message}`);
    return (data || []).map(mapToDomain);
  },

  async create(permiso: Omit<Permiso, 'id' | 'agente'>): Promise<Permiso> {
    const { data, error } = await supabase
      .from('permisos')
      .insert([{
        agente_id: permiso.agenteId,
        tipo: permiso.tipo,
        fecha_inicio: permiso.fechaInicio,
        fecha_fin: permiso.fechaFin,
        estado: permiso.estado,
      }])
      .select('*, agentes(*)')
      .single();

    if (error) throw new Error(`Error al crear permiso: ${error.message}`);
    return mapToDomain(data);
  },

  async updateEstado(id: string, estado: EstadoPermiso): Promise<Permiso> {
    const { data, error } = await supabase
      .from('permisos')
      .update({ estado })
      .eq('id', id)
      .select('*, agentes(*)')
      .single();

    if (error) throw new Error(`Error al actualizar estado del permiso: ${error.message}`);
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('permisos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar permiso: ${error.message}`);
  },
};