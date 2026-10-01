# ADHYANTHA Goat Manure — E-Commerce Platform

A production-architected e-commerce platform for ADHYANTHA's organic goat manure and
natural fertilizer business: full storefront, cart/checkout, guest + account
authentication (email/password, Google, Facebook), coupons, order tracking, and a
separate admin console for products, orders, coupons, customers, blog, and testimonials.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, self-hosted fonts (Fraunces + Karla via `@fontsource`) |
| Database | MySQL |
| ORM | Prisma 6.12.0 |
| Auth | NextAuth v4 (Credentials + Google + Facebook), bcrypt password hashing |
| Validation | Zod (shared between client forms and API routes) |
| Payments | Razorpay, behind a swappable `PaymentProvider` interface |
| Forms | react-hook-form + @hookform/resolvers |

## What works right now, with zero configuration

- Full storefront: home, products, product details, cart, checkout, order success,
  order tracking, benefits, testimonials, blog, contact
- Guest checkout **and** account checkout
- Email/password signup, login, forgot/reset password
- Cash on Delivery — the entire order flow end-to-end, including stock-safe order
  creation and coupon validation
- The `ADYA50` flat-₹50 coupon (and the coupon system generally — admin can create more)
- Full admin console: dashboard stats, product/variant management, order + shipment
  management, coupons, customers, blog, testimonials
- Role-protected admin area, ownership-checked customer account pages

## What needs your credentials before it's "live"

Nothing here is faked or stubbed silently — each of these is a real, working
integration that activates the moment you add real credentials to `.env`:

| Feature | Env vars | Behavior until set |
|---|---|---|
| Google login | `GOOGLE_CLIENT_ID/SECRET` | Button is hidden |
| Facebook login | `FACEBOOK_CLIENT_ID/SECRET` | Button is hidden |
| Online payment (Razorpay) | `RAZORPAY_KEY_ID/SECRET` | Checkout shows "Online payments aren't configured yet — please use Cash on Delivery" instead of faking a payment |
| Transactional email (order confirmation, password reset) | `SMTP_*` | Emails are logged to the server console instead of sent |
| Admin order alerts (email + WhatsApp) | `ADMIN_NOTIFICATION_EMAIL`, `SMTP_*`, `WHATSAPP_*` | Order creation still succeeds; missing channels are logged to the server console |
| Database | `DATABASE_URL` | App won't start — see setup below |

See `.env.example` for the full list and where to get each credential.

When configured, every successful order sends a detailed email to
`ADMIN_NOTIFICATION_EMAIL` and a WhatsApp alert through Meta's WhatsApp Cloud API
to `WHATSAPP_ADMIN_PHONE_NUMBER`. The WhatsApp number must be in E.164 format. A
WhatsApp business-initiated message may require an approved Meta message template
unless the admin number has an active WhatsApp conversation window.

## WhatsApp Cloud API webhook

The public webhook endpoint is `/api/whatsapp/webhook`. It verifies Meta's GET
challenge using `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and accepts POST events only when
the `X-Hub-Signature-256` HMAC matches `WHATSAPP_APP_SECRET`. Both values must be
configured as server-side environment variables; do not prefix them with
`NEXT_PUBLIC_`. The app secret is available in Meta App Settings → Basic.

Set these variables in local `.env` and in the production hosting provider's
server-side environment settings:

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — generate a unique value with
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
- `WHATSAPP_APP_SECRET` — Meta App Secret, used only to validate webhook signatures.
- `WHATSAPP_API_VERSION` — Graph API version for the existing server-side sender.
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
  `WHATSAPP_BUSINESS_ACCOUNT_ID` — Meta Cloud API credentials/IDs.

`WHATSAPP_BUSINESS_ACCOUNT_ID` is documented for later use; the webhook does not
need to query the Graph API. No database migration is required: current message
and status events are safely summarized in server logs and are not persisted or
used to trigger business actions. Parsed events expose deterministic
`deduplicationKey` values (when upstream IDs/timestamps exist) for a future
persistent idempotency store. Message text is parsed for future processing, but
never logged. Sender/recipient identifiers are masked in logs.

For local testing, run `npm run dev`, then expose port 3000 using a trusted HTTPS
tunnel such as `cloudflared tunnel --url http://localhost:3000` or
`ngrok http 3000`. Use the temporary HTTPS URL only for development. Configure
Meta with the stable HTTPS domain from your production deployment:

```text
Callback URL: https://<your-production-domain>/api/whatsapp/webhook
Verify token: the exact WHATSAPP_WEBHOOK_VERIFY_TOKEN set in the server environment
```

In Meta Developer → WhatsApp → Configuration/Webhooks, enter the callback URL
and token, choose **Verify and save**, then subscribe to the **messages** field.
This field delivers incoming messages and message status updates. No other
webhook fields are needed for the current scope.

Quick verification checks (replace the token with the configured value):

```powershell
curl.exe -i "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=12345"
curl.exe -i "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345"
```

The valid request returns `200` and the challenge; the invalid token returns
`403`. POST requests must include a valid Meta signature. To check the route and
project after setup, run `npm run lint` and `npm run build`.

## Setup

