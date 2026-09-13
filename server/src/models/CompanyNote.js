const mongoose = require("mongoose");

const companyNoteSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  note: { type: String, required: true, trim: true },
  tag: {
    type: String,
    enum: ["research", "networking", "interview", "follow-up"],
    default: "research",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CompanyNote", companyNoteSchema);
