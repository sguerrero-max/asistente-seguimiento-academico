import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

if (!process.argv.includes("--apply")) {
  console.log("Modo de comprobación. El script no hizo cambios en Foundry.");
  process.exit(0);
}

const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
const agentName = process.env.FOUNDRY_AGENT_NAME;
const model = process.env.FOUNDRY_MODEL_DEPLOYMENT_NAME || "gpt-4.1-mini";

if (!endpoint || !agentName) {
  throw new Error("Configura FOUNDRY_PROJECT_ENDPOINT y FOUNDRY_AGENT_NAME.");
}

const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
const agent = await project.agents.createVersion(agentName, {
  kind: "prompt",
  model,
  instructions:
    "Ayuda en español a clasificar solicitudes académicas. Propón una ficha " +
    "para revisión humana y marca los datos faltantes como «Por confirmar».",
});

console.log(`Agente ${agent.name}, versión ${agent.version}.`);
