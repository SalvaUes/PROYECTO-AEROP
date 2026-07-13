import { supabase } from '../supabase/client';
import type { Posicion } from '../../domain/models/Posicion';

type PosicionRow = {
  id: string;
  nombre: string;
  requiere_certificacion: boolean;
};

const mapToDomain = (data: PosicionRow): Posicion => ({
  id: data.id,
  nombre: data.nombre,
  requiereCertificacion: data.requiere_certificacion,
});

export const posicionRepository = {

  async getAll(): Promise<Posicion[]> {
    const { data, error } = await supabase
      .from('posiciones')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error al obtener posiciones: ${error.message}`);
    
    return (data || []).map(mapToDomain);
  },

  async getById(id: string): Promise<Posicion | null> {
    const { data, error } = await supabase
      .from('posiciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener posición: ${error.message}`);
    
    return data ? mapToDomain(data) : null;
  },

  async create(posicion: Omit<Posicion, 'id'>): Promise<Posicion> {
    const { data, error } = await supabase
      .from('posiciones')
      .insert([{
        nombre: posicion.nombre,
        requiere_certificacion: posicion.requiereCertificacion
      }])
      .select()
      .single();

    if (error) throw new Error(`Error al crear posición: ${error.message}`);
    
    return mapToDomain(data);
  },

  async update(id: string, posicion: Partial<Posicion>): Promise<Posicion> {
    const updateData: Partial<Pick<PosicionRow, 'nombre' | 'requiere_certificacion'>> = {};
    if (posicion.nombre !== undefined) updateData.nombre = posicion.nombre;
    if (posicion.requiereCertificacion !== undefined) updateData.requiere_certificacion = posicion.requiereCertificacion;

    const { data, error } = await supabase
      .from('posiciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar posición: ${error.message}`);
    
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('posiciones')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar posición: ${error.message}`);
  }
};