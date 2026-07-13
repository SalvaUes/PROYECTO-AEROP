import { createClient } from '@supabase/supabase-js';

// Los imports de las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de seguridad
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno en el archivo .env');
}

// Creacion y exportacion de la conexión
export const supabase = createClient(supabaseUrl, supabaseAnonKey);