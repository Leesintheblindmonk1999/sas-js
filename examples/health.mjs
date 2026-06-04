import { SASClient } from "../dist/index.js";

const client = new SASClient({
  baseUrl: process.env.SAS_BASE_URL
});

const result = await client.health();
console.log(JSON.stringify(result, null, 2));
