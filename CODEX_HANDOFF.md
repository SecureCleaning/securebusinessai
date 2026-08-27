# CODEX_HANDOFF.md

## Codex local update - 2026-05-13
Codex imported the transferred project locally and added baseline project scaffolding:

- initialized a clean local git repository on `main`
- added sanitized remote: `https://github.com/SecureCleaning/securebusinessai.git`
- added `package.json` and `package-lock.json`
- added `.env.example` with `RESEND_API_KEY=`
- added `.nvmrc` pinned to Node 20
- added `.gitignore`
- added validation, API smoke-test, and static build scripts in `scripts/`
- replaced the placeholder GitHub Actions workflow with CI that runs install, lint, test, and build
- updated `README.md` with local setup, validation, and deployment notes

Current local commands:

```bash
npm ci --cache ./.npm-cache
npm run lint
npm test
npm run build
npm run dev:static
```

`npm run dev` uses:

```bash
npx --yes vercel@latest dev --listen 3000
```

The project is intentionally dependency-free by default; Vercel is invoked through `npx` only when needed for the serverless API route.

Verification completed locally:

- `npm ci --cache ./.npm-cache` passed with 0 vulnerabilities
- `npm run lint` passed
- `npm test` passed with mocked Resend calls
- `npm run build` passed and copied static/API files to `dist/`
- `npm run dev:static` served `/` and `/contact.html` with HTTP 200

Preview deployment:

- URL: `https://securebusinessai-156b-c3rt9l62g-lyles-projects-1cf7cd8c.vercel.app`
- Inspect: `https://vercel.com/lyles-projects-1cf7cd8c/securebusinessai-156b/H2THdPuzNZCSPE74SPzikA74GgTW`
- Status: `READY`
- Note: Deployment Protection is enabled, so unauthenticated requests receive Vercel auth. Use a logged-in Vercel browser session or `vercel curl` to view/check it.
- Verified with `vercel curl`: `/` returned 200, `/contact` returned 200, and `/api/contact` honeypot POST returned `{"ok":true}` without sending email.

AI Website Review workflow added:

- Sales page: `/ai-website-review`
- Checkout redirect endpoint: `/api/review-checkout`
- Intake page: `/review-intake`
- Intake endpoint: `/api/review-intake`
- Intake success page: `/review-intake-success`
- Process doc: `docs/AI_WEBSITE_REVIEW_PROCESS.md`
- Editable report template: `docs/templates/ai-website-review-report.md`
- Required next env var: `AI_REVIEW_PAYMENT_LINK`

Still required:

- `RESEND_API_KEY` now exists in Vercel for Production and Preview
- `.env.local` was pulled from the Vercel Preview environment and contains `RESEND_API_KEY`
- `vercel dev` currently stops during initial build with `sh: yarn: command not found`; the linked Vercel project likely has an install command/package-manager setting pointing at Yarn
- after changing the Vercel dashboard install command to `npm install`, local `vercel dev` still attempted Yarn through the local builder
- a temporary local Yarn shim got past that but then the builder tried to install Linux-only `inotify`, which fails on macOS
- do not rely on local `vercel dev` for this imported project until the Vercel builder/package-manager issue is resolved
- recommended next API test path is a Vercel Preview deployment, because Preview has `RESEND_API_KEY` configured and will build on Vercel's Linux runtime
- decide whether to commit this imported baseline or first reconcile against a fresh clone from GitHub

## Project directory on this VPS
- **Primary runnable repo:** `/data/.openclaw/workspace/securebusinessai-repo`
- **Related strategy/content docs (not in git repo):** `/data/.openclaw/workspace/projects/secure-business-ai`
- **Read-only recovered archive:** `/data/.openclaw/workspace/archive/secure-business-ai`

For transfer to the Mac, the repo at `/data/.openclaw/workspace/securebusinessai-repo` is the main project that should land in:

`/Users/lyle/Documents/Playground/secure-business-ai`

## What this project is
A lightweight marketing/lead-gen site for **Secure Business AI** with:
- a static homepage (`index.html`)
- a contact page (`contact.html`)
- a contact success page (`contact-success.html`)
- one serverless contact API (`api/contact.js`) that sends notification + auto-reply emails through Resend

Business/positioning notes in the adjacent docs describe Secure Business AI as a Melbourne-first, practical AI adoption service for small business.

## Tech stack
- Static HTML
- CSS
- Vanilla browser JavaScript
- Vercel serverless function (`api/contact.js`)
- Resend email API
- Google Fonts (Inter)
- Vercel config via `vercel.json`

## Package manager and runtime versions if known
- **Node.js on VPS:** `v22.22.2`
- **npm on VPS:** `10.9.7`
- **Vercel CLI tested on VPS:** `53.4.0` via `npx`
- **Package manager in repo:** none configured in-repo (no `package.json`, no lockfile)
- **Runtime version pinned in repo:** none found (`.nvmrc` / `.node-version` not present)

## Exact install command
There is **no repo-local install step** right now.

If Codex wants the same local tooling used for Vercel-style dev, install the CLI with:

```bash
npm install --global vercel@latest
```

Alternative without global install:

```bash
npx --yes vercel@latest dev --listen 3000
```

