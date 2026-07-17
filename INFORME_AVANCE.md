# Informe de Avance - E-book Reader

## Resumen Ejecutivo

Aplicación web de lectura de libros electrónicos (EPUB, PDF, Audio) con backend en Node.js/Express + MongoDB y frontend en React + TypeScript. Desplegada en Render.

---

## Funcionalidades Implementadas

### 1. Autenticación y Usuarios
- **Registro e inicio de sesión** con JWT (7 días de expiración)
- **Auto-login** vía URL: `/auth?token=...`
- **Perfil de usuario**: editar nombre y cambiar contraseña
- **Persistencia de sesión** en localStorage
- Roles: `user` y `admin` (el primer usuario registrado es admin automáticamente)

### 2. Biblioteca
- Vista tipo grid con portadas de libros
- **Filtros** por formato: EPUB, PDF, Audio
- **Carga de archivos** (EPUB, PDF, MP3, M4A)
- **Libros demo** precargados con un clic
- **Barra de progreso** por libro (% leído/escuchado)
- **Portadas persistentes**: se obtienen de OpenLibrary y se guardan en MongoDB
- **Modal de detalle** por libro con descripción

### 3. Lector EPUB
- Renderizado con `react-book-reader` (foliate-js)
- **Tabla de contenidos** (TOC) navegable
- **Ajustes de lectura**:
  - Tipografía: serif, sans-serif, mono
  - Interlineado ajustable
  - Temas: blanco, sepia, oscuro
- **Resaltado de texto**: seleccionar texto → botón "Resaltar"
- **Persistencia de resaltados** en MongoDB
- **Pantalla completa**

### 4. Panel de Notas y Marcadores (Sidebar)
- Notas por página con color
- Resaltados visibles
- Marcadores con etiqueta personalizada
- Tres pestañas: Notas, Resaltados, Marcadores

### 5. Búsqueda de Texto
- Backend: extrae y busca texto dentro del EPUB usando `adm-zip`
- Frontend: modal de búsqueda con resultados y snippets
- Navegación directa al capítulo donde aparece el texto

### 6. Estadísticas de Lectura
- **Tiempo de lectura** acumulado por libro y total
- Libros completados
- Progreso promedio
- Actividad reciente (últimos 7 días)

### 7. Panel de Administración
- **Gestión de usuarios**: cambiar rol (user/admin), activar/desactivar cuentas
- **Gestión de libros**: listar todos los libros de todos los usuarios, eliminar
- Solo accesible para usuarios con rol `admin`

### 8. Webhooks
- Endpoints para integración con Clerk (autenticación externa)
- Webhooks para: registro, login, logout y sync
- Middleware HMAC de verificación

### 9. Libro Enriquecido: Don Quijote
- EPUB generado automáticamente con:
  - Texto completo de la obra (dominio público)
  - Análisis y comentarios por capítulo
  - Ilustraciones
- Descargable desde URL remota

### 10. Audio
- Reproductor de audio MP3/M4A
- Guardado de progreso cada 15 segundos
- Persistencia de posición al reanudar

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 19, TypeScript, Vite 8 |
| Backend | Node.js, Express, TypeScript |
| Base de datos | MongoDB (Mongoose) |
| Estado | Zustand |
| Ruteo | React Router v7 |
| Lector EPUB | react-book-reader (foliate-js) |
| Lector PDF | react-pdf |
| Despliegue | Render (Node) |

---

## Pendientes

- **Audio Stage 2**: funcionalidades avanzadas de audio (velocidad, temporizador, capítulos)

---

## Diagrama de Arquitectura (Texto)

```
[Cliente] → React App (Vite) → API REST (Express) → MongoDB
                                    ↕
                              File System (EPUBs)
```

## URL del Proyecto

- Producción: https://ebook-reader.onrender.com (o la URL asignada por Render)
- Repositorio: https://github.com/luisvargasagencsi2024-glitch/ebook-reader
