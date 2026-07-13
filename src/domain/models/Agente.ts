export interface Agente {
  id: string;
  nombre: string;
  apellidos: string;
  fotoPerfilUrl?: string; // El símbolo "?" significa que es opcional
  fotoPerfilURL?: string; // Alias compatible con el mismo campo
  habilidades: string[];  // Un arreglo de textos (ej. "Rayos X", "Patrullaje")
  estaActivo: boolean;
}

//subiendo prueba DE SUBIDA