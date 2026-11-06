import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import express from "express";
import path from "node:path";

const port = Number(process.env.PORT ?? "3000");
const projectEndpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
const agentName = process.env.FOUNDRY_AGENT_NAME;

if (!projectEndpoint?.trim() || !agentName?.trim()) {
  throw new Error(
    "Faltan FOUNDRY_PROJECT_ENDPOINT o FOUNDRY_AGENT_NAME. Configure las variables de entorno para iniciar el servidor."
  );
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un número entero entre 1 y 65535.");
}

const credential = new DefaultAzureCredential();
const projectClient = new AIProjectClient(projectEndpoint, credential);
const openAIClient = projectClient.getOpenAIClient();
const agentReference = {
  body: {
    agent_reference: {
      name: agentName,
      type: "agent_reference"
    }
  }
};

function getSafeErrorDetails(error) {
  const errorType =
    error instanceof Error ? error.constructor.name : "UnknownError";
  const statusValue = error?.status ?? error?.statusCode;
  const httpStatus =
    Number.isInteger(statusValue) && statusValue >= 100 && statusValue <= 599
      ? statusValue
      : null;
  const rawCode =
    typeof error?.code === "string"
      ? error.code
      : typeof error?.error?.code === "string"
        ? error.error.code
        : "UNSPECIFIED";
  const code = rawCode.replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 80) || "UNSPECIFIED";
  const rawParam = error?.param ?? error?.error?.param;
  const param =
    typeof rawParam === "string" &&
    /^[A-Za-z0-9_.\[\]\-]{1,120}$/.test(rawParam)
      ? rawParam
      : null;
  const paramField = param?.match(/(?:^|\.)(type|role)$/)?.[1];
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error?.error?.message === "string"
        ? error.error.message
        : "";
  const rejectedValueMatch = paramField
    ? rawMessage.match(/invalid value:\s*(['"])([^'"]{1,64})\1/i)
    : null;
  const rejectedValue =
    /^[a-z][a-z0-9_]{0,63}$/.test(rejectedValueMatch?.[2] ?? "")
      ? rejectedValueMatch[2]
      : null;
  const message = rawMessage
    .replace(
      /\b(?:authorization|api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret)\b\s*[:=]\s*\S+/gi,
      "[credential redacted]"
    )
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9_-]+\b/gi, "[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number]")
    .replace(/\[?request id:\s*[A-Za-z0-9-]+\]?/gi, "[request id]")
    .replace(/(["'])([A-Za-z][A-Za-z0-9_]{0,80})\1/g, "$2")
    .replace(/(["']).*?\1/g, "[quoted text]")
    .replace(/\{[\s\S]*$/, "[details omitted]")
    .replace(
      /\b(?:request body|request payload|user input|prompt|content)\s*[:=][\s\S]*$/i,
      "[request content omitted]"
    )
    .replace(/(?:[A-Za-z]:\\|\/)[^\s]+/g, "[path]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  return {
    errorType,
    httpStatus,
    code,
    param,
    message,
    ...(rejectedValue ? { rejectedValue } : {})
  };
}

const app = express();
const publicDirectory = path.join(import.meta.dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/chat", async (request, response) => {
  const { message, conversation_id: requestedConversationId } = request.body ?? {};

  if (
    typeof message !== "string" ||
    message.trim().length < 1 ||
    message.trim().length > 2000
  ) {
    response.status(422).json({
      error: "El mensaje debe contener entre 1 y 2000 caracteres."
    });
    return;
  }

  if (
    requestedConversationId !== undefined &&
    requestedConversationId !== null &&
    (typeof requestedConversationId !== "string" ||
      requestedConversationId.trim().length === 0 ||
      requestedConversationId.length > 256)
  ) {
    response.status(422).json({
      error: "El identificador de conversación no es válido."
    });
    return;
  }

  const trimmedMessage = message.trim();
  const referenceDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const input = [
    {
      type: "message",
      role: "developer",
      content: `Fecha de referencia de la aplicación: ${referenceDate} (zona America/Mexico_City). Úsela solo si la persona usuaria no indica explícitamente otra fecha de referencia para su caso. Esta fecha no representa automáticamente la fecha de recepción de una solicitud.`
    },
    {
      type: "message",
      role: "user",
      content: trimmedMessage
    }
  ];

  let stage = "authentication";
  try {
    const token = await credential.getToken("https://ai.azure.com/.default");
    if (!token?.token) {
      throw new Error("No se obtuvo una credencial para Microsoft Foundry.");
    }

    let conversation = requestedConversationId;
    if (!conversation) {
      stage = "conversation_creation";
      conversation = (await openAIClient.conversations.create()).id;
      if (!conversation) {
        throw new Error("Foundry no devolvió un identificador de conversación.");
      }
    }

    stage = "response";
    const result = await openAIClient.responses.create(
      { conversation, input },
      agentReference
    );

    if (typeof result.output_text !== "string" || !result.output_text.trim()) {
      throw new Error("Foundry devolvió una respuesta sin texto utilizable.");
    }

    response.json({
      reply: result.output_text,
      conversation_id: conversation
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "foundry_request_failed",
        stage,
        ...getSafeErrorDetails(error)
      })
    );
    response.status(502).json({
      error: "No fue posible obtener la respuesta del asistente. Intente nuevamente."
    });
  }
});

app.use(express.static(publicDirectory, { index: "index.html" }));

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.too.large") {
    response.status(413).json({
      error: "El cuerpo de la solicitud supera el límite de 16 KB."
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "El cuerpo JSON no es válido." });
    return;
  }

  console.error("Error interno al procesar una solicitud.");
  response.status(500).json({ error: "No fue posible procesar la solicitud." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor disponible en http://localhost:${port}`);
});
