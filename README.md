# Asistente de Seguimiento Académico

Prototipo web para apoyar a una coordinación universitaria en el análisis de solicitudes. Identifica datos, propone categoría y prioridad, detecta información faltante y genera una ficha para revisión humana.

**Autor:** Mtro. Salvador Guerrero Moreno.  
**Contexto:** Coordinación de Negocios y Mercadotecnia, UTVAM.  
**Aplicación:** [Abrir aplicación](https://app-asistente-seguimiento-academico-dev-e352.azurewebsites.net/).  
**Repositorio:** [GitHub](https://github.com/sguerrero-max/asistente-seguimiento-academico).  
**Documento del proyecto:** [ENTREGA.md](ENTREGA.md).  
**Fecha de documentación:** 6 de noviembre de 2026.

## Estado documentado

La evidencia compartida por el autor muestra App Service en estado Running, Linux, Node 24 LTS y plan F1 en Brazil South. La captura de Foundry muestra el proyecto `sguerrero-ia-3982`, agente `Proyecto-final-etapa-2`, versión 9 y modelo `gpt-4.1-mini`. La conversación de dos turnos desde la aplicación publicada fue documentada el 6 de noviembre de 2026. Estas observaciones no garantizan disponibilidad futura.

## Tecnologías y funcionamiento

- Interfaz HTML, CSS y JavaScript en `public/`.
- Backend Node.js con Express; dependencias y versiones declaradas en `package.json`, resolución en `package-lock.json`.
- `@azure/ai-projects` y `@azure/identity`: acceso al agente mediante `DefaultAzureCredential`.
- El backend crea una conversación en Foundry para el primer turno y reutiliza su identificador en los siguientes.
- El modelo se configura en el agente de Foundry. `server.js` invoca el agente por nombre; no selecciona directamente un modelo ni fija la versión 9.

## Archivos del paquete

| Ruta | Función |
|---|---|
| `server.js` | Servidor, validación de entrada e integración con Foundry. |
| `public/index.html`, `public/app.js`, `public/styles.css` | Interfaz y manejo de conversación. |
| `public/google1738dee9dc848128.html` | Archivo existente de verificación de propiedad; conservar en futuros despliegues. |
| `.github/` | Instrucciones de desarrollo y agentes de apoyo. Se preserva la capitalización del original. |
| `scripts/create-agent.js` | Ejemplo de creación de una versión de agente; no es necesario para usar el agente existente. |
| `infra/` | Archivos Bicep y parámetros recibidos del proyecto. |
| `.env.example`, `.gitignore` | Configuración de ejemplo y exclusiones. |
| `evidencias/` | Capturas aportadas por el autor e índice descriptivo. |

## Requisitos para ejecución local

Node.js 24 LTS con npm, Azure CLI para autenticación local y acceso autorizado al proyecto de Foundry con un agente configurado. Descomprima el paquete y abra una terminal en esta carpeta.

```powershell
npm ci
```

Si no existe `.env`, copie el ejemplo:

```powershell
Copy-Item .env.example .env
```

Edite `.env` con sus valores, conservando cualquier configuración existente:

```dotenv
FOUNDRY_PROJECT_ENDPOINT=https://<recurso>.services.ai.azure.com/api/projects/<proyecto>
FOUNDRY_AGENT_NAME=Proyecto-final-etapa-2
PORT=3000
```

Autentíquese con una cuenta que tenga permisos en el proyecto y arranque:

```powershell
az login
npm run dev
```

Abra [localhost](http://localhost:3000). `npm run dev` carga `.env`; `npm start` requiere que las variables ya estén disponibles en el entorno, como sucede en App Service. No publique `.env` ni coloque claves en la interfaz.

## Uso y prueba funcional

1. Escriba una solicitud ficticia y pulse Enviar o Ctrl + Enter.
2. Revise los datos identificados y las preguntas de aclaración.
3. Agregue la información faltante en la misma conversación.
4. Revise categoría, prioridad, justificaciones y siguiente acción. La coordinación decide la actuación posterior.
5. Nueva conversación limpia el contexto local y comienza sin el identificador anterior. No borra las conversaciones que pueda conservar Foundry.

Los mensajes admiten entre 1 y 2000 caracteres. Consulte el caso reproducible y sus resultados observados en [ENTREGA.md](ENTREGA.md).

## API del proyecto

| Ruta | Contrato |
|---|---|
| `GET /health` | Devuelve `{"status":"ok"}` cuando responde el servidor. No prueba conectividad ni permisos en Foundry. |
| `POST /api/chat` | JSON con `message` y `conversation_id` opcional; devuelve `reply` y `conversation_id`. |

El identificador puede omitirse, ser null o ser una cadena no vacía de hasta 256 caracteres. El cuerpo JSON tiene límite de 16 KB. El servidor valida entrada (422), JSON inválido (400), tamaño excesivo (413) y fallos de integración (502). No se incorporó autenticación de personas usuarias, autorización de acceso a conversaciones ni limitación de frecuencia.

## Configuración del hospedaje existente

La aplicación publicada usa Linux y Node 24 LTS. En App Service se configuran `FOUNDRY_PROJECT_ENDPOINT` y `FOUNDRY_AGENT_NAME`; el servidor utiliza el puerto del entorno y escucha en `0.0.0.0`. La identidad administrada necesita permisos de datos de Foundry además de estar habilitada. En la integración previamente documentada se añadió Foundry User en el proyecto tras un error 403 al crear conversaciones; Foundry Agent Consumer por sí solo no resolvió ese flujo. Verifique las asignaciones vigentes antes de reproducirlo.

Los archivos `infra/` son material de infraestructura recibido, no una reproducción autónoma completa: referencian un plan existente y no contienen toda la configuración de permisos ni el agente. No se ejecutaron durante la preparación de esta entrega. Este paquete documental no requiere redesplegar la aplicación.

## Script de creación de agente

`node --check scripts/create-agent.js` revisa sintaxis. Sin `--apply`, el código está diseñado para salir sin crear versiones, aunque sus importaciones requieren dependencias instaladas. Con `--apply`, puede crear una nueva versión con instrucciones mínimas; no reproduce las instrucciones completas ni las herramientas del agente documentado. No ejecutarlo con `--apply` sobre el agente actual para preparar la entrega. El valor predeterminado `gpt-4.1-mini` debe corresponder al nombre de un despliegue disponible si se adapta el ejemplo.

## Alcance y uso responsable

No hay base de datos de solicitudes, asignación automática de folios, envío de correos, autorizaciones ni reservas. El estado Pendiente es texto de la propuesta. La aplicación puede transmitir y conservar contenido en servicios de Foundry; la ausencia de base de datos propia no equivale a ausencia de almacenamiento en la nube. Use únicamente datos ficticios en esta demostración.

Las respuestas pueden contener errores; requieren revisión humana. No se midieron ahorros de tiempo, precisión general ni reducción de costos. El plan F1 no elimina los cargos por consumo del modelo. La disponibilidad depende del servicio y de sus cuotas.

Se reportó anteriormente una advertencia de seguridad del navegador. Las capturas de uso del 6 de noviembre muestran acceso a la aplicación sin esa pantalla, pero no constituyen resolución formal de la alerta ni auditoría de seguridad. Antes de compartir el enlace, comprobar acceso desde otro dispositivo; si aparece la advertencia, registrar la incidencia sin pedir al evaluador que desactive protecciones.

## Entrega académica

El documento principal es [ENTREGA.md](ENTREGA.md), con problema, solución, arquitectura, prueba de dos turnos, capturas y los seis principios de IA responsable. La consigna solicita un archivo Markdown y una aplicación accesible; GitHub y el ZIP son complementarios. No es necesario volver a desplegar para actualizar estos documentos.
