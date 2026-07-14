
import type { Operacion, EstadoOperacion } from '../../domain/models/Operacion';
import { operacionRepository } from '../../infrastructure/repositories/operacionRepository';

export const operacionesService = {
  
  //Obtiene todas las operaciones registradas para una fecha específica.
   
  async obtenerBitacoraDelDia(fecha: string): Promise<Operacion[]> {
    
    // Validación de seguridad para de que la interfaz envía el formato correcto
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fecha)) {
      throw new Error('El formato de la fecha debe ser estrictamente YYYY-MM-DD.');
    }

    try {
      return await operacionRepository.getByFecha(fecha);
    } catch (error) {
      throw new Error('Error de conexión al cargar la bitácora operativa del día.', { cause: error });
    }
  },



 // Registra una incidencia o novedad en una operación en curso.
   
  async registrarIncidencia(
    operacionId: string, 
    nuevaObservacion: string,
    esIncidenciaGrave: boolean = false // Nuevo parámetro para decidir si cerramos la operación
  ): Promise<Operacion> {
    
//validaciones de seguridad y consistencia de datos

    //  VALIDACIÓN 1: Calidad de la información
    if (nuevaObservacion.trim().length < 10) {
      throw new Error('La observación de la incidencia debe ser más descriptiva (mínimo 10 caracteres).');
    }
    
    try {
      // VALIDACIÓN 2: Existencia de la operación
      // Trae la operación original de la base de datos ANTES de modificarla
      const operacionActual = await operacionRepository.getById(operacionId);
      
      if (!operacionActual) {
        throw new Error('La operación a la que intentas agregar la incidencia no existe.');
      }

      // VALIDACIÓN 3: Operaciones Zombi
      if (operacionActual.estado === 'FINALIZADA' || operacionActual.estado === 'CANCELADA') {
        throw new Error('No se pueden registrar incidencias en una operación que ya concluyó.');
      }




      // EJECUCIÓN LÓGICA
      // Si la incidencia es grave, forzamos el cierre. Si no, mantenemos el estado actual.
      const estadoActualizado: EstadoOperacion = esIncidenciaGrave ? 'FINALIZADA' : operacionActual.estado;

      // Concatenamos la nueva observación sin borrar el historial anterior
      // Si ya había observaciones, agregamos un salto de línea o separador.
      const historialObservaciones = operacionActual.observaciones 
        ? `${operacionActual.observaciones}\n[Actualización]: ${nuevaObservacion.trim()}` 
        : nuevaObservacion.trim();



      // Guarda los cambios en la base de datos
      return await operacionRepository.update(operacionId, { 
        observaciones: historialObservaciones,
        estado: estadoActualizado
      });

    } catch (error) {
      // Si el error es de validación, lo lanzamos tal cual. Si es un fallo inesperado, se encapsula para no exponer detalles internos.
      if (error instanceof Error && error.message.includes('operación')) throw error;
      throw new Error('Ocurrió un error inesperado al registrar la incidencia en el servidor.', { cause: error });
    }
  }
};