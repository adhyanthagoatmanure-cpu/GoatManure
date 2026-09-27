# ADHYANTHA MySQL Migration Audit

Status: Audit complete. No production migration or schema changes were applied.

This report follows the safety rules in the project brief: no destructive database operations, no forced schema resets, no immediate migration, and no code changes beyond this audit artifact.

## A. Current database architecture

The application is currently configured for PostgreSQL, using Prisma and a local Docker development database.

Current configuration:
- `prisma/schema.prisma`
  - `datasource db { provider = "postgresql" }`
  - `url = env("DATABASE_URL")`
- `docker-compose.yml`
  - Local service uses `postgres:16-alpine`
  - Port `5432`
  - Database name `adhyantha`
- `.env.example`
  - `DATABASE_URL="...localhost:5432/adhyantha?schema=public"`

Current Prisma models cover the full commerce stack:
- Auth + user accounts: `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`
- Catalog: `Category`, `Product`, `ProductVariant`, `ProductBenefit`, `Review`
- Cart: `Cart`, `CartItem`
- Customer and order data: `Address`, `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `PaymentIntent`
- Promotions: `Coupon`, `CouponUsage`
- Content: `BlogPost`, `Testimonial`, `ContactMessage`, `NewsletterSubscriber`

The app is designed around Prisma transactions and JSON snapshots for order/address history. This is a good fit for MySQL, but the schema must be verified and migrated carefully because there are PostgreSQL-specific constructs in the committed migration and Prisma schema.

## B. Target MySQL architecture

Target production architecture for GoDaddy hosting:
- Hosted MySQL database on GoDaddy / cPanel-compatible platform
- Prisma datasource provider set to `mysql`
- `DATABASE_URL` using MySQL connection string format, for example:
  - `mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME`
  - or equivalent MySQL DNS / SSL-enabled connection string supported by the host
- Production app still served by Next.js, with MySQL replacing PostgreSQL as the data layer
- Local development can keep PostgreSQL temporarily while MySQL is validated, but the final deploy target should be MySQL

The application should continue to use:
- Prisma 6.12.0 (matching `package.json`)
- `@prisma/client` 6.12.0
- no Docker dependency in production
- HTTPS domain and environment variable-driven runtime config

## C. Prisma compatibility findings

High-level compatibility assessment:

The codebase is already mostly provider-neutral because it relies on Prisma operations, not raw SQL. Most models use common Prisma scalar types (`String`, `Int`, `Boolean`, `DateTime`, `Json`) and relation patterns that are supported by MySQL.

Compatible or generally MySQL-safe patterns found:
- `String @id @default(cuid())`
- `String @unique`
- `DateTime @default(now())`
- `DateTime @updatedAt`
- `Json` fields for order snapshots and payment payloads
- relation models with `onDelete: Cascade`, `SetNull`, and `Restrict`
- `@db.Text` for long-form strings
- enums such as `OrderStatus`, `PaymentStatus`, `Role`, etc.

Areas requiring explicit verification before migration:
- `String[] @default([])` on `Product.images`
- `Json` fields in MySQL are supported by Prisma, but must be reviewed for generated column types and query behavior
- `@db.Text` fields should be validated in the generated MySQL schema because Prisma/MySQL may map them to `TEXT`/`LONGTEXT` semantics
- Prisma-generated migration SQL must be regenerated rather than copied blindly from the PostgreSQL migration
- The project README says "Prisma 7" while the package manifest pins `prisma` and `@prisma/client` to `^6.12.0`; the migration project should align with the actual manifest unless a compatibility issue is actively discovered

## D. PostgreSQL-specific features found

The project has several PostgreSQL-specific items that must be translated or regenerated for MySQL.

1. Prisma datasource provider
   - `prisma/schema.prisma` currently uses:
     - `provider = "postgresql"`

2. PostgreSQL migration SQL features
   - `CREATE TYPE "Role" AS ENUM ...`
   - `CREATE TYPE "UserStatus" AS ENUM ...`
   - `CREATE TYPE "ProductStatus" AS ENUM ...`
   - `CREATE TYPE "DiscountType" AS ENUM ...`
   - `CREATE TYPE "OrderStatus" AS ENUM ...`
   - `CREATE TYPE "PaymentMethod" AS ENUM ...`
   - `CREATE TYPE "PaymentStatus" AS ENUM ...`
   - `CREATE TYPE "ShipmentStatus" AS ENUM ...`
   - `CREATE TYPE "BlogStatus" AS ENUM ...`
   - These are PostgreSQL-native enum declarations and will not run in MySQL as-is.

3. PostgreSQL array syntax
   - `"images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
   - `TEXT[]` is PostgreSQL-specific. MySQL does not use this syntax directly.

