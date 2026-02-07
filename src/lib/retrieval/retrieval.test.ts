import { beforeAll, describe, expect, it } from "vitest";
import { execa } from "execa";
import { retrieveAnswer } from "@/lib/retrieval";

describe("retrieval", () => {
  beforeAll(async () => {
    // Ensure schema is up to date and seeded before tests.
    // Uses your existing scripts from package.json
    await execa("npm", ["run", "db:migrate"], { stdio: "inherit" });
    await execa("npm", ["run", "db:seed"], { stdio: "inherit" });
  }, 120_000);

  it("returns a parking-related snippet for 'parking coburg'", async () => {
    const res = await retrieveAnswer({ query: "parking coburg" });

    expect(res.confidence).toBeGreaterThan(0.2);
    expect(res.snippets.length).toBeGreaterThan(0);

    const joined = res.snippets.map((s) => `${s.title}\n${s.text}`.toLowerCase()).join("\n");
    expect(joined).toContain("park");
  });

  it("returns fallback for low-confidence query", async () => {
    const res = await retrieveAnswer({ query: "xyzqv blorb unknowntopic" });

    expect(res.snippets.length).toBe(0);
    expect(res.answerDraft.toLowerCase()).toContain("keine verlässlichen infos");
  });
});
