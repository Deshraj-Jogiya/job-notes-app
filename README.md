# Job Notes (MEAN-ish app)

A small real app for keeping company-research notes: Express + MongoDB backend, Angular
frontend. Built to get real, running experience with MongoDB and Angular specifically,
alongside Express (already used elsewhere in this author's work).

## Server (`server/`)

Express REST API backed by a real MongoDB (via Mongoose): `GET/POST /api/notes`,
`GET/DELETE /api/notes/:id`.

- `GET /api/notes?tag=interview` filters to a real pipeline stage
  (`research`/`networking`/`interview`/`follow-up`).
- `GET /api/notes?q=hybrid` does a real full-text search (a MongoDB text
  index on `companyName` + `note`) across both fields; combine with `?tag=`
  to narrow both at once.
- Every new note is enriched in the background (after the create response
  has already gone out, so a slow lookup never delays saving) with a real
  company summary from Wikipedia's public REST API -- no API key required.
  A company with no matching article is just left without enrichment, not
  an error. A second note about a company already looked up reuses the
  cached summary instead of calling Wikipedia again.

```bash
cd server
npm install
export MONGO_URI=mongodb://localhost:27017/job_notes   # a real, running MongoDB
npm start
```

Tests (Jest + Supertest, against a real MongoDB, not a mock):

```bash
npm test
```

## Client (`client/`)

Angular app (generated via the real `@angular/cli`, not hand-written config) with one
component: fetches notes from the API on load, a form to add a note, delete per note.

```bash
cd client
npm install
npm start   # ng serve, expects the server running on localhost:4000
```

Tests (real Angular TestBed + HttpClientTestingModule):

```bash
npm test -- --watch=false --browsers=ChromeHeadlessCI
```

`karma.conf.js` defines `ChromeHeadlessCI` (`--no-sandbox`, needed to run as root in a
container) and expects `CHROME_BIN` to point at a real Chrome/Chromium binary -- on
arm64 Linux specifically, install system Chromium (`apt-get install chromium`) rather
than relying on Puppeteer's bundled download, which has no arm64 Linux build.

## CI

`.github/workflows/ci.yml` runs the server's real Jest+Supertest suite against a real
`mongo:7` GitHub Actions service container, and the client's real Angular tests plus a
production build, on every push.
