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

  // A real backstop, not just belt-and-suspenders: without this, an error
  // that reaches here (any route handler that forwards to next(err),
  // including via asyncHandler) would otherwise get Express's default
  // HTML error page instead of the JSON error shape every other endpoint
  // in this API returns.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Something went wrong." });
  });

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
