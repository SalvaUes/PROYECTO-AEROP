
import type { Permiso, TipoPermiso, EstadoPermiso } from '../../domain/models/Permiso';
import { permisoRepository } from '../../infrastructure/repositories/permisoRepository';
import { agenteRepository } from '../../infrastructure/repositories/agenteRepository';



export const permisosService = {
  
  /**
   * nueva solicitud de permiso para un agente.
   */
  async solicitarPermiso(
    agenteId: string,
    tipo: TipoPermiso,
    fechaInicio: string, // Formato YYYY-MM-DD
    fechaFin: string     // Formato YYYY-MM-DD
  ): Promise<Permiso> {



    // VALIDACIONES:
    
    // VALIDACIÓN 1: Lógica de Fechas
    // - fechaInicio y fechaFin sean iguales (permiso de 1 día), 
    // - bloquea si el inicio es posterior al fin.
    if (fechaInicio > fechaFin) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de finalización.');
    }

    // VALIDACIÓN 2: Existencia y Estado del Agente
    // Antes de dar un permiso, verificar que el agente exista y siga activo en la empresa.
    const agente = await agenteRepository.getById(agenteId);
    
    if (!agente) {
      throw new Error('El agente especificado no existe en el sistema.');
    }
    
    if (!agente.estaActivo) {
      throw new Error('No se pueden solicitar permisos para un agente inactivo o dado de baja.');
    }

    // VALIDACIÓN 3: Regla de Solapamiento
    // Busca el historial de permisos de este agente para evitar que pida vacaciones dobles.
    const permisosExistentes = await permisoRepository.getByAgenteId(agenteId);
    
    const solapado = permisosExistentes.some((p) => {
      
      if (p.estado === 'RECHAZADO') return false; // Ignorar los permisos que ya fueron rechazados (esos días están libres)

      // Evaluar los 3 escenarios donde las fechas chocan
      const inicioChoca = fechaInicio >= p.fechaInicio && fechaInicio <= p.fechaFin; // que la fecha de inicio del nuevo permiso caiga dentro de un permiso existente
      const finChoca = fechaFin >= p.fechaInicio && fechaFin <= p.fechaFin; // que la fecha de finalización del nuevo permiso caiga dentro de un permiso existente
      const envuelveAlViejo = fechaInicio <= p.fechaInicio && fechaFin >= p.fechaFin; // que el nuevo permiso envuelva a un permiso existente

      return inicioChoca || finChoca || envuelveAlViejo; // devolver true si cualquiera de los escenarios ocurre, indicando que hay solapamiento
    });

    if (solapado) {
      throw new Error('El agente ya cuenta con un permiso aprobado o en revisión para esas fechas.');
    }




    // EJECUCIÓN: Guardado en Base de Datos
    try {
      // Toda nueva solicitud nace obligatoriamente en estado PENDIENTE
      return await permisoRepository.create({
        agenteId,
        tipo,
        fechaInicio,
        fechaFin,
        estado: 'PENDIENTE',
      });
    } catch (error) {
      // Si Supabase falla (ej. pérdida de conexión), lanzar un error claro para la UI
      throw new Error('Ocurrió un error al intentar guardar la solicitud en la base de datos.', { cause: error });
    }
  },




  
   //Permite a un administrador o supervisor aprobar o rechazar un permiso pendiente.

  async resolverPermiso(permisoId: string, nuevoEstado: EstadoPermiso): Promise<Permiso> {
    
    //  VALIDACIÓN 1: // No permitir regresar un permiso a estado PENDIENTE
    if (nuevoEstado === 'PENDIENTE') {
      throw new Error('Operación no permitida: No se puede regresar un permiso a estado PENDIENTE.');
    }

    //  EJECUCIÓN: // Actualizar el estado del permiso en la base de datos
    try {
      return await permisoRepository.updateEstado(permisoId, nuevoEstado);
    } catch (error) {
      throw new Error('No se pudo actualizar el estado del permiso. Verifica si el permiso existe.', { cause: error });
    }
  }
};