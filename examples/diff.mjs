import { SASClient } from "../dist/index.js";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY,
  baseUrl: process.env.SAS_BASE_URL
});

const result = await client.diff({
  textA: "Paris is in France.",
  textB: "Paris is in Germany.",
  experimental: true
});

console.log(JSON.stringify(result, null, 2));
