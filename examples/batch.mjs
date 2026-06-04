import { SASClient } from "../dist/index.js";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY,
  baseUrl: process.env.SAS_BASE_URL
});

const result = await client.batch({
  experimental: true,
  pairs: [
    {
      source: "The Eiffel Tower is located in Paris, France.",
      response: "The Eiffel Tower is located in Berlin, Germany."
    },
    {
      source: "Water boils at 100 degrees Celsius at sea level.",
      response: "Water boils at 100 degrees Celsius at sea level."
    }
  ]
});

console.log(JSON.stringify(result, null, 2));
