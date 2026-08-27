# AI Website Review Process

## Goal

Sell a paid AI Website Review with minimal manual intake, generate an editable report draft, approve it, then email the customer a polished final report and next-step service options.

## Current Implementation

- Sales page: `/ai-website-review`
- Checkout redirect endpoint: `/api/review-checkout`
- Post-purchase intake page: `/review-intake`
- Intake email endpoint: `/api/review-intake`
- Intake confirmation page: `/review-intake-success`
- Editable report template: `docs/templates/ai-website-review-report.md`

## Required Environment Variables

```env
RESEND_API_KEY=
AI_REVIEW_PAYMENT_LINK=
```

`AI_REVIEW_PAYMENT_LINK` should point to the Stripe Payment Link or checkout URL for the $297 AI Website Review.

Recommended Stripe payment link settings:

- Product: AI Website Review
- Price: $297 AUD
- Success URL: `https://securebusinessai.com.au/review-intake?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `https://securebusinessai.com.au/ai-website-review`
- Collect customer email in checkout

## Workflow

1. Customer clicks Buy Review on `/ai-website-review`.
2. `/api/review-checkout` redirects them to the configured payment link.
3. After payment, Stripe redirects them to `/review-intake`.
4. Customer submits website URL, business name, priority, and notes.
5. `/api/review-intake` emails Secure Business AI and sends the customer a confirmation.
6. Internal report draft is generated from:
   - customer intake
   - website homepage content
   - page structure, headings, links, behind-the-scenes website setup, and calls to action
   - internal AI search readiness checks
   - Secure Business AI service fit
7. Draft report is created in an editable format.
8. Human review approves or edits recommendations.
9. Final report is emailed to customer with a call-to-action for implementation help.

## Customer-Facing Language Rules

- Do not cite audit tools, scanner names, prompts, internal scoring rubrics, or competitor/reference sites in customer reports.
- Keep technical checks internal unless the customer needs to act on them.
- Translate jargon into business outcomes.
- Prefer "make it easier for customers and AI tools to understand what you do" over "answer-engine optimization."
- Prefer "behind-the-scenes website setup" over "schema", "metadata", or "JSON-LD."
- Prefer "clear service summaries" over "structured data."
- Prefer "easy-to-read question and answer sections" over "FAQ schema."
- Prefer "plain-language AI summary page" over "`llms.txt`."
- Reports should be editable drafts first. Before sending, remove internal notes and simplify anything that sounds like a developer wrote it.

## Recommended Editable Report Format

Use Google Docs for the customer-ready draft because it is easy to edit online, share, export as PDF, and duplicate from a template.

Alternative formats:

- Markdown draft in the repo or admin workspace
- `.docx` generated from Markdown
- Notion page duplicated from a template

## Report Sections

1. Executive summary
2. Overall score and category scores
3. Top 5 priorities
4. Website conversion review
5. AI search readiness
6. Trust, proof, and local business signals
7. Lead capture and follow-up review
8. AI opportunity map
9. Recommended Secure Business AI services
10. Suggested next step

## Recommended Service Options To Include

The report should recommend only relevant offers, not every offer.

- AI Website Fix Sprint: rewrite hero, offer clarity, CTAs, trust sections, and contact flow
- Website + AI Chatbot: when the site needs better self-serve answers or qualification
- AI Voice Receptionist: when missed calls, slow response, or after-hours enquiries are a clear issue
- AI Business Starter Pack: when the business needs safer internal AI adoption and team workflows
- AI Business Bundle: when several issues need one coordinated implementation path

## Automation Roadmap

### Phase 1: Manual assisted

- Stripe Payment Link
- Intake form
- Email notification
- Manually run website audit
- Manually create Google Doc from template
- Manually send approved report

### Phase 2: Semi-automated draft

- Add Stripe webhook to create an order record
- Add storage for intake submissions
- Add script/API to fetch website HTML and generate audit JSON
- Generate Markdown report draft from template
- Email internal approval link

### Phase 3: Editable online approval

- Create Google Doc from template automatically
- Insert generated report sections
- Send owner review link
- Add approve/send action
- Send customer email with final PDF or Google Doc link

### Phase 4: Customer delivery and upsell

- Track delivery status
- Add follow-up email sequence
- Add implementation quote options
- Add dashboard of orders, draft status, and conversion outcomes

## Open Decisions

- Use Stripe Payment Links first or build custom Stripe Checkout?
- Store orders in Vercel KV, Supabase, Airtable, Google Sheets, or another tool?
- Use Google Docs or `.docx` as the primary editable format?
- Send final report as PDF attachment, Google Doc link, or both?
- Keep Deployment Protection on previews, or disable it for easier customer testing?
