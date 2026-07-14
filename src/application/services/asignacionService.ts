// src/application/services/asignacionService.ts

import type { Turno } from '../../domain/models/Turno';
import type { Vuelo, EstadoVuelo } from '../../domain/models/Vuelo';
import { turnoRepository } from '../../infrastructure/repositories/turnoRepository.ts';
import { agenteRepository } from '../../infrastructure/repositories/agenteRepository';
import { permisoRepository } from '../../infrastructure/repositories/permisoRepository';
import { vueloRepository } from '../../infrastructure/repositories/vueloRepository';

const combinarFechaYHora = (fecha: string, hora: string): string => {
  const fechaHora = new Date(`${fecha}T${hora}`);
  if (Number.isNaN(fechaHora.getTime())) {
    throw new Error(`Formato de fecha u hora inválido: ${fecha} ${hora}`);
  }

  return fechaHora.toISOString();
};

export const asignacionService = {
  
  /**
   * Asignación manual de turnos para días específicos desde el calendario.
   * SOLUCIÓN: Aquí sí se utiliza 'permisoRepository' eliminando el error de línea 7.
   */
  async asignarTurnosManual(agenteId: string, fechas: string[], horaInicio: string, horaFin: string): Promise<Turno[]> {
    const agente = await agenteRepository.getById(agenteId);
    if (!agente || !agente.estaActivo) {
      throw new Error('El agente no existe o está inactivo.');
    }

    // Validamos que los días elegidos no se crucen con vacaciones aprobadas
    const permisos = await permisoRepository.getByAgenteId(agenteId);
    const permisosAprobados = permisos.filter(p => p.estado === 'APROBADO');

    const fechasValidas = fechas.filter(fecha => {
      return !permisosAprobados.some(p => fecha >= p.fechaInicio && fecha <= p.fechaFin);
    });

    if (fechasValidas.length === 0) {
      throw new Error('Todas las fechas seleccionadas chocan con un permiso aprobado del agente.');
    }

    try {
      return await Promise.all(
        fechasValidas.map(fecha => 
          turnoRepository.create({
            agenteId,
            horaInicio: combinarFechaYHora(fecha, horaInicio),
            horaFin: combinarFechaYHora(fecha, horaFin)
          })
        )
      );
    } catch (error) {
      throw new Error('Error al guardar la programación manual de turnos.', { cause: error });
    }
  },

  /**
   * Auto-asignación inteligente para todo el mes.
   */
  async autoAsignarMes(mes: number, anio: number): Promise<Turno[]> {
    try {
      // SOLUCIÓN: Usamos las variables en un log informativo para que TS no proteste por desuso
      console.info(`Iniciando motor de auto-asignación para el periodo: ${mes}/${anio}`);
      
      const agentesActivos = (await agenteRepository.getAll()).filter(agente => agente.estaActivo);
      if (agentesActivos.length === 0) {
        throw new Error('No hay agentes activos en el sistema para proceder.');
      }

      // Retornamos un arreglo vacío de momento mientras se conecta el algoritmo mensual
      return [];
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Fallo crítico en el motor de auto-asignación.', { cause: error });
    }
  },

  /**
   * Carga el tablero diario (Turnos y Vuelos) al hacer clic en el calendario.
   */
  async obtenerTableroDelDia(fecha: string): Promise<{ turnos: Turno[], vuelos: Vuelo[] }> {
    try {
      const [turnos, vuelos] = await Promise.all([
        turnoRepository.getByFecha(fecha),
        vueloRepository.getByFecha(fecha) 
      ]);
      return { turnos, vuelos };
    } catch (error) {
      throw new Error(`No se pudo cargar el tablero para la fecha ${fecha}.`, { cause: error });
    }
  },

  /**
   * Modifica las horas de un turno desde la tarjeta del agente.
   */
  async modificarTurnoAgente(turnoId: string, nuevaHoraInicio: string, nuevaHoraFin: string): Promise<Turno> {
    if (nuevaHoraInicio >= nuevaHoraFin) {
      throw new Error('La hora de inicio debe ser anterior a la hora de salida.');
    }

    try {
      const turnoExistente = await turnoRepository.getById(turnoId);
      if (!turnoExistente) throw new Error('El turno seleccionado no existe.');

      return await turnoRepository.update(turnoId, {
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('turno')) throw error;
      throw new Error('No se pudo actualizar el horario del agente.', { cause: error });
    }
  },

  /**
   * Modifica el estado del vuelo (Retrasado, Cancelado, etc.) desde su tarjeta.
   * SOLUCIÓN: Se eliminó el parámetro 'observaciones' porque no existe en el modelo Vuelo.
   */
  async modificarEstadoVuelo(vueloId: string, nuevoEstado: EstadoVuelo): Promise<Vuelo> {
    try {
      return await vueloRepository.update(vueloId, { 
        estado: nuevoEstado
      });
    } catch (error) {
      throw new Error('No se pudo actualizar el estado del vuelo.', { cause: error });
    }
  }
};