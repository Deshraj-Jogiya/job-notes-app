const express = require("express");
const CompanyNote = require("../models/CompanyNote");
const { fetchCompanySummary } = require("../services/companyEnrichmentService");

const router = express.Router();

// Real filtering, not just a flat list -- ?tag= narrows to a real pipeline
// stage, ?q= does a real full-text search across company name and note
// body (backed by the schema's text index), so notes stay findable once
// there are more than a handful.
router.get("/", async (req, res) => {
  const { tag, q } = req.query;
  const filter = {};
  if (tag) filter.tag = tag;

  if (q && q.trim()) {
    const notes = await CompanyNote.find(
      { ...filter, $text: { $search: q.trim() } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    return res.json(notes);
  }

  const notes = await CompanyNote.find(filter).sort({ createdAt: -1 });
  res.json(notes);
});

router.post("/", async (req, res) => {
  const { companyName, note, tag } = req.body;
  if (!companyName || !note) {
    return res.status(400).json({ error: "companyName and note are required" });
  }
  const created = await CompanyNote.create({ companyName, note, tag });
  res.status(201).json(created);

  // Fire-and-forget: the response has already gone out, so a slow or
  // unreachable Wikipedia never delays saving a note.
  enrichInBackground(created).catch((err) => {
    console.error(`Enrichment failed for "${created.companyName}":`, err.message);
  });
});

router.get("/:id", async (req, res) => {
  const found = await CompanyNote.findById(req.params.id);
  if (!found) return res.status(404).json({ error: "Note not found" });
  res.json(found);
});

router.delete("/:id", async (req, res) => {
  const deleted = await CompanyNote.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Note not found" });
  res.status(204).send();
});

/**
 * Real, best-effort company enrichment. Reuses an already-fetched summary
 * for the same company (case-insensitive) instead of making a duplicate
 * external call every time the user jots down another note about a
 * company they've already looked up once.
 */
async function enrichInBackground(createdNote) {
  const existing = await CompanyNote.findOne({
    companyName: new RegExp(`^${escapeRegExp(createdNote.companyName)}$`, "i"),
    "enrichment.summary": { $ne: null },
    _id: { $ne: createdNote._id },
  }).sort({ "enrichment.fetchedAt": -1 });

  const summary = existing
    ? existing.enrichment.toObject()
    : await fetchCompanySummary(createdNote.companyName);
  if (!summary) return;

  await CompanyNote.findByIdAndUpdate(createdNote._id, {
    enrichment: { ...summary, fetchedAt: new Date() },
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
