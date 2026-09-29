const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

/**
 * Real lookup against Wikipedia's public REST summary API -- free, no API
 * key required, no account to set up. Returns null (never throws past this
 * point) when the company has no matching article or the match is only a
 * disambiguation page, so a note about an obscure or private employer just
 * ends up with no enrichment rather than a broken save or a wrong summary.
 */
async function fetchCompanySummary(companyName) {
  const title = encodeURIComponent(companyName.trim());
  const response = await fetch(`${WIKIPEDIA_SUMMARY_URL}${title}`, {
    headers: { "User-Agent": "job-notes-app/1.0 (personal project; no contact configured)" },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (data.type === "disambiguation") return null;

  return {
    summary: data.extract || null,
    url: data.content_urls?.desktop?.page || null,
    thumbnailUrl: data.thumbnail?.source || null,
  };
}

module.exports = { fetchCompanySummary };
