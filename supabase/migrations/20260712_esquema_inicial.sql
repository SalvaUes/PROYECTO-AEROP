-- Habilitar la extensión para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Catálogo: Posiciones de Seguridad
CREATE TABLE posiciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    requiere_certificacion BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Catálogo: Aerolíneas
CREATE TABLE aerolineas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo_iata TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Entidad Principal: Agentes (Basado en tu modelo de Dominio)
CREATE TABLE agentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    foto_perfil_url TEXT,
    habilidades TEXT[] DEFAULT '{}', -- Arreglo de textos para las certificaciones
    esta_activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Logística: Vuelos
CREATE TABLE vuelos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aerolinea_id UUID REFERENCES aerolineas(id) ON DELETE CASCADE,
    numero_vuelo TEXT NOT NULL,
    hora_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    hora_real TIMESTAMP WITH TIME ZONE,
    estado TEXT DEFAULT 'ON_TIME' CHECK (estado IN ('ON_TIME', 'DELAYED', 'EARLY', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Operativa: Turnos (El resultado del algoritmo de asignación)
CREATE TABLE turnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id UUID REFERENCES agentes(id) ON DELETE CASCADE,
    posicion_id UUID REFERENCES posiciones(id) ON DELETE SET NULL,
    vuelo_id UUID REFERENCES vuelos(id) ON DELETE SET NULL, -- Opcional, si el turno es específico para un vuelo
    hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- Regla de integridad: Un turno debe terminar después de empezar
    CONSTRAINT check_tiempos CHECK (hora_fin > hora_inicio) 
);

-- 6. Ausencias: Permisos y Vacaciones
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id UUID REFERENCES agentes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('VACACIONES', 'INCAPACIDAD', 'FALTA_INJUSTIFICADA', 'PERMISO_ESPECIAL')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar Row Level Security (RLS) en todas las tablas por seguridad
ALTER TABLE posiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE aerolineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vuelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;