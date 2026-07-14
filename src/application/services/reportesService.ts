// src/application/services/reportesService.ts

import type { Operacion } from '../../domain/models/Operacion';
import type { Turno } from '../../domain/models/Turno';
import type { Vuelo } from '../../domain/models/Vuelo';
import { turnoRepository } from '../../infrastructure/repositories/turnoRepository.ts';
import { vueloRepository } from '../../infrastructure/repositories/vueloRepository.ts';
import { operacionRepository } from '../../infrastructure/repositories/operacionRepository.ts';

interface DetalleProgramacionAgente {
  fecha: string;
  horario: string;
}

interface ReporteProgramacionAgente {
  agenteId: string;
  mes: string;
  totalTurnos: number;
  detalleDiario: DetalleProgramacionAgente[];
}

interface ReporteOperativoMensual {
  mes: string;
  totalVuelos: number;
  vuelosCancelados: number;
  operacionesConIncidencia: number;
  detalleOperaciones: Operacion[];
}

export const reportesService = {
  async generarReporteProgramacionAgente(agenteId: string, mes: string): Promise<ReporteProgramacionAgente> {
    try {
      const turnosDelMes = await turnoRepository.getByAgenteYMes(agenteId, mes);

      if (turnosDelMes.length === 0) {
        throw new Error('El agente no tiene turnos programados para este mes.');
      }

      return {
        agenteId,
        mes,
        totalTurnos: turnosDelMes.length,
        detalleDiario: turnosDelMes.map((turno: Turno) => ({
          fecha: turno.horaInicio.slice(0, 10),
          horario: `${turno.horaInicio.slice(11, 16)} - ${turno.horaFin.slice(11, 16)}`,
        })),
      };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Error al generar el reporte de programación del agente.', { cause: error });
    }
  },

  async generarReporteOperativoMensual(mes: string): Promise<ReporteOperativoMensual> {
    try {
      const vuelosDelMes = await vueloRepository.getByMes(mes);
      const operacionesDelMes = await operacionRepository.getByMes(mes);

      const vuelosCancelados = vuelosDelMes.filter((vuelo: Vuelo) => vuelo.estado === 'CANCELLED').length;
      const operacionesConIncidencia = operacionesDelMes.filter((operacion: Operacion) => operacion.observaciones !== null).length;

      return {
        mes,
        totalVuelos: vuelosDelMes.length,
        vuelosCancelados,
        operacionesConIncidencia,
        detalleOperaciones: operacionesDelMes,
      };
    } catch (error) {
      throw new Error('No se pudo compilar el reporte operativo mensual.', { cause: error });
    }
  },
};
