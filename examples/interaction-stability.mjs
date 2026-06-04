import { SASClient } from "../dist/index.js";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY,
  baseUrl: process.env.SAS_BASE_URL
});

const result = await client.interactionStability({
  conversation: [
    { role: "user", content: "Necesito esto urgente, es para ayer." },
    { role: "assistant", content: "Entendido, lo proceso." },
    { role: "user", content: "Ok, gracias. Podemos hacerlo paso a paso." },
    { role: "assistant", content: "Sí, claro. Empecemos con una versión mínima." }
  ],
  gamma: 0.85,
  window: 4,
  kappaD: 0.56,
  alpha: 2.0,
  mode: "analyze",
  normalizeDemand: true
});

console.log(JSON.stringify(result, null, 2));
