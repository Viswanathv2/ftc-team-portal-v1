# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Team records

Authenticated members can use `/parts-inventory` to maintain shared parts, lending,
field, storage, and condition records. The `/expenses` page provides a shared
expense ledger with editing, removal, receipts, and totals.

Both pages display an audit history. The database trigger records the authenticated
member, timestamp, action, and before/after snapshots for every create, update, and
delete operation.

Each page has an `Export spreadsheet` button that downloads a UTF-8 CSV file that
opens in Excel, Google Sheets, and similar spreadsheet tools. Inventory records
enforce that a part cannot be both lent to someone and marked as currently in the
field.

Before using these pages in a new Supabase project, apply
`db/migrations/05_inventory_expenses_and_audit.sql` after the existing migrations.
If the migration was already applied, run the current file again so the inventory
constraint and latest database policies are installed.

## Sponsor payments

The sponsor form supports Zelle, Cash App, Venmo, and credit/debit cards. Set the
wallet handles and QR image URLs from `.env.example` using the team accounts. QR
images may be stored in `public/`.

Card payments use the Netlify function at
`netlify/functions/create-checkout-session.js`, which creates a hosted Stripe
Checkout session for the selected amount. Set `STRIPE_SECRET_KEY` in Netlify
environment variables; do not prefix it with `VITE_` and do not put it in client
code. Sponsors enter card details only on Stripe's hosted page.

Configure Stripe to send `checkout.session.completed` events to
`/.netlify/functions/stripe-webhook`. Set `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`,
and the server-only `SUPABASE_SERVICE_ROLE_KEY` for that function so paid sponsor
records are marked `paid`.

Apply `db/migrations/06_sponsorship_payments.sql` after the existing migrations to
store the selected payment method, amount, and payment status with the sponsor
inquiry.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
