const mongoose = require("mongoose");

const enrichmentSchema = new mongoose.Schema(
  {
    summary: { type: String, default: null },
    url: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    fetchedAt: { type: Date, default: null },
  },
  { _id: false }
);

const companyNoteSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  note: { type: String, required: true, trim: true },
  tag: {
    type: String,
    enum: ["research", "networking", "interview", "follow-up"],
    default: "research",
  },
  enrichment: { type: enrichmentSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

// Powers ?q= full-text search across both the company name and the note
// body itself -- a user searching "hybrid" should find a note that
// mentions it even if the company name doesn't.
companyNoteSchema.index({ companyName: "text", note: "text" });

module.exports = mongoose.model("CompanyNote", companyNoteSchema);
