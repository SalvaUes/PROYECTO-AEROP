import { supabase } from '../supabase/client';
import type { Agente } from '../../domain/models/Agente';

type AgenteRow = {
  id: string;
  nombre: string;
  apellidos: string;
  foto_perfil_url: string | null;
  habilidades: string[] | null;
  esta_activo: boolean;
};

const mapToDomain = (data: AgenteRow): Agente => ({
  id: data.id,
  nombre: data.nombre,
  apellidos: data.apellidos,
  fotoPerfilUrl: data.foto_perfil_url ?? undefined, 
  habilidades: data.habilidades ?? [],
  estaActivo: data.esta_activo,        
});

export const agenteRepository = {

  // 0. SUBIR FOTO AL BUCKET DE SUPABASE STORAGE
  async uploadFoto(file: File): Promise<string> {
    // Generamos un nombre único para evitar que dos imágenes con el mismo nombre se sobrescriban
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `agentes/${fileName}`;

    // Subimos el archivo al bucket "agentes-fotos"
    const { error: uploadError } = await supabase.storage
      .from('agentes-fotos')
      .upload(filePath, file);

    if (uploadError) throw new Error(`Error al subir la fotografía: ${uploadError.message}`);

    // Obtenemos la URL pública del archivo recién subido
    const { data } = supabase.storage
      .from('agentes-fotos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
  
  // 1. OBTENER TODOS LOS AGENTES
  async getAll(): Promise<Agente[]> {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error al obtener agentes: ${error.message}`);
    
    return (data || []).map(mapToDomain);
  },

  // 2. OBTENER UN AGENTE POR SU ID
  async getById(id: string): Promise<Agente | null> {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener agente: ${error.message}`);
    
    return data ? mapToDomain(data) : null;
  },

  // 3. CREAR UN NUEVO AGENTE
  async create(agente: Omit<Agente, 'id'>): Promise<Agente> {
    const { data, error } = await supabase
      .from('agentes')
      .insert([{
        nombre: agente.nombre,
        apellidos: agente.apellidos,
        foto_perfil_url: agente.fotoPerfilUrl,
        habilidades: agente.habilidades,
        esta_activo: agente.estaActivo
      }])
      .select()
      .single(); 

    if (error) throw new Error(`Error al crear agente: ${error.message}`);
    
    return mapToDomain(data);
  },

  // 4. ACTUALIZAR UN AGENTE EXISTENTE
  async update(id: string, agente: Partial<Agente>): Promise<Agente> {
    const updateData: Partial<Pick<AgenteRow, 'nombre' | 'apellidos' | 'foto_perfil_url' | 'habilidades' | 'esta_activo'>> = {};
    
    if (agente.nombre !== undefined) updateData.nombre = agente.nombre;
    if (agente.apellidos !== undefined) updateData.apellidos = agente.apellidos;
    if (agente.fotoPerfilUrl !== undefined) updateData.foto_perfil_url = agente.fotoPerfilUrl;
    if (agente.habilidades !== undefined) updateData.habilidades = agente.habilidades;
    if (agente.estaActivo !== undefined) updateData.esta_activo = agente.estaActivo;

    const { data, error } = await supabase
      .from('agentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar agente: ${error.message}`);
    
    return mapToDomain(data);
  },
  
  // 5. ELIMINAR UN AGENTE
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agentes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar agente: ${error.message}`);
  }
};