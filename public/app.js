const conversationElement = document.querySelector("#conversation");
const formElement = document.querySelector("#message-form");
const messageElement = document.querySelector("#message");
const characterCountElement = document.querySelector("#character-count");
const sendButton = document.querySelector("#send-button");
const newConversationButton = document.querySelector("#new-conversation");
const statusElement = document.querySelector("#status-message");

const initialMessage =
  "Escriba o pegue una solicitud. Le ayudaré a identificar sus datos, proponer categoría y prioridad, y detectar información faltante.";

let conversationId = null;
let isSending = false;

function addMessage(role, text) {
  const message = document.createElement("article");
  message.className = `message message-${role}`;

  const label = document.createElement("p");
  label.className = "message-label";
  label.textContent = role === "user" ? "Usted" : "Asistente";

  const bubble = document.createElement("p");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  message.append(label, bubble);
  conversationElement.append(message);
  conversationElement.scrollTop = conversationElement.scrollHeight;
}

function showInitialMessage() {
  conversationElement.replaceChildren();
  addMessage("assistant", initialMessage);
}

function updateComposerState() {
  characterCountElement.textContent = `${messageElement.value.length} / 2000`;
  sendButton.disabled =
    isSending || messageElement.value.trim().length === 0;
  newConversationButton.disabled = isSending;
}

function setStatus(message, state = "") {
  statusElement.textContent = message;
  if (state) {
    statusElement.dataset.state = state;
  } else {
    delete statusElement.dataset.state;
  }
}

async function submitMessage(event) {
  event.preventDefault();
  if (isSending) {
    return;
  }

  const originalMessage = messageElement.value;
  const trimmedMessage = originalMessage.trim();
  if (trimmedMessage.length < 1 || trimmedMessage.length > 2000) {
    setStatus("El mensaje debe contener entre 1 y 2000 caracteres.", "error");
    messageElement.focus();
    return;
  }

  isSending = true;
  updateComposerState();
  setStatus("Escribiendo…", "pending");
  addMessage("user", trimmedMessage);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmedMessage,
        conversation_id: conversationId
      })
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("El servidor devolvió una respuesta no válida.");
    }

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error("Revise el mensaje e inténtelo de nuevo.");
      }
      if (response.status === 502) {
        throw new Error("El asistente no está disponible por el momento.");
      }
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "No fue posible procesar el mensaje."
      );
    }

    if (
      typeof result.reply !== "string" ||
      typeof result.conversation_id !== "string" ||
      result.conversation_id.length === 0
    ) {
      throw new Error("El servidor devolvió una respuesta incompleta.");
    }

    conversationId = result.conversation_id;
    addMessage("assistant", result.reply);
    if (messageElement.value === originalMessage) {
      messageElement.value = "";
    }
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof TypeError
        ? "No se pudo conectar con el servidor. Revise su conexión e inténtelo de nuevo."
        : error.message,
      "error"
    );
  } finally {
    isSending = false;
    updateComposerState();
    messageElement.focus();
  }
}

messageElement.addEventListener("input", updateComposerState);
messageElement.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    formElement.requestSubmit();
  }
});

formElement.addEventListener("submit", submitMessage);
newConversationButton.addEventListener("click", () => {
  if (isSending) {
    return;
  }
  conversationId = null;
  messageElement.value = "";
  setStatus("");
  showInitialMessage();
  updateComposerState();
  messageElement.focus();
});

showInitialMessage();
updateComposerState();
