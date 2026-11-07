# Instrucciones del proyecto: Asistente de Seguimiento Académico

## Qué es este proyecto

Aplicación web para apoyar a la Coordinación de Negocios y Mercadotecnia en el análisis y seguimiento de solicitudes.

El usuario escribe o pega un mensaje y recibe una propuesta de ficha con:
- Datos de la solicitud.
- Categoría y justificación.
- Prioridad y justificación.
- Estado.
- Datos por confirmar.
- Siguiente acción recomendada.

Permite completar información y actualizar la ficha dentro de la misma conversación.

La aplicación utiliza el agente existente en Microsoft Foundry, configurado con gpt-4.1-mini. No crea otro agente ni modifica sus instrucciones automáticamente.

## Alcance de la primera versión

- Analizar solicitudes.
- Clasificarlas como AC–Académica, DO–Docente, AD–Administrativa o EV–Evento.
- Conservar “Por confirmar” cuando falte información.
- Proponer prioridades Alta, Media o Baja.
- Utilizar los estados Pendiente, En proceso y Atendida.
- Dar seguimiento mediante conversación de varios turnos.
- Mostrar los resultados como propuestas sujetas a revisión humana.

La generación de una ficha no equivale a guardar una solicitud en una base de datos.

No implementar todavía reportes semanales, envío de correos, reservas, notificaciones automáticas, base de datos ni integraciones con otros sistemas.

## Entorno de desarrollo

- Windows 11 con PowerShell 7.
- Visual Studio Code.
- Node.js 24 LTS y npm.
- JavaScript, HTML y CSS.
- Sin TypeScript, frameworks de frontend ni herramientas de compilación.

## Stack y versiones

- Express 5.
- ES Modules: "type": "module" en package.json.
- async/await.
- SDK @azure/ai-projects 2.x, para Foundry projects (new).
- Autenticación con DefaultAzureCredential de @azure/identity.
- No utilizar @azure/ai-agents ni la API 1.x.
- Verificar las firmas de los métodos contra la versión instalada.
- Conservar package-lock.json para reproducir las dependencias.

Variables locales mediante:
node --env-file-if-exists=.env server.js

No instalar dotenv.

## Arquitectura

No cambiar esta arquitectura sin consultar al usuario.

server.js:
- Sirve public/ en la ruta /.
- Expone POST /api/chat.
- Expone GET /health.
- Realiza toda la comunicación con Foundry.
- Escucha en process.env.PORT, con 3000 como valor local predeterminado.
- Escucha en 0.0.0.0 para permitir su ejecución en App Service.

public/:
- index.html: estructura de la interfaz.
- styles.css: presentación.
- app.js: interacción con el backend.

El navegador nunca se comunica directamente con Foundry.
El frontend solo utiliza rutas del propio backend.

## Conexión con Foundry

Variables de entorno:
- FOUNDRY_PROJECT_ENDPOINT
- FOUNDRY_AGENT_NAME
- PORT, opcional en local.

Obtener el cliente de OpenAI desde AIProjectClient mediante getOpenAIClient().

Conversación de varios turnos:
- Crear una conversación con openai.conversations.create() cuando no exista conversation_id.
- Reutilizar la conversación en los mensajes posteriores.
- Invocar openai.responses.create({ conversation, input }, agentRef).
- Usar agentRef con esta estructura:
  { body: { agent_reference: { name, type: "agent_reference" } } }
- name se obtiene de FOUNDRY_AGENT_NAME.
- Devolver response.output_text como respuesta del asistente.

No sustituir esta integración por una llamada directa al modelo.
No duplicar las instrucciones completas del agente en el frontend ni en cada mensaje.

## Contrato de POST /api/chat

Solicitud JSON:
{
  "message": "Texto del usuario",
  "conversation_id": null
}

conversation_id puede omitirse en el primer turno.

Respuesta correcta:
{
  "reply": "Respuesta real del agente",
  "conversation_id": "Identificador devuelto por Foundry"
}

El frontend conserva conversation_id durante la conversación.

El botón “Nueva conversación” limpia los mensajes y el identificador local. El siguiente envío crea otra conversación.

No presentar esta acción como eliminación del historial almacenado en Foundry.

## Fechas

El backend proporciona al agente una fecha de referencia calculada en la zona America/Mexico_City.

Cuando el usuario indique explícitamente otra fecha de referencia para un caso de prueba, conservarla y evitar introducir una fecha contradictoria.

La fecha de referencia no equivale automáticamente a la fecha de recepción de la solicitud.

## Interfaz