## Exact local dev command
### Full local dev (recommended)
```bash
vercel dev --listen 3000
```

### Expected local URL
- `http://localhost:3000`

### Important note
On this VPS, `vercel dev` failed because there were **no Vercel credentials configured** (`vercel login` / token missing). Codex should either:
- run `vercel login` locally first, or
- use a Vercel token locally if available.

If only a **static preview** is needed and the API route does not matter, a simple fallback is:

```bash
python3 -m http.server 3000
```

That fallback serves the pages but **will not run** `/api/contact`.

## Exact lint / test / build commands
There are currently **no lint, test, or build commands configured** in this repo.

- **Lint:** not configured
- **Test:** not configured
- **Build:** not configured

There is also no meaningful CI yet; `.github/workflows/blank.yml` is still the default placeholder workflow.

## Current task / next recommended work
Recommended first engineering tasks for Codex:
1. Add a minimal `package.json` with explicit scripts for `dev`, `lint`, `test`, and `build` (even if some are placeholders initially).
2. Add `.env.example` containing `RESEND_API_KEY=` only.
3. Make local development smooth on macOS by documenting or scripting the Vercel login/link flow.
4. Verify the contact form end-to-end locally with a non-production test sender setup.
5. Replace the placeholder GitHub Actions workflow with a real validation workflow.

Recommended business/product direction from the project docs:
- keep the **AI Website Review** as the lead offer
- use that to sell into the **AI Voice Receptionist** offer
- keep pricing and positioning clear rather than broadening the offer set too early

## Important files and directories
### In the repo
- `index.html` — homepage / offer positioning
- `contact.html` — enquiry form
- `contact-success.html` — post-submit confirmation page
- `styles.css` — site styling
- `api/contact.js` — serverless form handler using Resend
- `vercel.json` — Vercel config (`cleanUrls: true`)
- `.github/workflows/blank.yml` — placeholder CI workflow
- `README.md` — very minimal repo note

### Related non-repo docs on the VPS
These are useful for product context but are **outside** the git repo:
- `/data/.openclaw/workspace/projects/secure-business-ai/project-state.md`
- `/data/.openclaw/workspace/projects/secure-business-ai/next-7-actions.md`
- `/data/.openclaw/workspace/projects/secure-business-ai/secure-business-ai-best-of.md`
- `/data/.openclaw/workspace/projects/secure-business-ai/research/`
- `/data/.openclaw/workspace/projects/secure-business-ai/products/`
- `/data/.openclaw/workspace/projects/secure-business-ai/financials/`

## Database, auth, API, deployment, and third-party services used
- **Database:** none
- **Auth:** none
- **API:** Resend Email API (`https://api.resend.com/emails`)
- **Deployment target:** Vercel
- **Third-party services / dependencies:**
  - Resend
  - Google Fonts
  - Custom DNS/domain setup in Vercel + Hostinger (per README)

### Email behavior in `api/contact.js`
- sends notification email to: `info@securebusinessai.com.au`
- sends auto-reply to the form submitter
- sender/from address is hardcoded as: `Secure Business AI <website@securebusinessai.com.au>`

## Required environment variables (names only)
- `RESEND_API_KEY`

## `.env.example` status
- `.env.example` **does not exist**
- Because it does not exist, it is **not currently accurate**

## Known issues, failing tests, missing config, or blockers
- No `package.json`
- No repo-local scripts for dev/lint/test/build
- No `.env.example`
- No runtime version pinning (`.nvmrc`, `.node-version`, etc.)
- `vercel dev` could not be fully verified on this VPS because credentials were missing
- No automated tests exist
- CI workflow is placeholder-only
- Contact email addresses are hardcoded in `api/contact.js`, which is simple but not very configurable

## Deployment target and deployment notes
- Deploy target is **Vercel**
- `vercel.json` only sets:

```json
{
  "cleanUrls": true
}
```

- README says preview deployment/domain flow is:
  - import repo/folder into Vercel
  - add domain: `preview.securebusinessai.com.au`
  - follow Vercel DNS instructions in Hostinger

## VPS-specific setup Codex should ignore or recreate locally
### Ignore
- The wider OpenClaw workspace layout on this VPS
- Adjacent archive/docs folders unless you intentionally want to copy them for context
- Any VPS-only credentials or shell history

### Recreate locally if needed
- Vercel CLI login/session
- local `.env` with `RESEND_API_KEY`
- any Vercel project linking needed for `vercel dev` / deployment

## Git state captured on VPS
### `git status --short`
```bash
# no output (working tree was clean)
```

### `git branch --show-current`
```bash
main
```

### `git remote -v`
Credential-bearing token was present in the configured remote URL on the VPS, so it is intentionally redacted here.

```bash
origin	https://github.com/SecureCleaning/securebusinessai.git (fetch)   # credential redacted
origin	https://github.com/SecureCleaning/securebusinessai.git (push)    # credential redacted
```

### `git log -5 --oneline`
```bash
b45151b Harden contact delivery and add auto-reply
5d2fcbf Improve contact success flow
59acc16 Add contact page and enquiry form
99d58d2 Improve homepage conversion and pricing clarity
a114b96 Add initial Secure Business AI preview site
```
