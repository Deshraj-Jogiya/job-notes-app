const mongoose = require("mongoose");
const request = require("supertest");
const { createApp } = require("../src/app");
const CompanyNote = require("../src/models/CompanyNote");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/job_notes_test";

let app;

beforeAll(async () => {
  await mongoose.connect(mongoUri);
  await CompanyNote.init(); // ensure the text index exists before searching
  app = createApp();
});

beforeEach(() => {
  // These tests are about filtering/search, not enrichment -- stub fetch
  // so a note's fire-and-forget background lookup fails fast instead of
  // making a real Wikipedia call (and holding a real open socket) for
  // every note created in this file.
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("network disabled in this test file"));
});

afterEach(async () => {
  jest.restoreAllMocks();
  // Real bug found via CI: dropDatabase() drops the text index created
  // once in beforeAll along with everything else, so every test after the
  // first ran with no text index at all ("text index required for $text
  // query"). deleteMany() clears the data but leaves indexes intact.
  await CompanyNote.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("filters notes by tag", async () => {
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Acme", note: "met a recruiter", tag: "networking" });
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Widget Co", note: "researching culture", tag: "research" });

  const res = await request(app).get("/api/notes?tag=networking");

  expect(res.status).toBe(200);
  expect(res.body.map((n) => n.companyName)).toEqual(["Acme"]);
});

test("full-text search matches the note body, not just the company name", async () => {
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Acme", note: "Hiring manager mentioned a hybrid schedule." });
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Widget Co", note: "Fully remote, no relocation needed." });

  const res = await request(app).get("/api/notes?q=hybrid");

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].companyName).toBe("Acme");
});

test("full-text search also matches the company name", async () => {
  await request(app).post("/api/notes").send({ companyName: "Globex Corporation", note: "first contact" });
  await request(app).post("/api/notes").send({ companyName: "Initech", note: "unrelated" });

  const res = await request(app).get("/api/notes?q=Globex");

  expect(res.body.map((n) => n.companyName)).toEqual(["Globex Corporation"]);
});

test("search and tag filter combine rather than one overriding the other", async () => {
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Acme", note: "hybrid schedule discussed", tag: "interview" });
  await request(app)
    .post("/api/notes")
    .send({ companyName: "Acme Robotics", note: "hybrid schedule discussed", tag: "research" });

  const res = await request(app).get("/api/notes?q=hybrid&tag=interview");

  expect(res.body.map((n) => n.companyName)).toEqual(["Acme"]);
});

test("an empty search result is a real empty array, not an error", async () => {
  await request(app).post("/api/notes").send({ companyName: "Acme", note: "nothing relevant here" });

  const res = await request(app).get("/api/notes?q=zzzznomatchxyz");

  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});