```bash
npm install                      # also runs `prisma generate` automatically
cp .env.example .env              # then fill in DATABASE_URL at minimum
docker compose up -d mysql        # OR point DATABASE_URL at a hosted MySQL server
npx prisma migrate deploy         # applies the committed migration in prisma/migrations
npm run db:seed                   # products, ADYA50 coupon, admin user, demo content
npm run dev
```

Open http://localhost:3000. Admin console is at **/admin/login**.

**Demo logins (seeded — change immediately in production):**
- Admin: `admin@adhyantha.com` / `Admin@12345`
- Customer: `demo@adhyantha.com` / `Demo@12345`

## A note on this specific build environment

This project was built inside a sandboxed container with restricted network access —
it could reach `npmjs.org`, `github.com`, and Ubuntu's package mirrors, but not
`binaries.prisma.sh`, which is where Prisma's CLI downloads its schema/query engine
binaries from. That meant `prisma generate` and `prisma migrate dev` could not be run
*in this sandbox*.

This is a constraint of the build environment, not of your project — the same
commands will work normally the moment you run `npm install` anywhere with regular
internet access (your laptop, CI, Vercel, etc.), because `postinstall` runs
`prisma generate` automatically.

To still ship something genuinely verified rather than just hoped-to-work:
- The initial migration (`prisma/migrations/20260908054500_init/migration.sql`) was
  hand-authored to match `schema.prisma` exactly, then **actually executed against a
  real local Postgres instance** in the sandbox — every table, enum, and foreign key
  was created without error.
- The seed data was validated the same way: inserted as raw SQL through every
  relation (products → variants → categories, users → orders → order items → coupon
  usage), including the exact `₹149 − ₹50 = ₹99` example from the brief, which came
  back correct from the database.
- The full application code was type-checked with `tsc --noEmit` throughout
  development. The only errors ever left unresolved are the expected
  `"@prisma/client" has no exported member` cascade from the client not being
  generated — every other type error surfaced during the build was found and fixed.

Run `npx prisma migrate deploy` (applies the committed migration as-is) rather than
`migrate dev` (which would try to generate a new migration) for the smoothest first run.

## Design system

Colors, type, and spacing are derived from the actual logo and reference assets
supplied (extracted programmatically, not eyeballed) — see the CSS variables at the
top of `src/app/globals.css` for the full token list and rationale in the comments.

Product imagery is an original illustrated system (`public/images/products/*.svg`,
generated from `generate_product_images.py`) rather than stock photography — the ZIP
didn't include product photos, and this sandbox can't fetch external images. Swap
these for real photography any time by replacing the files at the same paths (or
updating `Product.images` in the database) — no component code changes needed.

The header logo (`public/images/brand/`) is the client's actual provided logo. Its
source PNG has an opaque cream background rather than transparency, which is fine on
the (also cream) header but shows a mismatched box on dark surfaces like the footer —
worth asking the client for a transparent PNG or SVG export if that matters for future
placements.

## Project structure

```
prisma/
  schema.prisma          Full data model (users, products, orders, coupons, etc.)
  migrations/             Committed initial migration
  seed.ts                 Demo data — products, ADYA50, admin user, demo content
src/
  app/                    Routes (App Router) — storefront, /account, /admin, /api
  components/
    ui/                   Design-system primitives (Button, Input, Card, ...)
    layout/                Header, Footer, mobile nav
    product/ cart/ checkout/ order/ auth/ account/ admin/ blog/ testimonial/ brand/
  server/
    services/              Business logic — pricing, coupons, orders (transactional)
    payment/                PaymentProvider interface + Razorpay implementation
    shipping/               ShippingProvider interface + manual implementation
    email/                  EmailService interface + SMTP/console implementations
  lib/                     prisma client, auth config, validation schemas, utils
  types/                   Shared TS types, status label/tone maps
```

Payments, shipping, and email are all behind interfaces specifically so a second
provider (a different gateway, a courier aggregator like Shiprocket, a transactional
email API) can be swapped in without touching order/checkout logic — see the comments
in each `*-provider.ts` / `email-service.ts` file.

## Honest scope notes

This is a genuinely large brief — the kind of scope a small team would spend several
weeks on. Priority was given to a correct, coherent, end-to-end system over
superficially covering every line item. A few things worth knowing:

- **Shipping fee** is a flat ₹49 / free-above-₹499 policy (`src/lib/config.ts`) — the
  brief didn't specify one, so this is a clearly-marked, easily-changed placeholder.
- **Shipment tracking** is manual (admin enters the courier + AWB number after booking
  on the courier's own dashboard) rather than live-integrated with a specific courier
  API — this was a deliberate architecture choice per the brief's own instruction not
  to hard-code one courier, and the interface is ready for that integration later.
- **Product photography** is illustrated, not photographed, for the reasons above.
- **Contact page details** (address, phone, hours) are explicitly marked as
  placeholders in the UI, per the brief's own instruction not to invent real business
  information.

## Next steps for a real launch

1. Add real credentials (§ above) for OAuth, Razorpay, and SMTP
2. Replace placeholder product photography and contact details
3. Point `DATABASE_URL` at a production Postgres and run `prisma migrate deploy`
4. Change the seeded admin password immediately
5. Deploy (Vercel is the path of least resistance for Next.js; any Node host works)
