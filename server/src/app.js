const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const notesRouter = require("./routes/notes");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/notes", notesRouter);
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  return app;
}

async function start() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/job_notes";
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB at ${mongoUri}`);

  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

if (require.main === module) {
  start();
}

module.exports = { createApp };
