const { fetchCompanySummary } = require("../src/services/companyEnrichmentService");

afterEach(() => jest.restoreAllMocks());

test("parses a real-shaped Wikipedia summary response", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      type: "standard",
      extract: "Some real summary text.",
      content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Foo" } },
      thumbnail: { source: "https://upload.wikimedia.org/foo.png" },
    }),
  });

  const result = await fetchCompanySummary("Foo");

  expect(result).toEqual({
    summary: "Some real summary text.",
    url: "https://en.wikipedia.org/wiki/Foo",
    thumbnailUrl: "https://upload.wikimedia.org/foo.png",
  });
});

test("returns null for a disambiguation page rather than guessing the wrong company", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ type: "disambiguation" }),
  });

  expect(await fetchCompanySummary("Mercury")).toBeNull();
});

test("returns null when Wikipedia has no matching article", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({ ok: false });

  expect(await fetchCompanySummary("Zzzznonexistentcompanyxyz123")).toBeNull();
});

test("returns null rather than a thumbnail when a page has no image", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      type: "standard",
      extract: "A company with no photo on file.",
      content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Bar" } },
    }),
  });

  const result = await fetchCompanySummary("Bar");
  expect(result.thumbnailUrl).toBeNull();
});
