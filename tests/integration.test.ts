import { describe, expect, it } from "vitest";
import { SASClient } from "../src/index.js";

const apiKey = process.env.SAS_API_KEY;
const baseUrl = process.env.SAS_BASE_URL ?? "https://sas-api.onrender.com";

const run = apiKey ? describe : describe.skip;

run("SAS real API integration", () => {
  const client = new SASClient({ apiKey, baseUrl });

  it("health()", async () => {
    const result = await client.health();
    expect(result.status).toBe("ok");
  });

  it("readyz()", async () => {
    const result = await client.readyz();
    expect(result.kappa_d).toBe(0.56);
  });

  it("demoAudit()", async () => {
    const result = await client.demoAudit({
      source: "The Eiffel Tower is located in Paris, France.",
      response: "The Eiffel Tower is located in Berlin, Germany."
    });
    expect(result.kappa_d).toBe(0.56);
  });

  it("whoami()", async () => {
    const result = await client.whoami();
    expect(result.plan).toBeTruthy();
  });

  it("diff()", async () => {
    const result = await client.diff({
      textA: "Paris is in France.",
      textB: "Paris is in Germany.",
      experimental: true
    });
    expect(typeof result.isi).toBe("number");
    expect(result.verdict).toBeTruthy();
  });

  it("publicInteractionStats()", async () => {
    const result = await client.publicInteractionStats({ days: 7 });
    expect(result.status).toBe("ok");
    expect(result.privacy.raw_text_stored).toBe(false);
  });
});