- Nombre visible: Asistente de Seguimiento Académico.
- Subtítulo: Coordinación de Negocios y Mercadotecnia.
- Interfaz en español.
- Diseño sencillo y adaptable a computadora y celular.
- Área de conversación.
- Campo para escribir o pegar una solicitud.
- Botón Enviar.
- Botón Nueva conversación.
- Indicador visible durante el procesamiento.
- Evitar envíos duplicados mientras exista una solicitud en curso.
- Conservar el texto escrito si ocurre un error.
- Mostrar los saltos de línea de las respuestas.
- Renderizar inicialmente las respuestas como texto mediante textContent, sin insertar HTML generado por el modelo.
- Etiquetas accesibles y navegación con teclado.

Mostrar este aviso:
“Las fichas son propuestas generadas con IA y requieren revisión de la coordinación”.

No mostrar una confirmación de registro, envío o autorización cuando esas operaciones no existan.

## Seguridad

- No escribir claves, tokens ni valores reales de configuración en el código.
- Leer la configuración desde variables de entorno.
- No devolver credenciales, configuración interna ni trazas al navegador.
- No incluir .env en public/ ni en Git.
- Crear .env.example únicamente con valores de ejemplo.
- Excluir de Git .env, node_modules/ y archivos de registro.
- Permitir versionar .env.example.

En Azure:
- Utilizar identidad administrada, sin API keys.
- Documentar los permisos necesarios para acceder al proyecto de Foundry.
- No asumir que activar la identidad concede automáticamente esos permisos.

En local:
- Utilizar una credencial de desarrollo compatible con DefaultAzureCredential.
- Documentar el inicio de sesión necesario, por ejemplo mediante Azure CLI.

Validación:
- message debe ser una cadena.
- Validar después de quitar espacios iniciales y finales.
- Aceptar entre 1 y 2000 caracteres.
- Responder 422 si no cumple.
- Validar que conversation_id, cuando exista, sea una cadena no vacía con longitud limitada.
- Limitar el tamaño del cuerpo JSON.

Errores:
- Si Foundry falla, responder 502 con un mensaje genérico.
- No simular una respuesta correcta ni devolver un ejemplo como si proviniera del agente.
- Manejar JSON malformado sin mostrar trazas.
- Registrar solo información técnica mínima, sin mensajes completos ni credenciales.

No compartir un conversation_id global entre usuarios.
El identificador de conversación no es un mecanismo de autenticación.
Antes de usar datos institucionales reales con varios usuarios, se deberá incorporar control de acceso y vincular cada conversación a su usuario.

## Presupuesto

El presupuesto disponible informado es de 90 USD en Azure.

- Mantener gpt-4.1-mini.
- No crear nuevos recursos ni cambiar planes o modelos automáticamente.
- Explicar el costo previsto antes de proponer servicios adicionales.
- No agregar búsqueda web, búsqueda documental, voz ni herramientas de pago para esta primera versión.
- GET /health no debe invocar al agente ni consumir tokens.
- Evitar reintentos automáticos ilimitados y llamadas duplicadas.
- Realizar pruebas breves y enfocadas.

## Estilo de código

- Comentarios en español neutro.
- Nombres de variables y funciones en inglés.
- Cambios mínimos y enfocados.
- No reescribir archivos completos si basta una edición.
- Mantener separación entre backend, presentación e interacción.
- No agregar dependencias innecesarias.

## Scripts

package.json debe incluir:
- "type": "module"
- "dev": "node --env-file-if-exists=.env server.js"
- "start": "node server.js"

Declarar todas las dependencias importadas.
No depender de paquetes globales para ejecutar la aplicación.

## Validación local

1. Ejecutar npm run dev.
2. Abrir http://localhost:3000.
3. Ejecutar en PowerShell:
   Invoke-RestMethod http://localhost:3000/health

La respuesta debe contener:
{
  "status": "ok"
}

Este endpoint comprueba que el servidor responde; no demuestra conectividad con Foundry.

## Pruebas funcionales

Comprobar desde la aplicación:

1. Solicitud de laboratorio para una clase al día siguiente:
   AC–Académica, Alta y Pendiente.

2. Solicitud ambigua de apoyo con documentos:
   categoría y prioridad Por confirmar, estado Pendiente y máximo tres preguntas.

3. Aclaración sobre revisión de planeaciones docentes con cinco días de plazo:
   DO–Docente, Media y Pendiente.

4. Confirmación de que la revisión concluyó antes del vencimiento:
   Atendida y prioridad “No aplica: solicitud atendida”.

5. Nueva conversación:
   no reutiliza datos de la conversación anterior.

6. Entrada vacía o mayor a 2000 caracteres:
   respuesta 422 sin llamar a Foundry.

Distinguir pruebas locales con respuestas simuladas de pruebas reales conectadas a Azure. No presentar las primeras como evidencia de integración.

## Antes de desplegar

- Verificar dependencias y scripts.
- Confirmar que .env está excluido de Git.
- Verificar el funcionamiento de varios turnos.
- Revisar configuración de identidad y permisos.
- Revisar plan de hospedaje y costo previsto.
- Comprobar después del despliegue la URL como usuario.
- Documentar únicamente funciones implementadas y pruebas realizadas.
