---
name: 'Backend Express - Seguimiento Académico'
description: 'Usar al crear o modificar el backend Node.js del Asistente de Seguimiento Académico conectado con Microsoft Foundry.'
applyTo: 'server.js,scripts/**'
---

# Reglas del backend

## Tecnologías

- Utiliza Node.js 24 LTS, Express 5 y JavaScript con ES Modules.
- Usa async/await.
- Utiliza @azure/ai-projects 2.x y @azure/identity.
- No utilices @azure/ai-agents ni la API 1.x.
- No agregues dependencias nuevas sin mencionarlas en el plan.
- Declara en package.json todas las dependencias importadas.

## Inicialización y configuración

- Crea AIProjectClient y el cliente de OpenAI una sola vez al iniciar el servidor, no en cada solicitud.
- Obtén el cliente de OpenAI mediante getOpenAIClient().
- Autentica con DefaultAzureCredential.
- Lee FOUNDRY_PROJECT_ENDPOINT y FOUNDRY_AGENT_NAME desde variables de entorno.
- Si falta configuración indispensable, muestra un error local claro sin revelar valores sensibles y detén el inicio.
- No escribas claves, tokens ni valores reales de configuración en el código.
- No sobrescribas ni muestres el contenido de .env.
- En Azure utiliza identidad administrada; en local, credenciales de desarrollo compatibles.
- Mantén el agente existente y su modelo gpt-4.1-mini. No crees agentes ni modifiques sus instrucciones desde el backend.

## Rutas y servidor

- Resuelve rutas de archivos con import.meta.dirname, no con el directorio actual.
- Sirve únicamente public/ como contenido estático en /.
- No expongas la raíz del proyecto, .env ni archivos de configuración.
- Implementa POST /api/chat y GET /health.
- Escucha en process.env.PORT, con 3000 como valor local predeterminado.
- Escucha en 0.0.0.0 para funcionar en Azure App Service.

## Conversaciones con Foundry

- El navegador nunca se comunica directamente con Foundry.
- Todas las llamadas al SDK se realizan desde el backend.
- Si no llega conversation_id, crea una conversación con openai.conversations.create().
- Si llega un conversation_id válido, reutilízalo para mantener el contexto.
- No mantengas un identificador de conversación global compartido entre usuarios.
- Invoca openai.responses.create({ conversation, input }, agentRef).
- Referencia al agente en cada llamada mediante:
  { body: { agent_reference: { name: AGENT_NAME, type: "agent_reference" } } }
- AGENT_NAME proviene de FOUNDRY_AGENT_NAME.
- Devuelve la respuesta real desde response.output_text.
- Si no existe una respuesta textual utilizable, trata el resultado como error; no inventes una respuesta de respaldo.
- No dupliques las instrucciones completas del agente en cada llamada.

## Contrato de la API

POST /api/chat recibe:
{
  "message": "Texto de la solicitud",
  "conversation_id": null
}

conversation_id es opcional en el primer turno.

Una respuesta correcta devuelve:
{
  "reply": "Texto generado por el agente",
  "conversation_id": "Identificador de la conversación"
}

Los errores devuelven:
{
  "error": "Mensaje comprensible para el usuario"
}

## Validación

- Valida la entrada antes de crear conversaciones o llamar a Foundry.
- message debe ser una cadena de entre 1 y 2000 caracteres después de aplicar trim().
- Responde 422 cuando message no cumpla las condiciones.
- conversation_id puede omitirse o ser null; si se proporciona, debe ser una cadena no vacía y de longitud limitada.
- Limita el tamaño del cuerpo JSON.
- Maneja JSON malformado con respuesta 400 y cuerpos demasiado grandes con 413.
- No envíes solicitudes inválidas a Foundry.

## Fecha de referencia

- Proporciona una fecha de referencia en la zona America/Mexico_City.
- Identifícala como contexto de la aplicación, separado del mensaje del usuario.
- Indica que se use solo si el usuario no proporciona explícitamente otra fecha de referencia.
- No confundas esta fecha con la fecha de recepción de la solicitud.
- Conserva las fechas de ejemplo utilizadas en las pruebas.

## Errores y registros

- Envuelve las llamadas al SDK en try/catch.
- Si Foundry falla, responde 502 con:
  "No fue posible obtener la respuesta del asistente. Intente nuevamente."
- No devuelvas trazas, tokens, credenciales ni detalles internos al navegador.
- Registra únicamente información técnica mínima para diagnóstico.
- No registres mensajes completos ni respuestas con datos personales.
- No presentes respuestas simuladas como si provinieran de Foundry.
- Evita reintentos automáticos y llamadas duplicadas.

## Salud del servidor

- GET /health devuelve HTTP 200 con:
  { "status": "ok" }
- No invoques Foundry desde /health.
- Este endpoint confirma que el servidor responde; no verifica la conexión con el agente.

## Alcance y presupuesto

- El presupuesto disponible informado es de 90 USD en Azure.
- No crees recursos, cambies planes ni agregues servicios de pago automáticamente.
- No incorpores búsqueda web, voz, bases de datos ni herramientas adicionales en esta versión.
- La generación de una ficha no equivale a guardar una solicitud.
- No implementes envío de correos, reservas ni autorizaciones.
- Un conversation_id no sustituye la autenticación ni el control de acceso.

## Validación antes de entregar

- Comprueba la sintaxis de server.js.
- Verifica que package.json incluya:
  "type": "module"
  "dev": "node --env-file-if-exists=.env server.js"
  "start": "node server.js"
- Comprueba /health y el rechazo de entradas inválidas.
- Verifica una conversación real de varios turnos cuando exista acceso a Azure.
- Distingue las pruebas locales de las pruebas reales conectadas a Foundry.
- No afirmes que la integración funciona si todavía no se ha probado.