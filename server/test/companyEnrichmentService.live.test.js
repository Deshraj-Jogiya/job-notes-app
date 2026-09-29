const { fetchCompanySummary } = require("../src/services/companyEnrichmentService");

/**
 * Real live test against the real Wikipedia REST API -- no mocking, no API
 * key. Confirms the integration works against the actual service, not just
 * a hand-shaped mock of what its response is assumed to look like.
 */
test("a real live lookup against Wikipedia's actual API returns a real Microsoft summary", async () => {
  const result = await fetchCompanySummary("Microsoft");

  expect(result).not.toBeNull();
  expect(result.summary.length).toBeGreaterThan(20);
  expect(result.url).toContain("wikipedia.org/wiki/Microsoft");
}, 15000);

test("a real live lookup for a nonsense company name returns null, not an error", async () => {
  const result = await fetchCompanySummary("Zzzznonexistentcompanyxyz123realq");

  expect(result).toBeNull();
}, 15000);
