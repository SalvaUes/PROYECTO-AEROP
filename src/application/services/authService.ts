
import { supabase } from '../../infrastructure/supabase/client';

export const authService = {
  
  
   //Inicia sesión con correo y contraseña.

  async login(email: string, password: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Error de autenticación: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Ocurrió un error inesperado al iniciar sesión.', { cause: error });
    }
  },



  
   // Cierra la sesión activa del usuario.
   
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`Error al cerrar sesión: ${error.message}`);
      }
    } catch (error) {
      // Atrapa caídas de red o fallos inesperados de Supabase
      if (error instanceof Error) throw error;
      throw new Error('Ocurrió un error inesperado al intentar cerrar sesión.', { cause: error });
    }
  },

  


// Obtiene el ID del usuario autenticado actual de forma segura.
   
  async getCurrentUserId(): Promise<string | null> {
    try {
      // Obtener tanto la sesión como posibles errores internos de Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error verificando la sesión activa:', error.message);
        return null; // Devuelve null para que la UI sepa que no hay nadie autenticado
      }
      
      return session?.user?.id || null;
    } catch (error) {
      // Si el internet falla y getSession explota, evita que la app muera
      console.error('Error crítico al obtener el usuario actual:', error);
      return null;
    }
  }
};