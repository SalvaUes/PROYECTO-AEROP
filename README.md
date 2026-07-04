# SGPS - Sistema de Gestión de Personal de Seguridad

Sistema web para la gestión eficiente de personal de seguridad aeroportuaria. Permite la asignación inteligente de turnos, gestión de catálogos (Agentes, Aerolíneas, Posiciones) y logística de vuelos, evitando solapamientos de horarios y controlando ausencias.

## 🚀 Stack Tecnológico

Este proyecto ha sido migrado de un monolito Java/Spring Boot hacia una arquitectura moderna, sin servidor (Serverless) y altamente escalable:

* **Frontend:** React 18 + TypeScript + Vite
* **Estilos:** Tailwind CSS v4
* **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, Storage)
* **Arquitectura:** Clean Architecture (Separación estricta por capas)

## 📁 Estructura del Proyecto (Clean Architecture)

El código fuente (`/src`) está organizado en 4 capas fundamentales para garantizar bajo acoplamiento y alta cohesión:

* `domain/`: Reglas de negocio puras, interfaces y modelos de datos (ej. `Agente`, `Turno`). Independiente de cualquier framework.
* `application/`: Casos de uso de la aplicación. Actúa como orquestador entre el dominio y la infraestructura.
* `infrastructure/`: Implementaciones externas (Llamadas a la API de Supabase, repositorios, adaptadores).
* `presentation/`: Interfaz de usuario (Componentes de React, Hooks, UI, Tailwind).

## 🛠️ Instalación y Desarrollo Local

1. Clonar el repositorio: `git clone <URL_DEL_REPO>`
2. Instalar dependencias: `npm install`
3. Levantar servidor de desarrollo: `npm run dev`