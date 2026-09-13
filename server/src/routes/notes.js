const express = require("express");
const CompanyNote = require("../models/CompanyNote");

const router = express.Router();

router.get("/", async (req, res) => {
  const notes = await CompanyNote.find().sort({ createdAt: -1 });
  res.json(notes);
});

router.post("/", async (req, res) => {
  const { companyName, note, tag } = req.body;
  if (!companyName || !note) {
    return res.status(400).json({ error: "companyName and note are required" });
  }
  const created = await CompanyNote.create({ companyName, note, tag });
  res.status(201).json(created);
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

module.exports = router;
