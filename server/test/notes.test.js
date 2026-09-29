const mongoose = require("mongoose");
const request = require("supertest");
const { createApp } = require("../src/app");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/job_notes_test";

let app;

beforeAll(async () => {
  await mongoose.connect(mongoUri);
  app = createApp();
});

beforeEach(() => {
  // These tests aren't about enrichment -- stub fetch so a note's
  // fire-and-forget background lookup fails fast instead of making a real
  // Wikipedia call (and holding a real open socket) for every note created
  // in this file.
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("network disabled in this test file"));
});

afterEach(async () => {
  jest.restoreAllMocks();
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("creates a real note and persists it in MongoDB", async () => {
  const res = await request(app).post("/api/notes").send({
    companyName: "Acme Corp",
    note: "Referred by a former colleague on the platform team.",
    tag: "networking",
  });

  expect(res.status).toBe(201);
  expect(res.body.companyName).toBe("Acme Corp");
  expect(res.body._id).toBeDefined();

  const stored = await mongoose.connection.db
    .collection("companynotes")
    .findOne({ companyName: "Acme Corp" });
  expect(stored).not.toBeNull();
  expect(stored.tag).toBe("networking");
});

test("rejects a note missing a required field", async () => {
  const res = await request(app).post("/api/notes").send({ companyName: "Acme Corp" });
  expect(res.status).toBe(400);
});

test("lists notes newest first", async () => {
  await request(app).post("/api/notes").send({ companyName: "Old Co", note: "first" });
  await new Promise((r) => setTimeout(r, 5));
  await request(app).post("/api/notes").send({ companyName: "New Co", note: "second" });

  const res = await request(app).get("/api/notes");
  expect(res.status).toBe(200);
  expect(res.body.map((n) => n.companyName)).toEqual(["New Co", "Old Co"]);
});

test("deletes a note", async () => {
  const created = await request(app).post("/api/notes").send({
    companyName: "Delete Me",
    note: "temp",
  });

  const del = await request(app).delete(`/api/notes/${created.body._id}`);
  expect(del.status).toBe(204);

  const getAfter = await request(app).get(`/api/notes/${created.body._id}`);
  expect(getAfter.status).toBe(404);
});