4. PostgreSQL JSONB usage
   - `shippingSnapshot JSONB NOT NULL`
   - `rawResponse JSONB`
   - `newAddress JSONB`
   - `items JSONB NOT NULL`
   - `JSONB` is PostgreSQL-specific. Prisma MySQL uses JSON-compatible storage with a different generated column type and runtime behavior.

5. PostgreSQL defaults and functions
   - `CURRENT_TIMESTAMP` is used in migration SQL
   - This works in PostgreSQL and is usually acceptable in MySQL, but it must be validated in the generated MySQL migration scripts

6. PostgreSQL-specific relation and migration style
   - `ON DELETE ... ON UPDATE ...` statements are common in Prisma, but the exact generated SQL differs for MySQL and should be generated by Prisma rather than copied from Postgres

7. PostgreSQL-specific SQL patterns not found in source code
   - No direct `$queryRaw` or `$executeRaw` usage was observed in the application source
   - No `pg` dependency was found in `package.json`
   - No `ILIKE`, `ON CONFLICT`, `RETURNING`, or raw PostgreSQL operators were found in the application source

Conclusion: the app is not using custom PostgreSQL SQL directly, but the committed Prisma migration and schema are strongly PostgreSQL-oriented. The main migration risk is not raw SQL in the app — it is the generated migration dialect and provider-specific column types.

## E. Files that must change

The following files are directly relevant to the database migration and should be reviewed or updated during implementation:

1. `prisma/schema.prisma`
   - change datasource provider from `postgresql` to `mysql`
   - review `String[]`, `Json`, `@db.Text`, and enum mapping

2. `prisma/migrations/20260908054500_init/migration.sql`
   - PostgreSQL-specific migration SQL must be replaced or regenerated for MySQL

3. `prisma/migrations/20260916202638_add_payment_intents/migration.sql`
   - `JSONB` and PostgreSQL-specific SQL must be reprovisioned for MySQL

4. `prisma/migrations/20260916203141_add_payment_intent_order_link/migration.sql`
   - must be regenerated for MySQL compatibility

5. `.env.example`
   - update `DATABASE_URL` to MySQL format and document required production variables

6. `docker-compose.yml`
   - if local MySQL development is kept, replace the Postgres service with a MySQL service or leave it as a temporary fallback while the MySQL path is validated

7. `README.md`
   - update the stack description, local setup commands, and deployment notes to MySQL/GoDaddy

8. Potentially `package.json`
   - no dependency removal/addition is required at present based on the code audit; the project already uses Prisma without a direct `pg` package
   - if Prisma driver compatibility issues are discovered later, only then should package changes be made

9. `src/lib/prisma.ts`
   - likely no app-code change required, but it should be validated under MySQL runtime conditions

10. `prisma/seed.ts`
   - no SQL dialect issue observed; it uses Prisma client calls, but it should be re-run and validated after migration

## F. Prisma schema change required

The mandatory schema migration change is:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Additional model-level review items:
- `Product.images` is an array field and should be tested against MySQL behavior in Prisma
- `Json` fields should be validated for correct generated type and serialization
- `@db.Text` should remain only where necessary and be checked against the actual MySQL generated schema
- Enum values are valid, but generated column types must be checked under MySQL
- String IDs using `cuid()` remain acceptable in MySQL and should not be replaced unless required by a compatibility issue
- `@default(now())`, `@updatedAt`, and relation cards are all standard Prisma usage and should work in MySQL

MySQL migration execution should not be attempted until the Prisma migration schema is regenerated from the correct provider, because the checked-in `migration.sql` files are PostgreSQL-specific.

## G. Raw SQL queries requiring modification

Search results showed no application-level raw SQL or PostgreSQL-specific database calls in the source tree.

No direct use of:
- `$queryRaw`
- `$executeRaw`
- `pg` client
- `ILIKE`
- `ON CONFLICT`
- `RETURNING`
- `::uuid`, `::text`, `::json` casts
- `JSONB`
- `ARRAY[]::TEXT[]`

The raw SQL that does require attention is the committed Prisma migration SQL under `prisma/migrations/*.sql`, which is PostgreSQL-specific and must be replaced or regenerated for MySQL.

## H. Packages to add/remove

From the current audit:
- `prisma` package is already present at `^6.12.0`
- `@prisma/client` is already present at `^6.12.0`
- no `pg` package is declared in the app manifest
- no direct MySQL driver package is required because Prisma owns the database driver layer

Recommendation:
- keep Prisma at `6.12.0` unless a concrete compatibility problem is demonstrated by the MySQL migration workflow
- do not add unnecessary database driver packages before the Prisma migration is validated

## I. Migration risks

Primary risks for this project:

1. PostgreSQL-only migration SQL in the repository
   - most important risk.

2. Array field compatibility
   - `Product.images` uses `String[]` and may need schema review under MySQL.

3. JSON field semantics
   - order/address snapshots and payment payloads use `Json` and may behave slightly differently under MySQL.

