import { supabase } from '../supabase/client';
import type { Aerolinea } from '../../domain/models/Aerolinea';

type AerolineaRow = {
  id: string;
  nombre: string;
  codigo_iata: string;
};

const mapToDomain = (data: AerolineaRow): Aerolinea => ({
  id: data.id,
  nombre: data.nombre,
  codigoIata: data.codigo_iata,
});

export const aerolineaRepository = {

  async getAll(): Promise<Aerolinea[]> {
    const { data, error } = await supabase
      .from('aerolineas')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error al obtener aerolíneas: ${error.message}`);
    
    return (data || []).map(mapToDomain);
  },

  async getById(id: string): Promise<Aerolinea | null> {
    const { data, error } = await supabase
      .from('aerolineas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener aerolínea: ${error.message}`);
    
    return data ? mapToDomain(data) : null;
  },

  async create(aerolinea: Omit<Aerolinea, 'id'>): Promise<Aerolinea> {
    const { data, error } = await supabase
      .from('aerolineas')
      .insert([{
        nombre: aerolinea.nombre,
        codigo_iata: aerolinea.codigoIata
      }])
      .select()
      .single();

    if (error) throw new Error(`Error al crear aerolínea: ${error.message}`);
    
    return mapToDomain(data);
  },

  async update(id: string, aerolinea: Partial<Aerolinea>): Promise<Aerolinea> {
    const updateData: Partial<Pick<AerolineaRow, 'nombre' | 'codigo_iata'>> = {};
    if (aerolinea.nombre !== undefined) updateData.nombre = aerolinea.nombre;
    if (aerolinea.codigoIata !== undefined) updateData.codigo_iata = aerolinea.codigoIata;

    const { data, error } = await supabase
      .from('aerolineas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar aerolínea: ${error.message}`);
    
    return mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('aerolineas')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar aerolínea: ${error.message}`);
  }
};