# Launch structure + Starter Guide review

**Prepared:** 20 August 2026 · Advisory only — no site or product changes made from this document.

This covers two requests: (A) a review of the AI Starter Guide draft with suggested changes, and (B) a proposed page structure for a proper launch, including individual product pages under Services and a real Pricing page, informed by an audit of the site's current internal links.

---

## Part A — AI Starter Guide review

Source reviewed: `docs/AI_Starter_Guide_Draft.docx` (draft v0.1, ~2,300 words). Overall this is a strong, on-brand draft: plain-English, practical, well-sequenced, and careful with claims ("often", "may", "can" rather than guarantees). The structure (what AI is → what it's doing → cost of waiting → where to start → tools → stages → opportunity map → checklist → next steps) is exactly right for a low-risk entry product. The suggestions below are about tightening, trust, and closing the gap to a sellable PDF.

### Must-fix before selling

1. **Length vs promise.** The draft's own note promises "a 30-50 page designed PDF", but the current content is ~2,300 words — roughly 8-12 designed pages. Either expand the content (worked examples, a full case walkthrough, diagrams, glossary, resource links, fillable worksheets) or revise the promise to something honest like "a focused 18-25 page guide". Selling a "30-50 page" guide that arrives at 10 pages is a refund/complaint risk.

2. **Product-name consistency.** The guide and its brief use several names for the same things: "AI Business Starter Pack" (brief), "Starter Pack" (section 4 table and score table), "AI Business Bundle" and "Secure AI Onboarding" (website). Pick one canonical set of product names and use them everywhere — guide, brief, site, Stripe, and enquiry dropdowns. Name drift confuses buyers and muddies analytics. (See Part B for the proposed canonical list.)

3. **Next Steps should point to real products, prices, and links.** The "Next Steps" section currently gives generic advice ("Start with an AI Website Review") with no price, no link, and — notably — omits the **AI Readiness Pack**, which is your one fully live paid product. In the designed PDF these should be concrete: product name, one-line outcome, price, and a URL/QR to the matching page.

### Recommended improvements

4. **Add an "About Secure Business AI" panel.** A paid guide converts better with visible authorship: who you are, Melbourne/Australian focus, the "secure-first" philosophy, and a contact/URL. Currently the author is nearly invisible after the cover.

5. **Lean into "secure" — it's your differentiator and it's underused.** The guardrails section (section 5) is good; extend it with a short, practical "AI ground rules for your team" one-pager (approved answers, escalation, privacy boundaries, what AI must never do) and a note on Australian customer-privacy expectations. This is both useful and on-brand, and nobody else's starter guide will have it.

6. **Add one end-to-end worked example.** A single named-but-fictional business (e.g. a Melbourne cleaning company) taken from "missed calls" → "voice receptionist + website answers" → outcome makes the abstract concrete and models the buyer's own journey. It also naturally fills pages toward the length target.

7. **Make the worksheets fillable.** The "AI Opportunity Map" (section 7) and the Self-Assessment (section 8) are the most valuable parts. In the PDF, make them genuine fill-in pages (form fields or print-and-write), and consider offering the Opportunity Map as a standalone lead magnet — it's a natural funnel into the AI Website Review.

8. **Soften the fear framing slightly.** The brand rule is "reassuring, not hype", but the title and a few lines ("why you cannot afford to wait", "cost you") lean urgency/fear. The title is a deliberate hook and can stay, but balance it with the calmer "AI should make the business easier to run or easier to buy from" promise early and often.

9. **Tie the score bands to the funnel.** The scoring table already suggests next steps; align those names to the canonical products and add the price + link so a "10+" reader has an obvious, low-friction path to buy.

### Notes / dependencies

10. **Delivery is manual today.** The brief assumes the PDF auto-delivers after checkout. Right now there is no Stripe product/price/payment link for the Guide at all (confirmed in Stripe — only the Readiness Pack exists), so both the payment and the automated PDF delivery need building before the "Buy the Guide - $47" button is truthful. Until then the button correctly falls back to an enquiry (I wired that earlier).

11. **Claims are careful — keep them that way.** No guaranteed rankings/results appear in the draft. Maintain that discipline as examples are added.

---

## Part B — Proposed launch page structure

### What exists today

Public/indexable: `/` (Coming Soon), `/ai-starter-guide`, `/supplier-ai-readiness` (the AI Readiness Pack), `/ai-website-review`, `/contact`. Plus `/development` (a fuller priced ladder, `noindex`, not in nav but publicly reachable) and the transaction/intake/success pages (`noindex`).

Three structural gaps, all matching what you flagged:

- **No standalone pages** for four of the seven offers — Secure AI Onboarding, AI Voice Receptionist, Website + AI Chatbot, and AI Business Bundle exist only as cards on `/development` and as links to `/contact`.
- **"Pricing" is not a page.** Every page's nav points at `/#pricing`, which just scrolls to a section on the Coming-Soon homepage. There is no standalone, comparable pricing page.
- **"Services" is not a page either** — `/#services` is a homepage anchor, so there's no hub that lists and links all the offers.

Plus two carry-over issues from the earlier review: the flagship product lives at the legacy slug `/supplier-ai-readiness`, and `/development` duplicates the whole ladder.

### Link audit — current internal linking (summary)

Across all pages, the header nav is identical: `Services (/#services)`, `How It Works (/#how)`, `Pricing (/#pricing)`, `Starter Guide`, `AI Readiness`, `Website Review`, `Contact`. `/contact` is by far the most-linked destination (7-10 links/page). The four "coming soon" offers have **no inbound links except to `/contact`**. `/development` is the only place the full ladder is cross-linked, and it links within itself (`/development#pricing` etc.). Header/footer are copy-pasted into all 14 HTML files (no template), so every structural change today means editing every file.

### Proposed information architecture

```
/                         Home (real homepage at launch; replaces Coming Soon)
├── /services             Services hub — overview + links to all products
│    ├── /ai-starter-guide            AI Starter Guide            $47
│    ├── /ai-readiness-pack           AI Readiness Pack           $495   (301 from /supplier-ai-readiness)
│    ├── /ai-website-review           AI Website Review           $297
│    ├── /secure-ai-onboarding        Secure AI Onboarding        from $997      (NEW)
│    ├── /ai-voice-receptionist       AI Voice Receptionist       $497 + $247/mo (NEW)
│    ├── /website-ai-chatbot          Website + AI Chatbot        from $1,997 + $97/mo (NEW)
│    └── /ai-business-bundle          AI Business Bundle          from $2,497    (NEW)
├── /pricing              Real pricing page — all products compared, links to each
├── /about               Company, Melbourne/Australian, secure-first, ABN, trust (NEW)
├── /contact             Enquiry (exists)
├── /privacy             Privacy Policy (NEW — needs owner/legal content)
└── /terms               Terms & refund policy (NEW — needs owner/legal content)

Unchanged, kept out of nav + sitemap (noindex):
  /ai-readiness-start, /ai-readiness-payment-success, /ai-readiness-details,
  /contact-success

Retire or 301 at launch (with owner approval):
  /development            → fold content into / and /services, then 301 to /
  /supplier-ai-readiness  → 301 to /ai-readiness-pack
  /review-intake*, /ai-readiness-intake*  → 301 to supported paths (/ai-website-review, /ai-readiness-start)
```

### Product page template (use for all seven)

Each product page should follow one consistent pattern so they feel like a family and are easy to maintain: hero (name, one-line outcome, price, primary CTA) → who it's for → what's included → how it works (3 steps) → what you receive → FAQ → price + CTA band → related products (upgrade paths). This mirrors the existing `/ai-website-review` and `/supplier-ai-readiness` pages, which are already close to this shape — the four new pages should copy it.

### Navigation and linking rules

- **New header nav:** `Home · Services · Pricing · Starter Guide · About · Contact`. Change `/#services` → `/services`, `/#pricing` → `/pricing`. Keep `How It Works` as a homepage section (`/#how`) or move it under `/services`.
- **Services hub** links to all seven product pages; every **product page** links back to `/pricing`, to `/contact`, and to 1-2 related products (the upgrade paths already named in the guide/brief).
- **Pricing page** links out to each product page (two-way), with a clear "most popular" marker and honest "available now" vs "enquiry / coming soon" labels so nothing looks broken.
- **Breadcrumbs:** `Home > Services > [Product]` on each product page (also powers BreadcrumbList schema).
- **Footer:** group into Services (all 7), Company (Home, About, Pricing, Contact), and Legal (Privacy, Terms).

### SEO for the new pages

Unique title, meta description, self-referencing canonical, and Open Graph per page (the pattern I just added to the five existing public pages). Add JSON-LD: `Service`/`Product` + `Offer` (with price) on each product page, `FAQPage` where FAQs exist, `BreadcrumbList` on product pages, and `Organization` + `LocalBusiness` (Melbourne) sitewide. Add `/services`, `/pricing`, `/about`, and all product pages to `sitemap.xml`; keep transaction, private, success, API, and any dev routes out.

### Maintainability — do this before adding pages

Because the header and footer are duplicated across every HTML file, going from 5 to ~12 pages will make hand-editing error-prone (the enquiry-dropdown and nav drift already seen is a symptom). Recommend a small build-time include: move the header/footer/nav into partials and have `scripts/build-static.js` assemble pages, so nav/footer change in one place. This is a modest change to the existing build step and pays for itself immediately at launch scale.

### Owner decisions this depends on

1. **Confirm the canonical product list and names** (proposed above) — this is the single most important input; it drives pages, nav, pricing, Stripe, and the guide.
2. **Confirm launch prices** for all seven (I've carried the `/development` figures forward as a starting point — please verify).
3. **Which are "buy now" vs "enquiry only"** at launch. Realistically only the Readiness Pack is transaction-ready today; the Guide and Review need Stripe products/links, and Onboarding/Voice/Chatbot/Bundle are naturally quote-based.
4. **Launch vs Coming Soon** for the homepage, and whether to retire `/development`.
5. **Legal content** for `/about`, `/privacy`, `/terms` (entity, ABN, refund position) — needed before those pages and before Product/Offer schema.

### Suggested build order

Phase 1 (structure, low risk): add the header/footer partial + build change; create `/services` hub and `/pricing` page using existing prices; add `/about`, `/privacy`, `/terms` shells pending content. Phase 2: build the four new product pages from the template. Phase 3: switch nav to `/services` + `/pricing`, add schema, update `sitemap.xml`, 301 the legacy slugs, and retire `/development`. Phase 4: flip the homepage from Coming Soon to launch. Each phase is independently shippable and verifiable with `npm run lint / test / build`.
