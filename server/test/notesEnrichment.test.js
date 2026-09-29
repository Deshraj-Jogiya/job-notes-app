const mongoose = require("mongoose");
const request = require("supertest");
const { createApp } = require("../src/app");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/job_notes_test";

let app;

beforeAll(async () => {
  await mongoose.connect(mongoUri);
  app = createApp();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

function mockWikipediaResponse(body, ok = true) {
  return jest.spyOn(global, "fetch").mockResolvedValue({
    ok,
    json: async () => body,
  });
}

async function waitForEnrichment(id, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    const res = await request(app).get(`/api/notes/${id}`);
    if (res.body.enrichment?.summary) return res.body;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Enrichment never completed in time");
}

test("a new note gets enriched in the background from a real-shaped Wikipedia response", async () => {
  mockWikipediaResponse({
    type: "standard",
    extract: "Acme Corp is a fictional company used in cartoons.",
    content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Acme_Corporation" } },
    thumbnail: { source: "https://upload.wikimedia.org/acme.png" },
  });

  const created = await request(app).post("/api/notes").send({ companyName: "Acme Corp", note: "first note" });

  const enriched = await waitForEnrichment(created.body._id);
  expect(enriched.enrichment.summary).toContain("fictional company");
  expect(enriched.enrichment.url).toBe("https://en.wikipedia.org/wiki/Acme_Corporation");
  expect(enriched.enrichment.thumbnailUrl).toBe("https://upload.wikimedia.org/acme.png");
});

test("a company with no Wikipedia match is left without enrichment, not an error", async () => {
  mockWikipediaResponse({}, false);

  const created = await request(app)
    .post("/api/notes")
    .send({ companyName: "Totally Obscure Startup Xyz", note: "note" });
  expect(created.status).toBe(201);

  await new Promise((resolve) => setTimeout(resolve, 150));
  const fetched = await request(app).get(`/api/notes/${created.body._id}`);
  expect(fetched.body.enrichment.summary).toBeNull();
});

test("a second note about an already-enriched company reuses the cached summary instead of calling Wikipedia again", async () => {
  const fetchSpy = mockWikipediaResponse({
    type: "standard",
    extract: "Acme Corp is a fictional company.",
    content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Acme_Corporation" } },
    thumbnail: null,
  });

  const first = await request(app).post("/api/notes").send({ companyName: "Acme Corp", note: "first" });
  await waitForEnrichment(first.body._id);

  const second = await request(app)
    .post("/api/notes")
    .send({ companyName: "acme corp", note: "second, different case" });
  const enrichedSecond = await waitForEnrichment(second.body._id);

  expect(enrichedSecond.enrichment.summary).toContain("fictional company");
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});
