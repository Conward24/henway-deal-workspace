# Henway Deal Workspace

Living, finance-aware deal workspace for search fund operators. One place per deal: edit baseline financials and SBA financing assumptions, see instant DSCR and financeability, track assumption changes, and get a draft LOI prefilled from the current deal.

## Features

- **Deal list** — Create deals, open from list.
- **Living Deal Summary** — Single-page view: header (name, industry, location, status), financial snapshot (Adjusted EBITDA, purchase price range 3.5x/4x/4.5x, equity required, DSCR/financeability), major adjustment flags (reported vs adjusted EBITDA, top addbacks/deductions), assumption change log (last 5), open questions, conviction (Move Forward / Needs Work / Pass).
- **Edit baseline** — Revenue, reported EBITDA, adjusted EBITDA (override), addbacks and deductions list.
- **Edit financing** — Down payment %, seller note %, interest rate, amortization, real estate toggle, owner compensation adjustment for DSCR.
- **Paste from CIM** — Optional: paste CIM/financial text and extract revenue, EBITDA, addbacks via Replicate/Gemini (requires `REPLICATE_API_TOKEN`).
- **Draft LOI** — Prefilled draft with deal name, purchase price, multiple, adjusted EBITDA, equity/seller note/SBA breakdown (no AI; copy into your LOI template).

## Run locally

```bash
cd henway-deal-workspace
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **No env vars required** for core app (manual entry only).
- For **CIM extract**: add `REPLICATE_API_TOKEN` to `.env.local` (get from [Replicate API tokens](https://replicate.com/account/api-tokens)). Restart dev server.

## DSCR assumptions

- **Formula:** DSCR = (Adjusted EBITDA − owner compensation adjustment) ÷ total annual debt service.
- **Annual debt service:** Standard amortization: payment = P × r / (1 − (1+r)^(−n)); r = annual rate, n = years. Applied separately to SBA tranche, seller note tranche, and (if included) real estate tranche.
- **Thresholds:** Green ≥ 1.25, Yellow ≥ 1.15 and &lt; 1.25, Red &lt; 1.15. Some banks prefer 1.5; the app uses 1.25 as the green threshold.
- **Owner compensation adjustment:** Optional input that reduces cash flow used in DSCR (e.g. normalized owner salary).

## Tech stack

- Next.js 14 (App Router), React, TypeScript, Tailwind CSS.
- Persistence: browser `localStorage` (no database).
- Optional: Replicate (Gemini) for CIM extraction.

## Deploy to Railway (live app for Mike)

1. **Push the app to GitHub**
   - Create a new repo on GitHub (e.g. `henway-deal-workspace`), then run:
   ```bash
   cd henway-deal-workspace
   git init
   git add .
   git commit -m "Henway Deal Workspace MVP"
   git branch -M main
   git remote add origin https://github.com/Conward24/henway-deal-workspace.git
   git push -u origin main
   ```

2. **Create a Railway project**
   - Go to [railway.app](https://railway.app) and sign in.
   - **New Project** → **Deploy from GitHub repo**.
   - Select the `henway-deal-workspace` repo (or connect GitHub and choose it).
   - Railway will detect Next.js and run `npm install` and `npm run build`; it will use `npm start` to run the app.

3. **Add the Replicate token (for Paste from CIM)**
   - Open your service in Railway → **Variables**.
   - Add variable: `REPLICATE_API_TOKEN` = your token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).
   - Redeploy if the app was already deployed.

4. **Generate a public URL**
   - In your service: **Settings** → **Networking** → **Generate domain**.
   - You’ll get a URL like `https://henway-deal-workspace-production-xxxx.up.railway.app`.
   - Share this link with Mike. His deals are stored in his browser (localStorage) on the device he uses.

**Note:** No database or volume is required. Data stays in the user’s browser. If Mike uses another device or browser, he’ll see a fresh deal list unless you add a backend later.

## Using Mike’s materials (reference)

Mike’s shared zip (**Magnolia Company - Henway-20260226T221033Z-1-001.zip**) is for **your local development and tuning**, not for deploying to the live app.

1. **Unzip locally** into `henway-deal-workspace/reference/magnolia-materials/` (see [reference/README.md](reference/README.md)).
2. **CIM extraction:** Use 1–2 CIM PDFs (e.g. BP Magnetics, Fence) to copy-paste financial sections into `.txt` files, then refine the prompt in `src/app/api/extract-cim/route.ts` so extracted revenue, EBITDA, and addbacks match how Mike’s CIMs are written. Redeploy to Railway after changes.
3. **LOI draft:** Open **Barlow & Williams LOI Template.docx** and **LOI - BP Magnetics 3.5x OCF.docx**; align the in-app “Draft LOI” wording and fields (in `src/components/LoiDraftView.tsx`) with his real LOI so Mike can copy the draft into his template.
4. **External Cash Flow Model:** Use the Live Oak template (or a deal copy) to confirm the app’s inputs/outputs match his workflow; document any mapping in `reference/README.md`.

Keep `reference/magnolia-materials/` out of the repo if the files are confidential (e.g. add it to `.gitignore`); the live app on Railway does not need these files.
