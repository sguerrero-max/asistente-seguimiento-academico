---
name: 'Frontend - Seguimiento Académico'
description: 'Usar al crear o modificar la interfaz web del Asistente de Seguimiento Académico.'
applyTo: 'public/**'
---

# Reglas del frontend

## Tecnologías y archivos

- Utiliza HTML, CSS y JavaScript vanilla ES2020+.
- Sin frameworks, CDNs ni herramientas de compilación.
- Mantén separados:
  - public/index.html
  - public/styles.css
  - public/app.js
- No agregues dependencias sin mencionarlas en el plan.

## Identidad y alcance

- Nombre visible: Asistente de Seguimiento Académico.
- Subtítulo: Coordinación de Negocios y Mercadotecnia.
- Toda la interfaz debe estar en español.
- Presenta la aplicación como apoyo para analizar solicitudes.
- No afirmes que registra solicitudes en una base de datos, envía correos, reserva espacios o autoriza acciones.

Muestra este aviso:
“Las fichas son propuestas generadas con IA y requieren revisión de la coordinación”.

## Componentes

Incluye:
- Encabezado con nombre y subtítulo.
- Área de conversación.
- Campo de texto multilínea con etiqueta visible.
- Contador de caracteres y máximo de 2000.
- Botón Enviar.
- Botón Nueva conversación.
- Indicador “Escribiendo…” durante la espera.
- Mensajes de error comprensibles.

Texto inicial sugerido:
“Escriba o pegue una solicitud. Le ayudaré a identificar sus datos, proponer categoría y prioridad, y detectar información faltante”.

## Comunicación con el backend

- El navegador solo llama a POST /api/chat del mismo origen.
- Nunca conectes directamente con Foundry.
- No incluyas credenciales, endpoints de Foundry ni configuración interna en public/.

Envía:
{
  "message": "Texto del usuario",
  "conversation_id": null
}

Lee de la respuesta:
{
  "reply": "Respuesta del agente",
  "conversation_id": "Identificador de conversación"
}

- Guarda conversation_id en una variable de JavaScript.
- Reutilízalo en los turnos posteriores.
- Se reinicia al recargar la página.
- No guardes conversaciones ni identificadores en localStorage o sessionStorage.
- No muestres el identificador en la interfaz.

## Envío y espera

- Valida que el mensaje tenga entre 1 y 2000 caracteres después de trim().
- No envíes mensajes vacíos.
- Deshabilita Enviar mientras esperas respuesta.
- Evita envíos duplicados.
- Muestra “Escribiendo…” y retíralo al finalizar, incluso si ocurre un error.
- Conserva el texto escrito cuando falle el envío.
- Limpia el campo únicamente después de recibir una respuesta correcta.
- Enter inserta un salto de línea.
- Ctrl + Enter o Cmd + Enter envía el mensaje.
- Informa al usuario del atajo disponible.
- Recupera el foco en el campo al terminar.

## Nueva conversación

- Limpia los mensajes visibles y conversation_id.
- Restablece el mensaje inicial y el contador.
- Devuelve el foco al campo de texto.
- Deshabilita este botón mientras exista una solicitud en curso.
- No afirmes que esta acción elimina los datos almacenados en Foundry.

## Presentación segura

- Inserta mensajes del usuario y del agente con textContent.
- Nunca insertes contenido recibido mediante innerHTML.
- No interpretes HTML ni ejecutes código generado por el agente.
- Conserva saltos de línea mediante white-space: pre-wrap.
- Permite dividir palabras largas para evitar desbordamientos.
- Distingue visualmente “Usted” y “Asistente”.
- No generes fichas ficticias si el backend falla.

## Errores

- Comprueba el estado HTTP antes de tratar la respuesta como exitosa.
- Maneja errores de red y respuestas que no sean JSON válido.
- Para 422, indica que debe revisar el mensaje.
- Para 502, muestra un mensaje breve de indisponibilidad del asistente.
- No muestres trazas ni detalles internos.
- No reintentes automáticamente.
- Conserva la conversación y el texto para que el usuario decida si vuelve a intentar.

## Diseño

- Diseño limpio y responsivo.
- Debe funcionar a 360 px de ancho sin desplazamiento horizontal de la página.
- Usa variables CSS en :root.
- Colores iniciales:
  - Azul principal: #13426A.
  - Naranja de acento: #FE984B.
- Usa el naranja como acento y verifica el contraste de textos y botones.
- Soporta prefers-color-scheme: dark con colores legibles.
- Utiliza fuentes del sistema, sin descargas externas.
- Mantén controles cómodos para interacción táctil.
- Evita animaciones innecesarias.
- Respeta prefers-reduced-motion.

## Accesibilidad

- Usa HTML semántico y etiquetas asociadas a los campos.
- Mantén foco visible y navegación completa con teclado.
- No comuniques estados únicamente mediante color.
- Usa un área de estado con aria-live="polite" para espera y errores.
- Identifica el área de conversación con un nombre accesible.
- Desplaza hacia el mensaje nuevo cuando corresponda, sin impedir que el usuario lea mensajes anteriores.

## Validación

Comprueba:
1. Mensaje vacío: no se envía.
2. Límite de 2000 caracteres visible y aplicado.
3. Espera: no permite envíos duplicados.
4. Respuesta: conserva saltos de línea y muestra texto legible.
5. Error: conserva el texto y permite volver a intentar.
6. Varios turnos: reutiliza conversation_id.
7. Nueva conversación: limpia el identificador.
8. Recarga: inicia una conversación nueva.
9. Pantalla de 360 px: no presenta desbordamiento horizontal.
10. Modo oscuro y navegación por teclado funcionales.

Distingue la revisión visual de una prueba real conectada a Foundry.