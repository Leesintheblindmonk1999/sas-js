import { SASClient } from "../dist/index.js";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY,
  baseUrl: process.env.SAS_BASE_URL
});

const result = await client.diff({
  textA: "The Eiffel Tower is located in Paris, France, and was completed in 1889.",
  textB: "The Eiffel Tower is located in Berlin, Germany, and was completed in 1950.",
  experimental: true
});

console.log(JSON.stringify(result, null, 2));