4. Prisma-generated SQL vs hand-authored migration drift
   - using the old PostgreSQL migration files may cause migration failure or data inconsistency.

5. Local dev + production mismatch
   - if local PostgreSQL is left active while prod is switched to MySQL, configuration drift can hide deployment errors.

6. Data type mismatches in payment/order records
   - `Int` values, snapshots, and statuses should be validated across a real migration test before go-live.

7. GoDaddy hosting constraints
   - connection string, SSL settings, and DB permissions must be validated in the host environment; not all cPanel MySQL setups behave the same way.

## J. Data migration strategy

Recommended safe data migration flow:

1. Keep the current PostgreSQL database as the source of truth.
2. Export production-safe data using a dump or database export tool.
3. Validate the output data model before import:
   - users
   - products
   - variants
   - orders
   - coupon usages
   - payment intents
   - blog/testimonial/content records
4. Create a fresh MySQL database in the GoDaddy environment.
5. Run Prisma migration against the new MySQL database.
6. Import data with schema translation for Postgres-only fields.
7. Check row counts and unique key integrity.
8. Validate core flows:
   - user registration/login
   - product browsing
   - cart/checkout
   - order placement
   - payment status
   - admin views and updates
   - coupon validation
   - order notifications

Important: the repo must not be destructively altered during this phase. The migration should be incremental and reversible.

## K. GoDaddy deployment requirements

For GoDaddy hosting, expected deployment requirements include:
- a MySQL database instance or plan compatible with the application
- a production `DATABASE_URL` compatible with Prisma MySQL connection strings
- HTTPS enabled on the domain
- Node.js runtime supported by the host
- environment variables loaded from the hosting environment
- no reliance on Docker in production
- Prisma generation and migration commands executed in the production deployment steps or at app startup
- a production-appropriate `NEXTAUTH_SECRET`
- secure credentials for SMTP, Razorpay, social login, and WhatsApp if enabled

The app is already designed to fail gracefully when optional integrations are missing, which is good for production readiness, but the database migration still requires a real MySQL validation before deployment.

## L. Environment variable requirements

Required or likely required variables for the MySQL migration:

- `DATABASE_URL` — must point to the MySQL database
- `NEXTAUTH_SECRET` — production auth secret
- `NEXTAUTH_URL` — production domain URL
- same existing optional variables remain in place for:
  - Google OAuth
  - Facebook OAuth
  - Razorpay
  - SMTP
  - WhatsApp
  - Admin email notification

Example placeholders:

```bash
DATABASE_URL="mysql://user:password@host:3306/adhyantha"
NEXTAUTH_URL="https://www.yourdomain.com"
NEXTAUTH_SECRET="replace-with-production-secret"
```

Do not commit real secrets into source control. This project already follows that pattern in `.env.example` by using placeholders and not real values.

## M. Testing plan

The migration should be validated in this order:

1. Prisma validation
   - `npx prisma validate`
   - `npx prisma generate`

2. MySQL migration execution
   - `npx prisma migrate deploy` against a MySQL database

3. Seed validation
   - `npm run db:seed`
   - verify product catalog, admin account, demo account, coupon, and demo content load correctly

4. Transactional smoke tests
   - login and auth flows
   - product listing
   - cart and checkout
   - order creation and stock decrement
   - coupon validation
   - order status updates

5. Admin workflow tests
   - product management
   - order management
   - customer management
   - coupon management
   - blog/testimonial updates

6. Payment/notification smoke tests
   - Razorpay integration readiness
   - email and WhatsApp notification path verification

7. Production readiness checks
   - domain HTTPS works
   - database connectivity works from the host
   - Prisma connection pool is stable
   - application boots without the local Postgres container dependency

## N. Rollback plan

If the MySQL migration fails during validation:

1. Keep the original PostgreSQL database intact and unchanged.
2. Restore the previous `.env` and `DATABASE_URL` value to the PostgreSQL config.
3. Revert the migration changes in source control to the last known stable state.
4. Re-run the previous PostgreSQL deployment path.
5. Keep the MySQL database isolated and not used for production until the migration is validated.
6. Preserve the original Prisma schema and migration files as backups before any MySQL conversion work.

Rollback should be low-risk because the project is currently stable on PostgreSQL and the migration work has not yet started.

## Audit conclusion

The application is not blocked by raw PostgreSQL SQL in business logic. The main blocker is provider-specific Prisma schema and migration SQL: the project currently models and migrates PostgreSQL, not MySQL.

The migration path is feasible and low-risk if handled carefully, but it must be executed in a controlled sequence:
1. audit complete, 2. review and approval, 3. create safe MySQL migration branch, 4. regenerate Prisma migrations for MySQL, 5. validate against a real MySQL database, 6. deploy only after verification.

No implementation changes were made in this audit-only phase.
