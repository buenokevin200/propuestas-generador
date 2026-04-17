# Editor Colaborativo Basado en Templates Visuales y Chat con IA

> Herramienta colaborativa tipo Canva donde los usuarios seleccionan secciones editables (placeholders) de documentos visuales (.docx, .pptx) y, mediante un chat integrado con IA, describen lo que necesitan en cada sección. La IA interpreta la solicitud y modifica únicamente esa parte del documento, manteniendo el diseño original intacto.

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Características Principales](#2-características-principales)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Flujo de Uso](#5-flujo-de-uso)
6. [Especificación de Placeholders](#6-especificación-de-placeholders)
7. [Integración con IA](#7-integración-con-ia)
8. [Especificación de API](#8-especificación-de-api)
9. [Tipos de Archivos Soportados](#9-tipos-de-archivos-soportados)
10. [Seguridad y Validación](#10-seguridad-y-validación)
11. [Requisitos No Funcionales](#11-requisitos-no-funcionales)
12. [Casos Límite y Manejo de Errores](#12-casos-límite-y-manejo-de-errores)
13. [Criterios de Aceptación](#13-criterios-de-aceptación)
14. [Dependencias Externas](#14-dependencias-externas)

---

## 1. Descripción General

Esta herramienta combina una interfaz visual tipo Canva con generación de contenido impulsada por IA. El usuario puede:

- Cargar un documento editable (DOCX, PPTX).
- Ver el documento en pantalla como plantilla visual editable.
- Seleccionar secciones marcadas como editables (placeholders).
- Usar un chat lateral para describir lo que necesita en esa sección.
- Ver la actualización automática del contenido generado por IA en tiempo real.

Ideal para profesionales que requieren personalizar rápidamente documentos sin perder tiempo en edición manual.

---

## 2. Características Principales

| Característica | Descripción |
|---|---|
| Vista previa tipo Canva | Renderizado visual fiel del documento cargado |
| Selección de placeholders | Resaltado interactivo de secciones editables |
| Chat con IA | Panel lateral para describir cambios en lenguaje natural |
| Edición dirigida | La IA modifica únicamente la sección seleccionada |
| Vista previa en tiempo real | El documento se actualiza tras cada edición |
| Exportación | Descarga del documento editado en su formato original |

---

## 3. Stack Tecnológico

### Frontend
- **Framework:** React 18+
- **Renderizado de documentos:** `mammoth.js` (DOCX → HTML), `pptx-preview` o renderizado custom (PPTX)
- **Estilos:** TailwindCSS
- **Estado global:** Zustand o Redux Toolkit
- **Comunicación en tiempo real:** WebSockets (Socket.io) o polling optimista

### Backend
- **Lenguaje:** Python 3.11+
- **Framework:** FastAPI
- **Procesamiento DOCX:** `python-docx`
- **Procesamiento PPTX:** `python-pptx`
- **Cola de tareas:** Celery + Redis (para llamadas asíncronas a IA)
- **Base de datos:** PostgreSQL (sesiones, documentos, historial de ediciones)
- **Almacenamiento de archivos:** S3 o equivalente (AWS S3, MinIO)

### IA
### IA
- **Modelo principal:** DeepSeek (deepseek-chat)
- **Integración:** OpenAI SDK compatible
- **Orquestación de prompts:** Custom prompt builder interno

---

## 4. Arquitectura del Sistema

### 4.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                        FRONTEND                         │
│  ┌──────────────────┐       ┌─────────────────────────┐ │
│  │  Vista Documento  │◄─────►│     Panel de Chat       │ │
│  │  (Canvas Visual)  │       │  (Selección + Mensajes) │ │
│  └────────┬─────────┘       └───────────┬─────────────┘ │
└───────────┼───────────────────────────────┼─────────────┘
            │ REST / WebSocket              │
┌───────────┼───────────────────────────────┼─────────────┐
│                        BACKEND                          │
│  ┌────────▼─────────┐       ┌─────────────▼───────────┐ │
│  │  Document Parser  │       │      Edit Controller    │ │
│  │  (DOCX / PPTX)   │       │  (Valida + Orquesta IA) │ │
│  └────────┬─────────┘       └───────────┬─────────────┘ │
│           │                             │               │
│  ┌────────▼─────────────────────────────▼─────────────┐ │
│  │              Placeholder Registry                   │ │
│  │         (Mapa de secciones editables)               │ │
│  └─────────────────────────┬───────────────────────────┘ │
└────────────────────────────┼────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                      IA SERVICE                         │
│  ┌─────────────────┐   ┌────────────────────────────┐   │
│  │  Prompt Builder  │   │   Response Validator       │   │
│  │  (Contexto +     │──►│   (Longitud, formato,      │   │
│  │   Restricciones) │   │    seguridad)              │   │
│  └─────────────────┘   └────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Frontend (Interfaz tipo Canva)

- Renderizado visual del documento (DOCX/PPTX) en el navegador
- Detección y resaltado de secciones editables con borde interactivo
- Panel lateral con historial de chat por placeholder
- Vista previa optimista: actualiza la UI antes de confirmar el backend
- Indicador de estado de edición (cargando / éxito / error)

### 4.3 Backend

- **Detección de placeholders:** Parser que reconoce patrones definidos en §6
- **Placeholder Registry:** Almacena el mapa `{placeholder_id → posición en documento}` por sesión
- **API de Edición:** Endpoints REST para recibir solicitudes de edición desde el chat (ver §8)
- **Integración con IA:** Llamadas asíncronas al modelo con cola Redis/Celery
- **Control de Edición:** Solo se permite modificar secciones del Placeholder Registry; el resto del documento es inmutable

### 4.4 IA Modular

**Entrada al modelo:**
```json
{
  "placeholder_id": "descripcion_del_servicio",
  "placeholder_type": "paragraph",
  "user_message": "Necesito una descripción corta sobre consultoría en transformación digital.",
  "document_context": {
    "title": "Propuesta Comercial",
    "industry": "Tecnología",
    "tone": "profesional",
    "language": "es"
  },
  "constraints": {
    "max_chars": 500,
    "min_chars": 50,
    "format": "plain_text"
  }
}
```

**Salida esperada:**
```json
{
  "generated_content": "Acompañamos a organizaciones en su...",
  "char_count": 312,
  "confidence": 0.97,
  "warnings": []
}
```

---

## 5. Flujo de Uso

### 5.1 Paso a Paso

1. **Usuario carga plantilla** (DOCX, PPTX) desde la interfaz.
2. **Sistema analiza y detecta placeholders editables** — genera el Placeholder Registry.
3. **Sistema renderiza el documento** con placeholders resaltados visualmente.
4. **Usuario selecciona una sección** (ej. `<<descripcion_del_servicio>>`).
5. **Panel de chat se activa** para esa sección específica.
6. **Usuario escribe en el chat:** _"Necesito una descripción corta sobre consultoría en transformación digital."_
7. **Backend construye el prompt** con contexto del documento y restricciones del placeholder.
8. **IA genera el texto** y lo retorna al backend.
9. **Backend valida la respuesta** (longitud, formato, seguridad).
10. **Frontend actualiza la vista previa** con el contenido generado.
11. **Usuario acepta o solicita ajustes** desde el mismo chat.
12. **Usuario repite para otras secciones** o exporta el documento finalizado.

### 5.2 Diagrama de Secuencia

```
Usuario      Frontend       Backend        IA Service
  │               │               │               │
  │──Carga doc───►│               │               │
  │               │──Parse doc───►│               │
  │               │◄──Registry────│               │
  │◄─Renderizado──│               │               │
  │               │               │               │
  │──Selecciona──►│               │               │
  │  placeholder  │               │               │
  │               │               │               │
  │──Mensaje chat►│               │               │
  │               │──POST /edit──►│               │
  │               │               │──Prompt──────►│
  │               │               │◄──Respuesta───│
  │               │               │  (validada)   │
  │               │◄──Contenido───│               │
  │◄─Vista previa─│               │               │
  │               │               │               │
  │──Exportar────►│               │               │
  │               │──GET /export─►│               │
  │◄─Archivo──────│◄──Archivo─────│               │
```

---

## 6. Especificación de Placeholders

### 6.1 Sintaxis Canónica por Formato

Para evitar ambigüedades, se define **una única sintaxis canónica** por tipo de archivo:

| Formato | Sintaxis canónica | Ejemplo |
|---|---|---|
| DOCX | `<<nombre_seccion>>` | `<<descripcion_empresa>>` |
| PPTX | `[nombre_seccion]` | `[titulo_slide]` |

> ⚠️ La sintaxis `{nombre_seccion}` queda **deprecada** y no será soportada en v1.0.

### 6.2 Reglas de Nomenclatura

- Solo letras minúsculas, números y guiones bajos (`_`)
- Sin espacios, acentos ni caracteres especiales
- Longitud: entre 3 y 50 caracteres
- Debe ser único dentro del mismo documento

**Válidos:**
```
<<descripcion_servicio>>
<<titulo_principal>>
[slide_intro_texto]
[chart_q3_label]
```

**Inválidos:**
```
<<Descripción del Servicio>>   ← espacios y acento
[título]                       ← acento
<<ab>>                         ← muy corto (< 3 chars)
<<x>> (duplicado)              ← nombre repetido en el doc
```

### 6.3 Atributos Opcionales de Placeholder

Los placeholders pueden incluir metadatos como comentario en el documento:

```
<<descripcion_servicio|max:500|min:50|tone:profesional>>
[titulo_slide|max:80|format:title_case]
```

| Atributo | Tipo | Descripción |
|---|---|---|
| `max` | int | Máximo de caracteres permitidos |
| `min` | int | Mínimo de caracteres requeridos |
| `tone` | string | Tono esperado: `formal`, `casual`, `técnico` |
| `format` | string | Formato: `plain_text`, `title_case`, `bullet_list` |
| `language` | string | Idioma: `es`, `en`, `pt` (default: `es`) |

### 6.4 Ejemplo Completo en Documento

**En un DOCX:**
```
Empresa: <<nombre_empresa>>

<<descripcion_empresa|max:300|tone:profesional>>

Fecha de emisión: <<fecha_actual|format:date>>
```

**En un PPTX (slide):**
```
Título:       [titulo_principal|max:80]
Subtítulo:    [subtitulo_slide|max:120]
Descripción:  [descripcion_producto|max:400|tone:comercial]
Pie de página: [fecha_pie|format:date]
```

---

## 7. Integración con IA

### 7.1 Template de Prompt

```
Eres un asistente especializado en redacción de contenido para documentos profesionales.

CONTEXTO DEL DOCUMENTO:
- Tipo: {document_type}
- Título: {document_title}
- Industria: {industry}
- Idioma: {language}

SECCIÓN A COMPLETAR:
- Identificador: {placeholder_id}
- Tipo de contenido: {content_type}

RESTRICCIONES OBLIGATORIAS:
- Longitud: entre {min_chars} y {max_chars} caracteres
- Tono: {tone}
- Formato de salida: {format}
- NO incluyas el identificador del placeholder en tu respuesta
- NO uses markdown si el formato es plain_text
- Responde ÚNICAMENTE con el contenido solicitado, sin explicaciones adicionales

SOLICITUD DEL USUARIO:
{user_message}

SECCIONES YA COMPLETADAS (para mantener coherencia):
{completed_sections_context}
```

### 7.2 Manejo de Respuestas

| Escenario | Acción |
|---|---|
| Respuesta dentro de límites | Insertar contenido y actualizar vista previa |
| Respuesta excede `max_chars` | Truncar en el último punto completo antes del límite |
| Respuesta menor a `min_chars` | Reintentar con instrucción de extensión (1 retry automático) |
| IA no responde en 15s | Activar modelo de fallback (GPT-4o) |
| Fallback también falla | Retornar error al usuario con opción de reintentar |
| Contenido con PII o contenido sensible | Filtrar y solicitar reformulación |

### 7.3 Contexto entre Secciones

Para mantener coherencia narrativa, el backend incluye en el prompt las últimas 3 secciones completadas del mismo documento (ordenadas por posición en el documento), sin exceder 1,000 tokens de contexto adicional.

### 7.4 Historial de Chat por Placeholder

Cada placeholder mantiene su propio historial de conversación independiente. El usuario puede solicitar ajustes iterativos dentro del mismo placeholder sin reiniciar el contexto.

---

## 8. Especificación de API

### 8.1 `POST /api/v1/documents/upload`

Carga un documento y retorna el Placeholder Registry.

**Request:**
```
Content-Type: multipart/form-data
Body: file (DOCX o PPTX, max 20MB)
```

**Response 200:**
```json
{
  "document_id": "doc_abc123",
  "filename": "propuesta_comercial.docx",
  "format": "docx",
  "placeholders": [
    {
      "id": "descripcion_empresa",
      "raw": "<<descripcion_empresa|max:300>>",
      "position": { "page": 1, "paragraph": 4 },
      "constraints": { "max_chars": 300, "min_chars": 30, "tone": "profesional" },
      "current_value": null
    }
  ],
  "preview_url": "https://storage.example.com/previews/doc_abc123.png"
}
```

**Errores:**
```json
{ "error": "UNSUPPORTED_FORMAT", "message": "Solo se aceptan archivos .docx y .pptx" }
{ "error": "FILE_TOO_LARGE", "message": "El archivo supera el límite de 20MB" }
{ "error": "NO_PLACEHOLDERS_FOUND", "message": "El documento no contiene placeholders válidos" }
{ "error": "CORRUPTED_FILE", "message": "El archivo no puede ser procesado" }
```

---

### 8.2 `POST /api/v1/documents/{document_id}/edit`

Solicita la edición de un placeholder mediante IA.

**Request:**
```json
{
  "placeholder_id": "descripcion_empresa",
  "user_message": "Necesito una descripción corta sobre consultoría en transformación digital.",
  "chat_history": [
    { "role": "user", "content": "Hazla más formal" },
    { "role": "assistant", "content": "Acompañamos a organizaciones..." }
  ]
}
```

**Response 200:**
```json
{
  "placeholder_id": "descripcion_empresa",
  "generated_content": "Acompañamos a organizaciones en su proceso de transformación digital, diseñando estrategias que integran tecnología, procesos y talento humano para alcanzar resultados sostenibles.",
  "char_count": 198,
  "model_used": "deepseek-chat",
  "warnings": []
}
```

**Errores:**
```json
{ "error": "PLACEHOLDER_NOT_FOUND", "message": "El placeholder indicado no existe en este documento" }
{ "error": "PLACEHOLDER_NOT_EDITABLE", "message": "Esta sección no está marcada como editable" }
{ "error": "AI_TIMEOUT", "message": "La IA no respondió a tiempo. Intenta nuevamente." }
{ "error": "AI_CONTENT_FILTERED", "message": "El contenido solicitado no pudo ser generado. Reformula tu solicitud." }
```

---

### 8.3 `GET /api/v1/documents/{document_id}/export`

Exporta el documento con todos los placeholders reemplazados.

**Response 200:**
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="propuesta_comercial_editado.docx"
Body: <binary>
```

**Errores:**
```json
{ "error": "INCOMPLETE_DOCUMENT", "message": "Aún hay placeholders sin completar", "pending": ["fecha_actual", "firma"] }
{ "error": "DOCUMENT_NOT_FOUND", "message": "Sesión expirada o documento no encontrado" }
```

---

### 8.4 `GET /api/v1/documents/{document_id}/status`

Retorna el estado de edición del documento.

**Response 200:**
```json
{
  "document_id": "doc_abc123",
  "total_placeholders": 8,
  "completed": 5,
  "pending": ["fecha_actual", "firma", "precio_total"],
  "last_edited_at": "2025-04-15T10:32:00Z"
}
```

---

## 9. Tipos de Archivos Soportados

| Formato | Estado | Notas |
|---|---|---|
| DOCX (Word) | ✅ Soportado | Placeholders en texto y tablas |
| PPTX (PowerPoint) | ✅ Soportado | Placeholders en cuadros de texto y títulos |
| XLSX (Excel) | ⏳ Próximamente | Placeholders en celdas |
| PDF | ❌ No soportado | Solo lectura, sin edición |
| Google Docs | ⏳ En evaluación | Requiere integración OAuth |

---

## 10. Seguridad y Validación

### 10.1 Validación de Archivos Subidos

| Check | Descripción |
|---|---|
| Extensión | Solo `.docx` y `.pptx` permitidos |
| MIME Type | Validación real del tipo MIME, no solo la extensión |
| Tamaño | Máximo 20 MB por archivo |
| Escaneo antivirus | ClamAV o equivalente antes de procesar |
| Contenido ejecutable | Rechazo de macros VBA embebidas en DOCX/PPTX |

### 10.2 Sanitización del Contenido Generado por IA

- El contenido generado por la IA se sanitiza para eliminar HTML/scripts antes de insertarse en el documento.
- No se permite que la IA genere placeholders nuevos dentro de su respuesta.
- El contenido se valida contra la lista de restricciones del placeholder (longitud, formato) antes de insertarse.

### 10.3 Control de Acceso

- Los documentos están asociados a una sesión autenticada (JWT).
- Solo el propietario de la sesión puede editar o exportar su documento.
- Los documentos se eliminan del almacenamiento a las 24 horas de inactividad.
- Las URLs de preview son firmadas y expiran en 1 hora.

### 10.4 Rate Limiting

| Endpoint | Límite |
|---|---|
| `POST /upload` | 10 uploads / hora / usuario |
| `POST /edit` | 60 solicitudes / hora / usuario |
| `GET /export` | 20 exports / hora / usuario |

---

## 11. Requisitos No Funcionales

| Requisito | Valor objetivo |
|---|---|
| Tiempo de respuesta de edición con IA | < 8 segundos (p95) |
| Tiempo de carga de documento | < 3 segundos para archivos ≤ 5 MB |
| Disponibilidad del servicio | 99.5% mensual |
| Usuarios concurrentes editando | 500 simultáneos |
| Tamaño máximo de archivo | 20 MB |
| Retención de documentos | 24 horas tras última actividad |
| Compatibilidad de navegadores | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ |
| Accesibilidad | WCAG 2.1 nivel AA |

---

## 12. Casos Límite y Manejo de Errores

| Caso | Comportamiento esperado |
|---|---|
| Documento sin placeholders | Error `NO_PLACEHOLDERS_FOUND` con sugerencia de formato correcto |
| Placeholder duplicado en el doc | El sistema enumera automáticamente: `<<titulo>>` → `<<titulo_1>>`, `<<titulo_2>>` |
| Placeholder dentro de una imagen | Se ignora (no detectable); se documenta en limitaciones |
| Respuesta IA excede `max_chars` | Se trunca en el último punto antes del límite; se notifica al usuario |
| Timeout de IA (> 15s) | Se activa modelo de fallback; si también falla, error con opción de reintentar |
| Archivo corrupto | Error `CORRUPTED_FILE` con instrucciones de cómo re-exportar el archivo |
| Sesión expirada durante edición | El estado del documento se guarda automáticamente; el usuario puede reanudar |
| Solicitud de PII en chat (ej. DNI, tarjeta) | El contenido es bloqueado por el filtro de contenido y se solicita reformulación |
| Export con placeholders pendientes | Se retorna lista de placeholders sin completar; el usuario decide si exportar de todas formas |

---

## 13. Criterios de Aceptación

### Feature: Carga de documento

```gherkin
Given un usuario autenticado
When sube un archivo .docx válido con placeholders
Then el sistema detecta todos los placeholders
And muestra el documento renderizado con secciones resaltadas
And retorna el Placeholder Registry completo

Given un usuario autenticado
When sube un archivo mayor a 20 MB
Then el sistema rechaza el archivo
And muestra el mensaje "El archivo supera el límite de 20MB"
```

### Feature: Edición con IA

```gherkin
Given un documento cargado con el placeholder <<descripcion_empresa>>
When el usuario selecciona el placeholder y escribe "Describe una empresa de software B2B"
Then la IA genera un texto dentro de los límites definidos
And el documento se actualiza en la vista previa
And el texto generado respeta el tono y formato del placeholder

Given que la IA tarda más de 15 segundos en responder
When se activa el modelo de fallback
Then el usuario recibe el resultado del modelo alternativo
And se muestra un indicador sutil de que se usó un modelo alternativo
```

### Feature: Exportación

```gherkin
Given un documento con todos los placeholders completados
When el usuario solicita exportar
Then descarga el archivo en su formato original (.docx o .pptx)
And el diseño original del documento se mantiene intacto
And los placeholders han sido reemplazados por el contenido generado

Given un documento con placeholders sin completar
When el usuario solicita exportar
Then el sistema informa cuáles placeholders están pendientes
And permite al usuario decidir si exportar de todas formas o completarlos primero
```

---

## 14. Dependencias Externas

| Dependencia | Versión | Uso |
|---|---|---|
| `python-docx` | ≥ 1.1.0 | Parseo y escritura de archivos DOCX |
| `python-pptx` | ≥ 0.6.23 | Parseo y escritura de archivos PPTX |
| `mammoth` (JS) | ≥ 1.6.0 | Renderizado de DOCX en el navegador |
| `openai` (Python SDK) | ≥ 1.30.0 | Integración con DeepSeek API (Compatible) |
| `celery` | ≥ 5.3.0 | Cola de tareas asíncronas |
| `redis` | ≥ 7.0 | Backend de Celery y caché |
| `fastapi` | ≥ 0.111.0 | Framework de API REST |
| `ClamAV` | ≥ 1.3 | Escaneo antivirus de archivos subidos |
| `PostgreSQL` | ≥ 15 | Persistencia de sesiones y registros |

## 15. Despliegue en Infraestructura (Coolify)

El despliegue de la aplicación se ejecuta orquestadamente sobre Coolify v4 mediante `docker-compose.yml`, con proxy reverso interno Traefik. Se han adoptado las siguientes configuraciones críticas operativas:

### 15.1 Limitaciones del Proxy (Nginx + Traefik)
- **Archivos Grandes:** Nginx ha sido reconfigurado para permitir subidas pesadas (`client_max_body_size 50M;`), mitigando el bloqueo por defecto de plantillas Word/PPTX.
- **Tiempos de Espera (Timeouts):** Dado que la generación de IA por DeepSeek puede tardar varios segundos, el `proxy_read_timeout` se expandió a 300 segundos, previniendo cierres de conexión prematuros.

### 15.2 Troubleshooting Clásico en Coolify
| Error | Causa | Solución Implementada |
|---|---|---|
| `host not found in upstream "colaborativo_backend"` | Nginx no logra resolver el alias de un contenedor que aún arranca. | Nginx debe apuntar específicamente al alias DNS del Docker Compose (`http://backend:8000`), el cual es inyectado desde el inicio. |
| `Status 404 page not found` | Traefik oculta/ignora el contenedor o rechaza la URL. | 1. Eliminar puertos estrictos en la declaración del dominio en Coolify (prohibido usar sufijos `:80`). 2. Asegurarse que el contendor no reesté catalogado iterativamente como `unhealthy` por healthchecks defectuosos de Alpine (ej. fallos por carecer de IPV6 local en `wget`). |

---

*Versión del documento: 1.1.0 — Última actualización: Abril 2026*
*Estado: En Producción (Coolify)*
